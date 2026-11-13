"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyLeaveStatusChange, deleteLeaveRequest, updateLeaveDetails } from "@/lib/leave-requests";
import { validateLeaveDateRange } from "@/lib/leave-utils";
import { withSuccess, withError } from "@/lib/flash";
import type { LeaveStatus } from "@/lib/types";

const VALID_STATUSES: LeaveStatus[] = ["pending", "approved", "declined"];

export async function updateRequestStatus(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "") as LeaveStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  if (!VALID_STATUSES.includes(status)) {
    redirect(withError("/admin/requests#history-list", "Invalid status."));
  }

  const { error } = await applyLeaveStatusChange(
    supabase,
    requestId,
    status,
    adminId,
    adminNotes,
  );
  if (error) redirect(withError("/admin/requests#history-list", error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  redirect(withSuccess("/admin/requests#history-list", "Status updated."));
}

export async function deleteRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) redirect(withError("/admin/requests#history-list", "Leave request not found."));

  const { error } = await deleteLeaveRequest(supabase, requestId);
  if (error) redirect(withError("/admin/requests#history-list", error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/employees");
  redirect(withSuccess("/admin/requests#history-list", "Leave request deleted."));
}

export async function editRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!requestId) redirect(withError("/admin/requests#history-list", "Leave request not found."));
  const editPath = `/admin/requests/${requestId}/edit`;
  if (!leaveTypeId) redirect(withError(editPath, "Please choose a leave type."));

  const range = validateLeaveDateRange(startDate, endDate, String(formData.get("duration") ?? "full"));
  if (!range.ok) redirect(withError(editPath, range.error));

  const { data: owner } = await supabase
    .from("leave_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();
  const fromEmployee = formData.get("from") === "employee" && owner;
  const editPathWithFrom = fromEmployee ? `${editPath}?from=employee` : editPath;

  const { error } = await updateLeaveDetails(supabase, requestId, {
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    days_requested: range.daysRequested,
    half_day_period: range.halfDayPeriod,
    reason,
  });
  if (error) redirect(withError(editPathWithFrom, error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/employees", "layout");
  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  redirect(
    withSuccess(
      fromEmployee ? `/admin/employees/${owner.user_id}` : "/admin/requests#history-list",
      "Leave request updated.",
    ),
  );
}
