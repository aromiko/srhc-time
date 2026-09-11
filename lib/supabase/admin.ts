import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client - bypasses RLS. Server-only; never import from a
 * Client Component. Used to create employee auth accounts, and to back the
 * public no-login calendar route (which has no session to key RLS off of -
 * the route's own token check is what gates access, not RLS).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
