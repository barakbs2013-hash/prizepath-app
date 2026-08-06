import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ParentKidDetailPage({ params }: { params: Promise<{ kidId: string }> }) {
  const { kidId } = await params;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const { data: kid } = await supabase.from("profiles").select("*").eq("id", kidId).single();
  if (!kid) notFound();

  const [{ data: balanceData }, { data: tasks }] = await Promise.all([
    supabase.rpc("get_child_balance", { p_child_id: kidId }),
    supabase.from("tasks").select("*").eq("assigned_child_id", kidId).order("created_at", { ascending: false }).limit(10),
  ]);

  const balance = balanceData ?? 0;
  const doneCount = (tasks ?? []).filter((tk) => tk.status === "completed").length;
  const overdueCount = (tasks ?? []).filter((tk) => tk.status === "overdue").length;

  return (
    <div style={{ padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/parent/kids" className="pp-icon-btn"><i className="ph ph-arrow-left" style={{ fontSize: 17 }} /></Link>
        <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{t("childProfile")}</span>
      </div>

      <div className="pp-card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span className="pp-avatar" style={{ width: 64, height: 64, fontSize: 25 }}>{kid.display_name?.[0] ?? "?"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{kid.display_name}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--pp-amber-dark)" }}>{balance}</div>
          <div style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("points")}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(104px,1fr))", gap: 10 }}>
        <div className="pp-card" style={{ textAlign: "center" }}><div style={{ fontSize: 19, fontWeight: 700, color: "var(--pp-green)" }}>{doneCount}</div><div style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("doneThisMonth")}</div></div>
        <div className="pp-card" style={{ textAlign: "center" }}><div style={{ fontSize: 19, fontWeight: 700, color: "var(--pp-red-dark)" }}>{overdueCount}</div><div style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("overdue")}</div></div>
      </div>

      <h2 className="pp-h2">{t("recentActivity")}</h2>
      <div className="pp-card" style={{ padding: 6 }}>
        {(!tasks || tasks.length === 0) && <p className="pp-empty">{t("noTasks")}</p>}
        {tasks?.map((tk) => (
          <div key={tk.id} className="pp-list-row">
            <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{tk.title}</span>
              <span style={{ fontSize: 12, color: "var(--pp-text-faint)" }}>{new Date(tk.created_at).toLocaleDateString()}</span>
            </span>
            <span className="pp-pill pp-pill-neutral">{tk.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
