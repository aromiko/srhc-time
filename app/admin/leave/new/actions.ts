"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { validateLeaveDateRange } from "@/lib/leave-utils";
import { applyLeaveStatusChange } from "@/lib/leave-requests";

export async function fileLeaveOnBehalf(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId) redirect(withError("/admin/leave/new", "Please pick an employee."));
  if (!leaveTypeId) redirect(withError("/admin/leave/new", "Please choose a leave type."));

  const range = validateLeaveDateRange(startDate, endDate);
  if (!range.ok) {
    redirect(withError("/admin/leave/new", range.error));
  }
  const daysRequested = range.daysRequested;

  // Inserted as pending, then immediately transitioned to approved through
  // the same function the Approve button uses - one place does the
  // balance math, whether a request arrives via an employee or via admin.
  const { data: created, error: insertError } = await supabase
    .from("leave_requests")
    .insert({
      user_id: userId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      days_requested: daysRequested,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    redirect(withError("/admin/leave/new", insertError?.message ?? "Could not file leave."));
  }

  const { error } = await applyLeaveStatusChange(supabase, created.id, "approved", adminId, note);
  if (error) {
    redirect(withError("/admin/leave/new", error));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");

  const start = new Date(startDate + "T00:00:00");
  redirect(
    withSuccess(
      `/admin/calendar?y=${start.getFullYear()}&m=${start.getMonth() + 1}#leave`,
      "Leave filed and approved.",
    ),
  );
}
