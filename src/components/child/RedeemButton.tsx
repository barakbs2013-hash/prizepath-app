"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function RedeemButton({ rewardId, balance, cost, canAfford }: { rewardId: string; balance: number; cost: number; canAfford: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/redemptions", { rewardId });
      router.push("/child/store");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="pp-btn pp-btn-primary" disabled={!canAfford} onClick={() => setOpen(true)}>
        <i className="ph-fill ph-gift" style={{ fontSize: 20 }} />{t("redeem")}
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#16305FA6", display: "flex", alignItems: "flex-end", zIndex: 50, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: "100%", background: "#fff", borderStartStartRadius: 28, borderStartEndRadius: 28, padding: "22px 22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ width: 44, height: 5, borderRadius: 99, background: "var(--pp-border)", alignSelf: "center" }} />
            <div style={{ width: 62, height: 62, borderRadius: 20, background: "var(--pp-amber-tint)", display: "grid", placeItems: "center", alignSelf: "center" }}>
              <i className="ph-fill ph-gift" style={{ fontSize: 31, color: "var(--pp-amber-dark)" }} />
            </div>
            <h2 style={{ margin: 0, textAlign: "center", fontSize: 20, fontWeight: 700 }}>{t("confirmRedeem")}</h2>
            <p style={{ margin: 0, textAlign: "center", fontSize: 14.5, color: "var(--pp-text-muted)", lineHeight: 1.55 }}>{t("confirmRedeemSub")}</p>
            <div style={{ background: "#F6F9FE", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
              <span style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pp-text-muted)" }}>{t("balance")}</span><span style={{ fontWeight: 600 }}>{balance}</span></span>
              <span style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pp-text-muted)" }}>{t("cost")}</span><span style={{ fontWeight: 600, color: "var(--pp-red-dark)" }}>−{cost}</span></span>
              <span style={{ height: 1, background: "var(--pp-border)" }} />
              <span style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--pp-text-muted)" }}>{t("after")}</span><span style={{ fontWeight: 700, color: "var(--pp-blue)" }}>{balance - cost}</span></span>
            </div>
            {error && <div className="pp-error">{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pp-btn pp-btn-secondary" onClick={() => setOpen(false)}>{t("cancel")}</button>
              <button className="pp-btn pp-btn-primary" onClick={confirm} disabled={loading}>{loading ? t("loading") : t("confirmSend")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
