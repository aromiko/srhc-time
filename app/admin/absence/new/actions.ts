"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { eachDateISO } from "@/lib/calendar-utils";

export async function recordAbsence(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const dates = eachDateISO(startDate, endDate);

  if (!userId || dates.length === 0) {
    redirect(
      withError("/admin/absence/new", "Please pick an employee and a valid date range."),
    );
  }

  const { error } = await supabase.from("absences").upsert(
    dates.map((date) => ({
      user_id: userId,
      date,
      reason,
      recorded_by: adminId,
    })),
    { onConflict: "user_id,date" },
  );

  if (error) {
    redirect(withError("/admin/absence/new", error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin");

  // Land on the month the absence starts in, with the Leave and Absences
  // section in view, so the admin sees what they just recorded right away.
  const start = new Date(startDate + "T00:00:00");
  const targetYear = start.getFullYear();
  const targetMonth = start.getMonth() + 1;
  redirect(
    withSuccess(`/admin/calendar?y=${targetYear}&m=${targetMonth}#leave`, "Absence recorded."),
  );
}
