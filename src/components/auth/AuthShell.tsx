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
 */
export function GoogleSignInButton() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success the browser is redirected away by Supabase; nothing else to do here.
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--pp-text-faint)", fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: "var(--pp-border)" }} />
        {t("orContinue")}
        <span style={{ flex: 1, height: 1, background: "var(--pp-border)" }} />
      </div>
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
        {t("continueWithGoogle")}
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
