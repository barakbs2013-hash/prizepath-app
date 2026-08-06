"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, BackButton, GoogleSignInButton } from "@/components/auth/AuthShell";
import { api } from "@/lib/apiClient";

export default function SignUpPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = fullName.trim().length > 0 && email.includes("@") && password.length >= 6 && agree;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/parent-signup", {
        fullName,
        email,
        password,
        familyName: familyName || undefined,
        preferredLanguage: locale,
      });
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
        <BackButton href="/signin" />
        <div>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("signUpTitle")}</h1>
          <p className="pp-sub">{t("signUpSub")}</p>
        </div>
        <label className="pp-field">
          {t("fullName")}
          <input className="pp-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="pp-field">
          {t("email")}
          <input className="pp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="pp-field">
          {t("password")}
          <input className="pp-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>
        <label className="pp-field">
          {t("createFamilyProfile")}
          <input className="pp-input" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder={t("createFamilyProfile")} />
        </label>
        <label className="pp-checkbox-row">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          {t("agree")}
        </label>
        {error && <div className="pp-error"><i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />{error}</div>}
        <button className="pp-btn pp-btn-primary" type="submit" disabled={!canSubmit || loading}>
          {loading ? t("loading") : t("createAccount")}
        </button>
        {!canSubmit && <p style={{ margin: 0, textAlign: "center", fontSize: 12.5, color: "var(--pp-text-faint)" }}>{t("disabledHint")}</p>}
        <GoogleSignInButton />
      </form>
    </AuthShell>
  );
}
