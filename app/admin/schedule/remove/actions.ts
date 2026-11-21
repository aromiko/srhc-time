"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { eachDateISO, resolveWeekStart } from "@/lib/calendar-utils";

/**
 * Bulk-removes one employee's shifts across a date range - the undo for an
 * accidental date-range assignment. `shift_type_id` is optional: blank means
 * every shift type that person has in the range.
 */
export async function removeSchedules(formData: FormData) {
  const { supabase } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const shiftTypeId = String(formData.get("shift_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!userId || eachDateISO(startDate, endDate).length === 0) {
    redirect(
      withError(
        "/admin/schedule/remove",
        "Please pick an employee and a valid date range.",
      ),
    );
  }

  let query = supabase
    .from("schedules")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);
  if (shiftTypeId) query = query.eq("shift_type_id", shiftTypeId);

  const { error, count } = await query;

  if (error) {
    redirect(withError("/admin/schedule/remove", error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");

  const removed = count ?? 0;
  const targetWeek = resolveWeekStart(startDate);
  redirect(
    withSuccess(
      `/admin/calendar?w=${targetWeek}#schedule`,
      `Removed ${removed} shift${removed === 1 ? "" : "s"}.`,
    ),
  );
}
