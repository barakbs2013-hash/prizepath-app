"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, BackButton } from "@/components/auth/AuthShell";
import { api } from "@/lib/apiClient";

export default function ForgotPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
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
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center" }}>
          <i className="ph ph-key" style={{ fontSize: 30, color: "var(--pp-blue)" }} />
        </div>
        <div>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("forgotTitle")}</h1>
          <p className="pp-sub" style={{ lineHeight: 1.5 }}>{t("forgotSub")}</p>
        </div>
        <label className="pp-field">
          {t("email")}
          <input className="pp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && <div className="pp-error"><i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />{error}</div>}
        <button className="pp-btn pp-btn-primary" type="submit" disabled={loading}>
          {loading ? t("loading") : t("sendLink")}
        </button>
        {sent && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 16, background: "var(--pp-green-tint)", border: "1px solid #B9E6D2" }}>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 19, color: "var(--pp-green)" }} />
            <span style={{ fontSize: 13.5, color: "#14684A", lineHeight: 1.45 }}>{t("sentMsg")}</span>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
