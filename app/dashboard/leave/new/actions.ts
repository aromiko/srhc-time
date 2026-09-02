"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countWeekdays } from "@/lib/leave-utils";
import { withSuccess } from "@/lib/flash";

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

  const daysRequested = countWeekdays(startDate, endDate);

  if (!leaveTypeId || !startDate || !endDate || daysRequested <= 0) {
    redirect(
      "/dashboard/leave/new?error=" +
        encodeURIComponent("Please provide a valid leave type and date range."),
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
    redirect("/dashboard/leave/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  redirect(withSuccess("/dashboard", "Leave request submitted."));
}
