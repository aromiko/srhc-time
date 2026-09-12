"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateLeaveDateRange } from "@/lib/leave-utils";
import { getRemainingBalance } from "@/lib/leave-requests";
import { withSuccess, withError } from "@/lib/flash";

export async function submitLeaveRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const leaveTypeId = String(formData.get("leave_type_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!leaveTypeId) {
    redirect(withError("/dashboard/leave/new", "Please choose a leave type."));
  }

  const range = validateLeaveDateRange(startDate, endDate);
  if (!range.ok) {
    redirect(withError("/dashboard/leave/new", range.error));
  }
  const daysRequested = range.daysRequested;

  const remaining = await getRemainingBalance(supabase, user.id, leaveTypeId);
  if (daysRequested > remaining) {
    redirect(
      withError(
        "/dashboard/leave/new",
        `You only have ${remaining} day${remaining === 1 ? "" : "s"} remaining for this leave type - this request needs ${daysRequested}.`,
      ),
    );
  }

  const { error } = await supabase.from("leave_requests").insert({
    user_id: user.id,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    days_requested: daysRequested,
    reason: reason || null,
    status: "pending",
  });

  if (error) {
    redirect(withError("/dashboard/leave/new", error.message));
  }

  revalidatePath("/dashboard");
  redirect(withSuccess("/dashboard", "Leave request submitted."));
}
