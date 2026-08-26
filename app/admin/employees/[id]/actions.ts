"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function updateLeaveBalance(formData: FormData) {
  const { supabase } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const allocatedDays = Number(formData.get("allocated_days") ?? "0");

  if (!userId || !leaveTypeId || Number.isNaN(allocatedDays) || allocatedDays < 0) {
    redirect(`/admin/employees/${userId}?error=` + encodeURIComponent("Invalid value."));
  }

  const { data: existing } = await supabase
    .from("leave_balances")
    .select("id")
    .eq("user_id", userId)
    .eq("leave_type_id", leaveTypeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("leave_balances")
      .update({ allocated_days: allocatedDays })
      .eq("id", existing.id);
  } else {
    await supabase.from("leave_balances").insert({
      user_id: userId,
      leave_type_id: leaveTypeId,
      allocated_days: allocatedDays,
      used_days: 0,
    });
  }

  revalidatePath(`/admin/employees/${userId}`);
  redirect(`/admin/employees/${userId}`);
}
