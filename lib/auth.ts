import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentUser(): Promise<{
  profile: Profile;
  email: string | undefined;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { profile: profile as Profile, email: user.email };
}

/**
 * Server Action guard: confirms the current session belongs to an admin.
 * Redirects otherwise. Returns an authenticated Supabase client (RLS applies).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { supabase, adminId: user.id };
}
