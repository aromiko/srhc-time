"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";

export async function updateProfile(formData: FormData) {
  const { supabase } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim();
  const birthday = String(formData.get("birthday") ?? "").trim();

  if (!userId || !fullName) {
    redirect(withError(`/admin/employees/${userId}`, "Full name is required."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      mobile_number: mobileNumber || null,
      birthday: birthday || null,
    })
    .eq("id", userId);

  if (error) {
    redirect(withError(`/admin/employees/${userId}`, error.message));
  }

  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/admin/employees");
  redirect(withSuccess(`/admin/employees/${userId}`, "Profile updated."));
}

export async function updateLeaveBalance(formData: FormData) {
  const { supabase } = await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const allocatedDays = Number(formData.get("allocated_days") ?? "0");

  if (!userId || !leaveTypeId || Number.isNaN(allocatedDays) || allocatedDays < 0) {
    redirect(withError(`/admin/employees/${userId}`, "Invalid value."));
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
  redirect(withSuccess(`/admin/employees/${userId}`, "Balance updated."));
}
