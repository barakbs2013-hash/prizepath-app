import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ChildWalletPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const [{ data: balanceData }, { data: ledger }] = await Promise.all([
    supabase.rpc("get_child_balance", { p_child_id: profile!.id }),
    supabase.from("points_ledger").select("*").eq("child_id", profile!.id).order("created_at", { ascending: false }).limit(50),
  ]);

  const balance = balanceData ?? 0;

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="pp-h1">{t("myPoints")}</h1>
      <div style={{ background: "linear-gradient(140deg,#2B6BF5,#1B4BB8)", borderRadius: 24, padding: 20, color: "#fff", boxShadow: "0 10px 24px rgba(43,107,245,.3)", display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 13, opacity: 0.85 }}>{t("balance")}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ph-fill ph-star" style={{ fontSize: 34, color: "#FFC94A" }} />
          <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>{balance}</span>
        </span>
      </div>

      <h2 className="pp-h2">{t("history")}</h2>
      <div className="pp-card" style={{ padding: 6 }}>
        {(!ledger || ledger.length === 0) && <p className="pp-empty">{t("noHistory")}</p>}
        {ledger?.map((entry) => (
          <div key={entry.id} className="pp-list-row">
            <span
              style={{
                width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", flex: "none",
                background: entry.amount > 0 ? "var(--pp-green-tint)" : "var(--pp-red-tint)",
              }}
            >
              <i className={entry.amount > 0 ? "ph-fill ph-plus-circle" : "ph-fill ph-minus-circle"} style={{ color: entry.amount > 0 ? "var(--pp-green)" : "var(--pp-red-dark)", fontSize: 17 }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{entry.reason}</span>
              <span style={{ fontSize: 12, color: "var(--pp-text-faint)" }}>{new Date(entry.created_at).toLocaleString()}</span>
            </span>
            <span style={{ fontWeight: 700, color: entry.amount > 0 ? "var(--pp-green)" : "var(--pp-red-dark)" }}>
              {entry.amount > 0 ? "+" : ""}{entry.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
