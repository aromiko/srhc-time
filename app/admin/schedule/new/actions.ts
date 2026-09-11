"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { eachDateISO, resolveWeekStart } from "@/lib/calendar-utils";

export async function assignSchedule(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const shiftTypeId = String(formData.get("shift_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const dates = eachDateISO(startDate, endDate);

  if (!userId || !shiftTypeId || dates.length === 0) {
    redirect(
      withError(
        "/admin/schedule/new",
        "Please pick an employee, shift, and a valid date range.",
      ),
    );
  }

  const { error } = await supabase.from("schedules").upsert(
    dates.map((date) => ({
      user_id: userId,
      shift_type_id: shiftTypeId,
      date,
      notes,
      assigned_by: adminId,
    })),
    { onConflict: "user_id,date,shift_type_id" },
  );

  if (error) {
    redirect(withError("/admin/schedule/new", error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  // Land on the week the assignment starts in, with that day's accordion
  // already open, so the admin sees what they just assigned right away.
  const targetWeek = resolveWeekStart(startDate);
  redirect(
    withSuccess(`/admin/calendar?w=${targetWeek}&open=${startDate}#schedule`, "Schedule assigned."),
  );
}
