"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, BackButton, GoogleSignInButton } from "@/components/auth/AuthShell";
import { api } from "@/lib/apiClient";

export default function SignInPage() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Surfaces ?error=... from /api/auth/callback (Google OAuth failures) —
  // previously these redirects were silent, making it impossible to tell
  // "OAuth actually failed" apart from "never got here at all" without
  // reading server logs. This makes that visible right on the page.
  const oauthError = searchParams.get("error");
  const displayError = error ?? (oauthError ? `Google sign-in error: ${oauthError}` : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/parent-signin", { email, password });
      router.push("/parent/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form className="pp-page-narrow" onSubmit={onSubmit}>
        <BackButton href="/" />
        <div>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("signInTitle")}</h1>
          <p className="pp-sub">{t("signInSub")}</p>
        </div>
        <label className="pp-field">
          {t("email")}
          <input className="pp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="pp-field">
          {t("password")}
          <input className="pp-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5 }}>
          <span />
          <Link href="/forgot">{t("forgot")}</Link>
        </div>
        {displayError && <div className="pp-error"><i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />{displayError}</div>}
        <button className="pp-btn pp-btn-primary" type="submit" disabled={loading}>
          {loading ? t("loading") : t("signInBtn")}
        </button>
        <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--pp-text-muted)" }}>
          {t("noAccount")} <Link href="/signup">{t("signUp")}</Link>
        </div>
        <GoogleSignInButton />
      </form>
    </AuthShell>
  );
}
