import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. NEVER import this file from a "use client"
// component or from any module that a client component imports — the
// `server-only` import above makes Next.js fail the build if that happens.
// Used only for: creating child auth users, reading/writing
// `child_credentials`, and other privileged operations that must bypass RLS.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
