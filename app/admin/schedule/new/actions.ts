"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { resolveWeekStart } from "@/lib/calendar-utils";

function eachDateISO(startDate: string, endDate: string): string[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const dates: string[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return dates;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate(),
      ).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

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
    { onConflict: "user_id,date" },
  );

  if (error) {
    redirect(withError("/admin/schedule/new", error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  // Land on the week the assignment starts in, so the admin sees what they
  // just assigned instead of whatever week they happened to be on before.
  const targetWeek = resolveWeekStart(startDate);
  redirect(withSuccess(`/admin/calendar?w=${targetWeek}`, "Schedule assigned."));
}
