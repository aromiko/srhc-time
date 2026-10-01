"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";

function revalidateCalendars() {
  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
}

export async function updateCalendarEvent(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (!id || !title) {
    redirect(withError(redirectTo, "An event needs a title."));
  }

  const { error } = await supabase.from("calendar_events").update({ title }).eq("id", id);

  if (error) {
    redirect(withError(redirectTo, error.message));
  }

  revalidateCalendars();
  redirect(withSuccess(redirectTo, "Event updated."));
}

export async function deleteCalendarEvent(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (id) {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      redirect(withError(redirectTo, error.message));
    }
  }

  revalidateCalendars();
  redirect(withSuccess(redirectTo, "Event removed."));
}
