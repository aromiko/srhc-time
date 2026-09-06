"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";

export async function batchAddLeaveBalance(formData: FormData) {
  const { supabase } = await requireAdmin();

  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const amount = Number(formData.get("amount") ?? "0");
  const employeeIds = formData.getAll("employee_ids").map(String).filter(Boolean);

  if (!leaveTypeId || !Number.isFinite(amount) || amount <= 0) {
    redirect(withError("/admin/employees/batch", "Pick a leave type and an amount above 0."));
  }
  if (employeeIds.length === 0) {
    redirect(withError("/admin/employees/batch", "Select at least one employee."));
  }

  const { data: existingBalances } = await supabase
    .from("leave_balances")
    .select("id, user_id, allocated_days")
    .eq("leave_type_id", leaveTypeId)
    .in("user_id", employeeIds);

  const existingByUser = new Map((existingBalances ?? []).map((b) => [b.user_id, b]));

  const toInsert = employeeIds
    .filter((id) => !existingByUser.has(id))
    .map((user_id) => ({
      user_id,
      leave_type_id: leaveTypeId,
      allocated_days: amount,
      used_days: 0,
    }));

  const updates = employeeIds
    .filter((id) => existingByUser.has(id))
    .map((id) => existingByUser.get(id)!);

  const results = await Promise.all([
    toInsert.length > 0 ? supabase.from("leave_balances").insert(toInsert) : null,
    ...updates.map((b) =>
      supabase
        .from("leave_balances")
        .update({ allocated_days: b.allocated_days + amount })
        .eq("id", b.id),
    ),
  ]);

  const firstError = results.find((r) => r?.error)?.error;
  if (firstError) {
    redirect(withError("/admin/employees/batch", firstError.message));
  }

  // 'layout' also revalidates every /admin/employees/[id] page underneath.
  revalidatePath("/admin/employees", "layout");
  revalidatePath("/dashboard");

  redirect(
    withSuccess(
      "/admin/employees/batch",
      `Added ${amount} day${amount === 1 ? "" : "s"} to ${employeeIds.length} employee${
        employeeIds.length === 1 ? "" : "s"
      }.`,
    ),
  );
}
