"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

/**
 * Demo plan switch. Real billing would set the plan from a provider webhook,
 * never from the app — this exists so Premium-only features (Pip) can be
 * shown and hidden live without editing the database by hand.
 */
export function PlanSettingRow({ initialPlan }: { initialPlan: "free" | "premium" }) {
  const { t } = useLocale();
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const premium = plan === "premium";

  async function toggle() {
    const next = premium ? "free" : "premium";
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/subscription", { plan: next });
      setPlan(next);
      // Children's screens read the plan server-side, so refresh the tree.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        className="pp-list-row"
        style={{ width: "100%", border: "none", background: "#fff", cursor: "pointer", textAlign: "start" }}
        onClick={toggle}
        disabled={saving}
      >
        <i
          className={premium ? "ph-fill ph-crown" : "ph ph-crown"}
          style={{ fontSize: 19, color: premium ? "var(--pp-amber-dark)" : "var(--pp-text-faint)" }}
        />
        <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <span style={{ fontSize: 14.5 }}>{t("planLabel")}</span>
          <span style={{ fontSize: 12, color: "var(--pp-text-muted)" }}>{t("planToggleSub")}</span>
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 99,
            color: premium ? "#7A4E00" : "var(--pp-text-muted)",
            background: premium ? "linear-gradient(120deg,#FFD873,#FFB020)" : "var(--pp-bg-alt)",
          }}
        >
          {saving ? t("loading") : premium ? t("planPremium") : t("planFree")}
        </span>
      </button>
      {error && (
        <div className="pp-error" style={{ padding: "0 16px 12px" }}>
          <i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />
          {error}
        </div>
      )}
    </div>
  );
}
