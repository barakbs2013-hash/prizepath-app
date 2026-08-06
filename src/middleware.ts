import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request so server
// components always see an up-to-date session (standard @supabase/ssr
// middleware pattern).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Excluding /api here too: every API route already builds its own
  // Supabase server client and checks auth itself (requireProfile()), so
  // running the session-refresh client twice per request added no value —
  // and for /api/auth/callback specifically, having middleware create a
  // second Supabase client on the same request was an unnecessary variable
  // to rule out while debugging the OAuth session issue below.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
