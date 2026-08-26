import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Cached per-request: a layout and a page both call this on every render
 * (layout for the header, page for its own queries). Without React's
 * request memoization that's 2 duplicate round trips (auth verify + profile
 * fetch) on every single navigation - this collapses them into one.
 */
export const getCurrentUser = cache(async (): Promise<{
  profile: Profile;
  email: string | undefined;
} | null> => {
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
});

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
