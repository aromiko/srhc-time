"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateLeaveDateRange } from "@/lib/leave-utils";
import { getRemainingBalance } from "@/lib/leave-requests";
import { withSuccess, withError } from "@/lib/flash";

export async function updateLeaveRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const editPath = `/dashboard/leave/${id}/edit`;

  if (!id) redirect(withError("/dashboard", "That leave request no longer exists."));
  if (!leaveTypeId) redirect(withError(editPath, "Please choose a leave type."));

  const range = validateLeaveDateRange(startDate, endDate);
  if (!range.ok) {
    redirect(withError(editPath, range.error));
  }
  const daysRequested = range.daysRequested;

  // A pending request never touched used_days, so the balance check doesn't
  // need to "add back" the request's old days first - the full remaining
  // balance is what's genuinely available regardless of what this row used
  // to say.
  const remaining = await getRemainingBalance(supabase, user.id, leaveTypeId);
  if (daysRequested > remaining) {
    redirect(
      withError(
        editPath,
        `You only have ${remaining} day${remaining === 1 ? "" : "s"} remaining for this leave type - this request needs ${daysRequested}.`,
      ),
    );
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      days_requested: daysRequested,
      reason: reason || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    redirect(withError(editPath, error.message));
  }

  revalidatePath("/dashboard");
  redirect(withSuccess("/dashboard", "Leave request updated."));
}

export async function cancelLeaveRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");

  if (id) {
    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      redirect(withError("/dashboard", error.message));
    }
  }

  revalidatePath("/dashboard");
  redirect(withSuccess("/dashboard", "Leave request cancelled."));
}
