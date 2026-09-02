"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyLeaveStatusChange } from "@/lib/leave-requests";
import { withSuccess, withError } from "@/lib/flash";
import type { LeaveStatus } from "@/lib/types";

const VALID_STATUSES: LeaveStatus[] = ["pending", "approved", "declined"];

export async function updateRequestStatus(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "") as LeaveStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  if (!VALID_STATUSES.includes(status)) {
    redirect(withError("/admin/requests", "Invalid status."));
  }

  const { error } = await applyLeaveStatusChange(
    supabase,
    requestId,
    status,
    adminId,
    adminNotes,
  );
  if (error) redirect(withError("/admin/requests", error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  redirect(withSuccess("/admin/requests", "Status updated."));
}
