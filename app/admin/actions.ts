"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function approveRequest(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  const { data: leaveRequest } = await supabase
    .from("leave_requests")
    .select("id, user_id, leave_type_id, days_requested, status")
    .eq("id", requestId)
    .single();

  if (!leaveRequest || leaveRequest.status !== "pending") {
    redirect("/admin?error=" + encodeURIComponent("Request is no longer pending."));
  }

  const { data: existingBalance } = await supabase
    .from("leave_balances")
    .select("id, used_days")
    .eq("user_id", leaveRequest.user_id)
    .eq("leave_type_id", leaveRequest.leave_type_id)
    .maybeSingle();

  if (existingBalance) {
    await supabase
      .from("leave_balances")
      .update({ used_days: existingBalance.used_days + leaveRequest.days_requested })
      .eq("id", existingBalance.id);
  } else {
    await supabase.from("leave_balances").insert({
      user_id: leaveRequest.user_id,
      leave_type_id: leaveRequest.leave_type_id,
      allocated_days: 0,
      used_days: leaveRequest.days_requested,
    });
  }

  await supabase
    .from("leave_requests")
    .update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", requestId);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function declineRequest(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const adminNotes = String(formData.get("admin_notes") ?? "").trim() || null;

  await supabase
    .from("leave_requests")
    .update({
      status: "declined",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  revalidatePath("/admin");
  redirect("/admin");
}
