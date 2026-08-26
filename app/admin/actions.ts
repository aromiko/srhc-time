"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyLeaveStatusChange } from "@/lib/leave-requests";

export async function approveRequest(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  const { error } = await applyLeaveStatusChange(
    supabase,
    requestId,
    "approved",
    adminId,
    adminNotes,
  );
  if (error) redirect("/admin?error=" + encodeURIComponent(error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  redirect("/admin");
}

export async function declineRequest(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  const { error } = await applyLeaveStatusChange(
    supabase,
    requestId,
    "declined",
    adminId,
    adminNotes,
  );
  if (error) redirect("/admin?error=" + encodeURIComponent(error));

  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  redirect("/admin");
}
