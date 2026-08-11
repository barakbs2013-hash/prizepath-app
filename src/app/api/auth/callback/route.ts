import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/server/serviceClient";
import { ensureParentProfileForOAuthUser } from "@/lib/server/family";

// Google (and any future OAuth provider) redirects here after Supabase's
// own hosted callback, with a one-time `code`. We exchange it for a real
// Supabase session (same session type as email/password and child PIN
// sign-in), so every existing RLS policy and API route keeps working
// unchanged. Never trust query params for identity — the code exchange is
// what proves who the user is; everything else here is derived from the
// resulting session.
//
// IMPORTANT: this route builds the redirect Response FIRST and attaches
// the Supabase cookie writes directly to THAT response object, instead of
// going through the shared next/headers-based `createClient()` helper.
// Both approaches are valid in Next.js 15/16 route handlers, but binding
// cookies straight to the exact response we return removes any ambiguity
// while we're diagnosing a "session doesn't stick after redirect" bug —
// there is no ability for cookies() write-timing/merge order to matter
// here, because we're not relying on an implicit merge at all.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description");
  // Which flow started this OAuth round-trip — set by GoogleSignInButton.
  // "child" means never auto-provision a profile here (see below); a child
  // profile only ever gets a Google identity via explicit linking from
  // their own (already-authenticated) profile page.
  const role = searchParams.get("role") === "child" ? "child" : "parent";
  const signinPath = role === "child" ? "/child-signin" : "/signin";
  const defaultNext = role === "child" ? "/child/home" : "/parent/home";
  const next = searchParams.get("next") || defaultNext;

  console.log("[auth/callback] hit:", { hasCode: !!code, hasError: !!oauthError, role });

  if (oauthError) {
    return NextResponse.redirect(`${origin}${signinPath}?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    // If you never see this route's "[auth/callback] hit" log line at all
    // when testing, Supabase never reached this route — that almost always
    // means the exact callback URL isn't in Supabase Dashboard →
    // Authentication → URL Configuration → Redirect URLs, so Supabase fell
    // back to the Site URL instead of honoring redirectTo.
    console.error("[auth/callback] no code param present");
    return NextResponse.redirect(`${origin}${signinPath}?error=missing_code`);
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(
            request.headers
              .get("cookie")
              ?.split("; ")
              .filter(Boolean)
              .map((pair) => {
                const idx = pair.indexOf("=");
                return { name: pair.slice(0, idx), value: pair.slice(idx + 1) };
              }) ?? []
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    // Never leak the raw Supabase error to the URL/client — log server-side only.
    console.error("[auth/callback] exchangeCodeForSession failed:", error?.message);
    return NextResponse.redirect(`${origin}${signinPath}?error=oauth_failed`);
  }

  console.log("[auth/callback] session established for auth user:", data.user.id);

  if (role === "child") {
    // Children never get a profile auto-created off a bare Google sign-in —
    // that would let anyone with a Google account mint themselves a child
    // account with no family/parent attached. A child profile can only gain
    // a Google identity via explicit linking (see LinkGoogleButton), which
    // runs against their EXISTING auth.users row while they're already
    // signed in via username+PIN. So by the time we get here, either the
    // identity was already linked to a real child profile (fine — sign
    // them in) or it wasn't (reject, don't provision anything).
    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (!profile || profile.role !== "child") {
      console.error("[auth/callback] no linked child profile for auth user:", data.user.id);
      return NextResponse.redirect(`${origin}/child-signin?error=google_not_linked`);
    }

    return redirectResponse;
  }

  try {
    await ensureParentProfileForOAuthUser({
      authUserId: data.user.id,
      email: data.user.email ?? null,
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        null,
    });
  } catch (err) {
    console.error("[auth/callback] profile provisioning failed:", err);
    return NextResponse.redirect(`${origin}/signin?error=profile_setup_failed`);
  }

  // redirectResponse already carries the Set-Cookie headers written above.
  return redirectResponse;
}
