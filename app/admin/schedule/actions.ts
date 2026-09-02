"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";

export async function updateSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const shiftTypeId = String(formData.get("shift_type_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (!id || !shiftTypeId) {
    redirect(withError(redirectTo, "Invalid update."));
  }

  const { error } = await supabase
    .from("schedules")
    .update({ shift_type_id: shiftTypeId, notes })
    .eq("id", id);

  if (error) {
    redirect(withError(redirectTo, error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  redirect(withSuccess(redirectTo, "Shift updated."));
}

export async function deleteSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (id) {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) {
      redirect(withError(redirectTo, error.message));
    }
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  redirect(withSuccess(redirectTo, "Shift removed."));
}
