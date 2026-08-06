"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export default function NewChildPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("10");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ username: string; pin: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ username: string; pin: string }>("/api/children", {
        displayName,
        age: Number(age) || undefined,
        username,
        pin,
      });
      setCreated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="pp-page-narrow">
        <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
          <i className="ph-fill ph-check-circle" style={{ fontSize: 40, color: "var(--pp-green)" }} />
          <h1 className="pp-h1">{t("createProfile")}</h1>
          <p className="pp-sub">{t("childAccountNote")}</p>
          <div style={{ background: "#F6F9FE", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 15 }}>
            <span><b>{t("username")}:</b> {created.username}</span>
            <span><b>{t("pin")}:</b> {created.pin}</span>
          </div>
          <button className="pp-btn pp-btn-primary" onClick={() => router.push("/parent/kids")}>{t("continueBtn")}</button>
        </div>
      </div>
    );
  }

  return (
    <form className="pp-page-narrow" onSubmit={onSubmit}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/parent/kids" className="pp-icon-btn"><i className="ph ph-arrow-left" style={{ fontSize: 17 }} /></Link>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{t("newChild")}</span>
      </div>
      <label className="pp-field">{t("childName")}<input className="pp-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></label>
      <div style={{ display: "flex", gap: 10 }}>
        <label className="pp-field" style={{ flex: 1 }}>{t("childAge")}<input className="pp-input" value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" /></label>
      </div>
      <label className="pp-field">{t("username")}<input className="pp-input" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required /></label>
      <label className="pp-field">{t("pin")}<input className="pp-input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required minLength={4} maxLength={6} /></label>
      <div style={{ background: "var(--pp-bg-alt)", borderRadius: 16, padding: 14, display: "flex", gap: 10 }}>
        <i className="ph-fill ph-info" style={{ fontSize: 18, color: "var(--pp-blue)" }} />
        <span style={{ fontSize: 13, color: "var(--pp-text-soft)", lineHeight: 1.5 }}>{t("childAccountNote")}</span>
      </div>
      {error && <div className="pp-error">{error}</div>}
      <button className="pp-btn pp-btn-primary" type="submit" disabled={loading}>{loading ? t("loading") : t("createProfile")}</button>
    </form>
  );
}
