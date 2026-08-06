import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function TaskDonePage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  if (!task) notFound();

  const awaitingApproval = task.status === "waiting_for_approval";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "30px 26px", gap: 15, background: "linear-gradient(180deg,#EAF7F1,#EEF3FE 60%)" }}>
      <div style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--pp-green)", display: "grid", placeItems: "center", boxShadow: "0 14px 30px rgba(31,169,113,.32)" }}>
        <i className="ph-fill ph-check" style={{ fontSize: 52, color: "#fff" }} />
      </div>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{t("doneTitle")}</h1>
      <p style={{ margin: 0, fontSize: 15, color: "var(--pp-text-muted)", lineHeight: 1.55, maxWidth: 300 }}>{t("doneSub")}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", padding: "13px 20px", borderRadius: 99, boxShadow: "var(--pp-shadow-sm)" }}>
        <i className="ph-fill ph-star" style={{ fontSize: 23, color: "var(--pp-amber)" }} />
        <span style={{ fontSize: 19, fontWeight: 700, color: "var(--pp-amber-dark)" }}>+{task.points_value}</span>
        <span style={{ fontSize: 14, color: "var(--pp-text-muted)" }}>{t("points")}</span>
      </div>
      {awaitingApproval && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#FFF8E8", border: "1px solid #FFE0A3", borderRadius: 16, padding: "12px 15px", textAlign: "start" }}>
          <i className="ph-fill ph-hourglass-high" style={{ fontSize: 19, color: "#B87B00" }} />
          <span style={{ fontSize: 13.5, color: "#7A5200", lineHeight: 1.45 }}>{t("waitingApprovalMsg")}</span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340, marginTop: 4 }}>
        <Link href="/child/store" className="pp-btn pp-btn-primary">{t("goStore")}</Link>
        <Link href="/child/home" className="pp-btn pp-btn-secondary">{t("backHome")}</Link>
      </div>
    </div>
  );
}
