import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for use in Server Components, Route Handlers
// and Server Actions. Reads/writes the session via cookies. Uses the public
// (anon) key — RLS still applies, scoped to whichever user's session cookie
// is present (parent or child, both are real Supabase Auth users).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component without a response —
            // safe to ignore when middleware refreshes the session.
          }
        },
      },
    }
  );
}
