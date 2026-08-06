"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, BackButton } from "@/components/auth/AuthShell";
import { api } from "@/lib/apiClient";

export default function ChildSignInPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/child-signin", { username, pin });
      router.push("/child/home");
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
        <BackButton href="/role" />
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--pp-amber-tint)", display: "grid", placeItems: "center" }}>
          <i className="ph-fill ph-star" style={{ fontSize: 30, color: "var(--pp-amber-dark)" }} />
        </div>
        <div>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("childLoginTitle")}</h1>
          <p className="pp-sub">{t("childLoginSub")}</p>
        </div>
        <label className="pp-field">
          {t("username")}
          <input className="pp-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="pp-field">
          {t("pin")}
          <input className="pp-input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required />
        </label>
        {error && <div className="pp-error"><i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />{error}</div>}
        <button className="pp-btn pp-btn-primary" type="submit" disabled={loading}>
          {loading ? t("loading") : t("continueBtn")}
        </button>
      </form>
    </AuthShell>
  );
}
