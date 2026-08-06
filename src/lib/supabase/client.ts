"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Only ever uses the public URL + publishable
// (anon) key — never the service role key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
