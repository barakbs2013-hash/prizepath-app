import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ParentRewardsPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const familyId = await getFamilyForParent(profile!.id);

  const { data: rewards } = familyId
    ? await supabase.from("rewards").select("*").eq("family_id", familyId).order("created_at", { ascending: false })
    : { data: [] as any[] };

  const { data: pendingRedemptions } = familyId
    ? await supabase.from("reward_redemptions").select("*, reward:rewards(name)").eq("status", "pending")
    : { data: [] as any[] };

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="pp-h1" style={{ flex: 1 }}>{t("rewardsMgmt")}</h1>
        <Link href="/parent/rewards/new" className="pp-icon-btn" style={{ background: "var(--pp-blue)", color: "#fff", border: "none" }}>
          <i className="ph ph-plus" style={{ fontSize: 19 }} />
        </Link>
      </div>

      {pendingRedemptions && pendingRedemptions.length > 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#FFF8E8", border: "1px solid #FFE0A3", borderRadius: 16, padding: "13px 14px" }}>
          <i className="ph-fill ph-bell-ringing" style={{ fontSize: 19, color: "#B87B00" }} />
          <span style={{ fontSize: 13.5, color: "#7A5200", flex: 1 }}>
            {pendingRedemptions.length} {t("waitingApproval")} — {pendingRedemptions[0].reward?.name}
          </span>
          <Link href="/parent/approvals" className="pp-btn pp-btn-sm" style={{ background: "var(--pp-amber)", color: "#fff", width: "auto" }}>{t("review")}</Link>
        </div>
      )}

      {(!rewards || rewards.length === 0) && <p className="pp-empty">{t("newReward")}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rewards?.map((r) => (
          <div key={r.id} className="pp-task-card" style={{ cursor: "default" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--pp-amber-tint)", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-gift" style={{ fontSize: 22, color: "var(--pp-amber-dark)" }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</span>
              <span style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
                  <i className="ph-fill ph-star" style={{ fontSize: 13 }} />{r.points_cost}
                </span>
                <span className="pp-pill pp-pill-neutral">{r.active ? t("available") : t("locked")}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
