"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";
import { eachDateISO } from "@/lib/calendar-utils";

export async function createCalendarEvent(formData: FormData) {
  const { supabase, adminId } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || startDate;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title || eachDateISO(startDate, endDate).length === 0) {
    redirect(withError("/admin/event/new", "Please enter a title and a valid date range."));
  }

  const { error } = await supabase.from("calendar_events").insert({
    title,
    start_date: startDate,
    end_date: endDate,
    notes,
    created_by: adminId,
  });

  if (error) {
    redirect(withError("/admin/event/new", error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");

  // Land on the month the event starts in so the admin sees it right away.
  const start = new Date(startDate + "T00:00:00");
  redirect(
    withSuccess(
      `/admin/calendar?y=${start.getFullYear()}&m=${start.getMonth() + 1}#leave`,
      "Event added.",
    ),
  );
}
