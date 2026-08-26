import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaveStatus } from "@/lib/types";

/**
 * Transitions a leave request to a new status and keeps leave_balances.used_days
 * in sync. Only entering/leaving 'approved' moves the balance, so this is safe
 * to call for the original approve/decline actions as well as later corrections
 * (e.g. un-approving a request an admin clicked by mistake).
 */
export async function applyLeaveStatusChange(
  supabase: SupabaseClient,
  requestId: string,
  newStatus: LeaveStatus,
  adminId: string,
  adminNotes: string | null,
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id, user_id, leave_type_id, days_requested, status")
    .eq("id", requestId)
    .single();

  if (!existing) {
    return { error: "Leave request not found." };
  }

  const wasApproved = existing.status === "approved";
  const willBeApproved = newStatus === "approved";

  if (wasApproved !== willBeApproved) {
    const delta = willBeApproved ? existing.days_requested : -existing.days_requested;

    const { data: balance } = await supabase
      .from("leave_balances")
      .select("id, used_days")
      .eq("user_id", existing.user_id)
      .eq("leave_type_id", existing.leave_type_id)
      .maybeSingle();

    if (balance) {
      await supabase
        .from("leave_balances")
        .update({ used_days: Math.max(0, balance.used_days + delta) })
        .eq("id", balance.id);
    } else if (delta > 0) {
      await supabase.from("leave_balances").insert({
        user_id: existing.user_id,
        leave_type_id: existing.leave_type_id,
        allocated_days: 0,
        used_days: delta,
      });
    }
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", requestId);

  return error ? { error: error.message } : {};
}
