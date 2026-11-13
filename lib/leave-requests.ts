import type { SupabaseClient } from "@supabase/supabase-js";
import type { HalfDayPeriod, LeaveStatus } from "@/lib/types";

/** allocated_days - used_days for one employee/leave type, 0 if no balance row exists yet. */
export async function getRemainingBalance(
  supabase: SupabaseClient,
  userId: string,
  leaveTypeId: string,
): Promise<number> {
  const { data } = await supabase
    .from("leave_balances")
    .select("allocated_days, used_days")
    .eq("user_id", userId)
    .eq("leave_type_id", leaveTypeId)
    .maybeSingle();

  return (data?.allocated_days ?? 0) - (data?.used_days ?? 0);
}

/** Today's month in the Philippines as [first day, first day of next month], ISO dates. */
function currentMonthRange(): [string, string] {
  const [y, m] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
  return [`${y}-${pad(m)}-01`, next];
}

/**
 * Sick leave resets monthly (1 SL, no carry-over - see migration 0019), so its
 * used_days is "approved Sick days starting this month" rather than a running
 * total. Recounting (instead of +/- delta) keeps SL from past or future months
 * from touching the current month's balance.
 */
async function recountMonthlySickUsed(
  supabase: SupabaseClient,
  userId: string,
  leaveTypeId: string,
) {
  const [monthStart, nextMonth] = currentMonthRange();
  const { data: rows } = await supabase
    .from("leave_requests")
    .select("days_requested")
    .eq("user_id", userId)
    .eq("leave_type_id", leaveTypeId)
    .eq("status", "approved")
    .gte("start_date", monthStart)
    .lt("start_date", nextMonth);
  const used = (rows ?? []).reduce((sum, r) => sum + Number(r.days_requested), 0);

  const { data: balance } = await supabase
    .from("leave_balances")
    .select("id")
    .eq("user_id", userId)
    .eq("leave_type_id", leaveTypeId)
    .maybeSingle();

  if (balance) {
    await supabase.from("leave_balances").update({ used_days: used }).eq("id", balance.id);
  } else if (used > 0) {
    await supabase.from("leave_balances").insert({
      user_id: userId,
      leave_type_id: leaveTypeId,
      allocated_days: 0,
      used_days: used,
    });
  }
}

/**
 * Adds delta (may be negative) to used_days, creating the balance row if
 * needed. Must be called AFTER the leave_requests write it reflects, since
 * Sick leave is recounted from approved requests instead.
 */
async function adjustUsedDays(
  supabase: SupabaseClient,
  userId: string,
  leaveTypeId: string,
  delta: number,
) {
  const { data: type } = await supabase
    .from("leave_types")
    .select("name")
    .eq("id", leaveTypeId)
    .maybeSingle();
  if (type?.name === "Sick") {
    await recountMonthlySickUsed(supabase, userId, leaveTypeId);
    return;
  }

  const { data: balance } = await supabase
    .from("leave_balances")
    .select("id, used_days")
    .eq("user_id", userId)
    .eq("leave_type_id", leaveTypeId)
    .maybeSingle();

  if (balance) {
    await supabase
      .from("leave_balances")
      .update({ used_days: Math.max(0, balance.used_days + delta) })
      .eq("id", balance.id);
  } else if (delta > 0) {
    await supabase.from("leave_balances").insert({
      user_id: userId,
      leave_type_id: leaveTypeId,
      allocated_days: 0,
      used_days: delta,
    });
  }
}

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

  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  // Balance moves only after the status write succeeds (and Sick's monthly
  // recount needs to see the new status).
  const wasApproved = existing.status === "approved";
  const willBeApproved = newStatus === "approved";

  if (wasApproved !== willBeApproved) {
    await adjustUsedDays(
      supabase,
      existing.user_id,
      existing.leave_type_id,
      willBeApproved ? existing.days_requested : -existing.days_requested,
    );
  }

  return {};
}

/**
 * Permanently removes a leave request (e.g. one an admin filed by mistake).
 * If it was approved, its days are given back to the employee's balance first.
 */
export async function deleteLeaveRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id, user_id, leave_type_id, days_requested, status")
    .eq("id", requestId)
    .single();

  if (!existing) {
    return { error: "Leave request not found." };
  }

  const { data: deleted, error } = await supabase
    .from("leave_requests")
    .delete()
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  // RLS silently filters a delete it doesn't allow - surface that instead of
  // reporting success (and refunding days) for a row that's still there.
  if (!deleted || deleted.length === 0) {
    return { error: "Could not delete this leave request (missing permission?)." };
  }

  if (existing.status === "approved") {
    await adjustUsedDays(supabase, existing.user_id, existing.leave_type_id, -existing.days_requested);
  }

  return {};
}

/**
 * Admin edit of a request's type/dates/reason, any status. If it's approved,
 * the old days are returned to the old leave type and the new days charged to
 * the new one, so balances stay correct when type or day count changes.
 */
export async function updateLeaveDetails(
  supabase: SupabaseClient,
  requestId: string,
  changes: {
    leave_type_id: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    half_day_period: HalfDayPeriod | null;
    reason: string | null;
  },
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("leave_requests")
    .select("id, user_id, leave_type_id, days_requested, status")
    .eq("id", requestId)
    .single();

  if (!existing) {
    return { error: "Leave request not found." };
  }

  const { data: updated, error } = await supabase
    .from("leave_requests")
    .update(changes)
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Could not update this leave request (missing permission?)." };
  }

  if (existing.status === "approved") {
    await adjustUsedDays(supabase, existing.user_id, existing.leave_type_id, -existing.days_requested);
    await adjustUsedDays(supabase, existing.user_id, changes.leave_type_id, changes.days_requested);
  }

  return {};
}
