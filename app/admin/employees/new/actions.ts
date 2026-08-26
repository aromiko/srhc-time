"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createEmployee(formData: FormData) {
  const { supabase } = await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "employee") as "admin" | "employee";
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim();
  const birthday = String(formData.get("birthday") ?? "").trim();

  if (!fullName || !email || password.length < 8) {
    redirect(
      "/admin/employees/new?error=" +
        encodeURIComponent(
          "Full name, email, and a password of at least 8 characters are required.",
        ),
    );
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (createError || !created.user) {
    redirect(
      "/admin/employees/new?error=" +
        encodeURIComponent(createError?.message ?? "Could not create employee."),
    );
  }

  const newUserId = created.user.id;

  // The DB trigger already created a profile row with the name/role from
  // user_metadata. Fill in the contact fields it doesn't know about.
  if (mobileNumber || birthday) {
    await supabase
      .from("profiles")
      .update({
        mobile_number: mobileNumber || null,
        birthday: birthday || null,
      })
      .eq("id", newUserId);
  }

  // Seed a zero-balance row for every leave type so the employee shows up
  // ready to have balances assigned.
  const { data: leaveTypes } = await supabase.from("leave_types").select("id");
  if (leaveTypes && leaveTypes.length > 0) {
    await supabase.from("leave_balances").insert(
      leaveTypes.map((lt) => ({
        user_id: newUserId,
        leave_type_id: lt.id,
        allocated_days: 0,
        used_days: 0,
      })),
    );
  }

  redirect(`/admin/employees/${newUserId}`);
}
