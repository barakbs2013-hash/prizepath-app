import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForChild } from "@/lib/server/family";
import { isFamilyPremium } from "@/lib/server/subscription";
import { getDictionary } from "@/lib/i18n";
import { PipChat } from "@/components/child/PipChat";

// Pip is a Premium feature. The gate lives here as well as in the API route:
// this stops a free family from ever seeing the chat, while the route stops
// anyone from calling it directly.
export default async function PipChatPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;

  const familyId = profile ? await getFamilyForChild(profile.id) : null;
  if (await isFamilyPremium(familyId)) {
    return <PipChat taskId={taskId} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "linear-gradient(180deg,#F6F2FF,#EEF3FE 40%)" }}>
      <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid #E3EAF7", background: "#FFFFFFCC" }}>
        <Link href={`/child/task/${taskId}`} className="pp-icon-btn">
          <i className="ph ph-arrow-left" style={{ fontSize: 17 }} />
        </Link>
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{t("pipName")}</span>
      </div>

      <div style={{ padding: "34px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <span style={{ width: 68, height: 68, borderRadius: 22, background: "linear-gradient(120deg,#FFD873,#FFB020)", display: "grid", placeItems: "center" }}>
          <i className="ph-fill ph-lock-key" style={{ fontSize: 32, color: "#7A4E00" }} />
        </span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("premiumOnlyTitle")}</h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--pp-text-muted)" }}>{t("premiumOnlySub")}</p>
        <Link href={`/child/task/${taskId}`} className="pp-btn pp-btn-secondary" style={{ marginTop: 6 }}>
          {t("backToTask")}
        </Link>
      </div>
    </div>
  );
}
