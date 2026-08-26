"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyLeaveStatusChange } from "@/lib/leave-requests";
import type { LeaveStatus } from "@/lib/types";

const VALID_STATUSES: LeaveStatus[] = ["pending", "approved", "declined"];

export async function updateRequestStatus(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "") as LeaveStatus;
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  if (!VALID_STATUSES.includes(status)) {
    redirect("/admin/requests?error=" + encodeURIComponent("Invalid status."));
  }

  const { error } = await applyLeaveStatusChange(
    supabase,
    requestId,
    status,
    adminId,
    adminNotes,
  );
  if (error) redirect("/admin/requests?error=" + encodeURIComponent(error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  redirect("/admin/requests");
}
