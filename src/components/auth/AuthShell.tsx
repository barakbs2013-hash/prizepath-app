"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pp-shell">
      <div className="pp-container">{children}</div>
    </div>
  );
}

export function LangPill() {
  const { t } = useLocale();
  return (
    <Link
      href="/lang"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--pp-border)",
        background: "#fff",
        color: "var(--pp-text-soft)",
        fontSize: 12.5,
        fontWeight: 500,
        padding: "7px 11px",
        borderRadius: 99,
      }}
    >
      <i className="ph ph-translate" style={{ fontSize: 15 }} />
      {t("langShort")}
    </Link>
  );
}

/**
 * "Continue with Google" — uses Supabase Auth's native Google OAuth
 * provider (configured in the Supabase dashboard, not in this codebase).
 * Redirects the browser to Google, then to Supabase's own callback, then
 * back to /api/auth/callback here, which exchanges the code for a real
 * Supabase session — the same session type parent email/password and
 * child PIN sign-in already produce, so RLS keeps working unchanged.
 * No Google client secret ever touches this app's code or env vars.
 *
 * `role` is threaded through as a query param on the callback URL so the
 * callback route knows whether to provision a brand-new parent profile
 * (role=parent, the default — unchanged behavior) or to treat this as a
 * child sign-in, where no profile is ever auto-created — see
 * `LinkGoogleButton` below for how a child's Google identity gets linked
 * in the first place.
 *
 * `mode="link"` switches to `linkIdentity`, which attaches a Google
 * identity to the CURRENTLY SIGNED-IN user's existing auth.users row
 * instead of starting a new sign-in — this is how a child (who has no
 * email/password of their own) gains the ability to sign in with Google
 * later: they log in with username+PIN first, then link Google from their
 * profile page. Requires "Allow manual linking of identities" to be
 * enabled in the Supabase dashboard (Authentication → Settings) — a
 * dashboard-only setting, same as the Google provider itself.
 */
export function GoogleSignInButton({
  role = "parent",
  next,
  mode = "signin",
}: {
  role?: "parent" | "child";
  next?: string;
  mode?: "signin" | "link";
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const callbackUrl = new URL(`${window.location.origin}/api/auth/callback`);
    callbackUrl.searchParams.set("role", role);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error: oauthError } =
      mode === "link"
        ? await supabase.auth.linkIdentity({
            provider: "google",
            options: { redirectTo: callbackUrl.toString() },
          })
        : await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: callbackUrl.toString() },
          });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success the browser is redirected away by Supabase; nothing else to do here.
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {mode === "signin" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--pp-text-faint)", fontSize: 12 }}>
          <span style={{ flex: 1, height: 1, background: "var(--pp-border)" }} />
          {t("orContinue")}
          <span style={{ flex: 1, height: 1, background: "var(--pp-border)" }} />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        style={{
          flex: 1,
          padding: 13,
          borderRadius: 14,
          border: "1.5px solid var(--pp-border)",
          background: "#fff",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--pp-text)",
          cursor: loading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <i className="ph ph-google-logo" style={{ fontSize: 18 }} />
        {mode === "link" ? t("linkGoogleAccount") : t("continueWithGoogle")}
      </button>
      {error && (
        <div className="pp-error">
          <i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />
          {error}
        </div>
      )}
    </div>
  );
}

export function BackButton({ href }: { href: string }) {
  const { dir } = useLocale();
  return (
    <Link href={href} className="pp-icon-btn" aria-label="back">
      <i className={dir === "rtl" ? "ph ph-arrow-right" : "ph ph-arrow-left"} style={{ fontSize: 17 }} />
    </Link>
  );
}
