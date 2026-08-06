import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ChildStorePage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const [{ data: rewards }, { data: balanceData }] = await Promise.all([
    supabase.from("rewards").select("*").eq("active", true).order("points_cost", { ascending: true }),
    supabase.rpc("get_child_balance", { p_child_id: profile!.id }),
  ]);
  const balance = balanceData ?? 0;

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="pp-h1" style={{ flex: 1 }}>{t("store")}</h1>
        <span className="pp-pill pp-pill-amber"><i className="ph-fill ph-star" />{balance}</span>
      </div>

      {(!rewards || rewards.length === 0) && <p className="pp-empty">{t("noTasks")}</p>}

      <div className="pp-grid-cards">
        {rewards?.map((r) => {
          const affordable = balance >= r.points_cost;
          const pct = Math.min(100, Math.round((balance / r.points_cost) * 100));
          return (
            <Link key={r.id} href={`/child/store/${r.id}`} className="pp-task-card" style={{ flexDirection: "column", alignItems: "stretch", padding: 0, overflow: "hidden" }}>
              <span style={{ height: 96, background: "linear-gradient(135deg,#DCE5F5,#EEF3FE)", display: "grid", placeItems: "center", position: "relative" }}>
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="ph-fill ph-gift" style={{ fontSize: 32, color: "var(--pp-amber-dark)" }} />
                )}
                {!affordable && (
                  <span style={{ position: "absolute", top: 8, insetInlineEnd: 8, background: "#16305FD9", color: "#fff", fontSize: 10.5, padding: "3px 8px", borderRadius: 99 }}>
                    <i className="ph ph-lock-simple" /> {t("locked")}
                  </span>
                )}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px 12px" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
                  <i className="ph-fill ph-star" style={{ fontSize: 14 }} />{r.points_cost}
                </span>
                <span style={{ height: 6, borderRadius: 99, background: "var(--pp-bg-alt)", overflow: "hidden", display: "block" }}>
                  <span style={{ display: "block", width: `${pct}%`, height: "100%", background: affordable ? "var(--pp-green)" : "var(--pp-amber)" }} />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
