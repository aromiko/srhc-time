"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withSuccess, withError } from "@/lib/flash";

export async function updateAbsence(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (!id) {
    redirect(withError(redirectTo, "Invalid update."));
  }

  const { error } = await supabase.from("absences").update({ reason }).eq("id", id);

  if (error) {
    redirect(withError(redirectTo, error.message));
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin");
  redirect(withSuccess(redirectTo, "Absence updated."));
}

export async function deleteAbsence(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/admin/calendar");

  if (id) {
    const { error } = await supabase.from("absences").delete().eq("id", id);
    if (error) {
      redirect(withError(redirectTo, error.message));
    }
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/admin");
  redirect(withSuccess(redirectTo, "Absence removed."));
}
