import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { RedeemButton } from "@/components/child/RedeemButton";

export default async function ChildRewardDetailPage({ params }: { params: Promise<{ rewardId: string }> }) {
  const { rewardId } = await params;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const [{ data: reward }, { data: balanceData }] = await Promise.all([
    supabase.from("rewards").select("*").eq("id", rewardId).single(),
    supabase.rpc("get_child_balance", { p_child_id: profile!.id }),
  ]);
  if (!reward) notFound();
  const balance = balanceData ?? 0;
  const canAfford = balance >= reward.points_cost;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ position: "relative", background: "linear-gradient(150deg,#FFE9B8,#FFD873)", height: 190, display: "grid", placeItems: "center", flex: "none" }}>
        <Link href="/child/store" className="pp-icon-btn" style={{ position: "absolute", top: 12, insetInlineStart: 16, border: "none", background: "#FFFFFFD9" }}>
          <i className="ph ph-arrow-left" style={{ fontSize: 17 }} />
        </Link>
        {reward.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reward.image_url} alt={reward.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <i className="ph-fill ph-ticket" style={{ fontSize: 76, color: "#B87B00" }} />
        )}
      </div>
      <div style={{ flex: 1, marginTop: -22, background: "var(--pp-bg-alt)", borderStartStartRadius: 26, borderStartEndRadius: 26, padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 23, fontWeight: 700 }}>{reward.name}</h1>
          {reward.description && <p style={{ margin: 0, fontSize: 14.5, color: "var(--pp-text-muted)", lineHeight: 1.55 }}>{reward.description}</p>}
        </div>
        <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13.5, color: "var(--pp-text-muted)" }}>{t("cost")}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 17, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
              <i className="ph-fill ph-star" style={{ fontSize: 18 }} />{reward.points_cost}
            </span>
          </div>
          <div className="pp-progress"><div style={{ width: `${Math.min(100, Math.round((balance / reward.points_cost) * 100))}%` }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: canAfford ? "#14684A" : "var(--pp-red-dark)" }}>
            <i className={canAfford ? "ph-fill ph-check-circle" : "ph-fill ph-x-circle"} style={{ fontSize: 16 }} />
            {canAfford ? t("canAfford") : t("cannotAfford")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--pp-text-muted)" }}>
            <i className="ph ph-user-check" style={{ fontSize: 16 }} />{t("needsParentOk")}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <RedeemButton rewardId={reward.id} balance={balance} cost={reward.points_cost} canAfford={canAfford} />
      </div>
    </div>
  );
}
