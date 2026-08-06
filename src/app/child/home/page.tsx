import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

function urgencyPill(urgency: string, t: (k: any) => string) {
  const map: Record<string, { cls: string; icon: string; key: string }> = {
    high: { cls: "pp-pill-red", icon: "ph-fill ph-warning", key: "urgHigh" },
    medium: { cls: "pp-pill-amber", icon: "ph ph-clock-countdown", key: "urgMedium" },
    low: { cls: "pp-pill-green", icon: "ph ph-leaf", key: "urgLow" },
  };
  const m = map[urgency] ?? map.medium;
  return (
    <span className={`pp-pill ${m.cls}`}>
      <i className={m.icon} style={{ fontSize: 12 }} />
      {t(m.key)}
    </span>
  );
}

export default async function ChildHomePage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => getDictionary(profile?.preferredLanguage ?? "he")[k as keyof ReturnType<typeof getDictionary>] ?? k;
  const supabase = await createClient();

  const [{ data: tasks }, { data: balanceData }, { data: rewards }] = await Promise.all([
    supabase.from("tasks").select("*").eq("assigned_child_id", profile!.id).order("deadline", { ascending: true }),
    supabase.rpc("get_child_balance", { p_child_id: profile!.id }),
    supabase.from("rewards").select("*").eq("active", true).order("points_cost", { ascending: false }).limit(1),
  ]);

  const allTasks = tasks ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = allTasks.filter((tk) => {
    if (!tk.deadline) return tk.status === "pending" || tk.status === "in_progress";
    const d = new Date(tk.deadline);
    return d.toDateString() === new Date().toDateString();
  });
  const doneToday = allTasks.filter((tk) => tk.status === "completed").length;
  const leftToday = todayTasks.filter((tk) => !["completed", "cancelled"].includes(tk.status)).length;
  const balance = balanceData ?? 0;
  const bigGoal = rewards?.[0];
  const goalPct = bigGoal ? Math.min(100, Math.round((balance / bigGoal.points_cost) * 100)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "linear-gradient(160deg,#2B6BF5,#1B4BB8)",
          padding: "16px 20px 58px",
          borderEndStartRadius: 28,
          borderEndEndRadius: 28,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="pp-avatar">{profile?.displayName?.[0] ?? "?"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.82 }}>{t("hi")}</div>
            <div style={{ fontSize: 19, fontWeight: 600 }}>{profile?.displayName}</div>
          </div>
          <Link href="/child/notifications" className="pp-icon-btn" style={{ background: "#FFFFFF26", border: "none", color: "#fff" }}>
            <i className="ph ph-bell" style={{ fontSize: 19 }} />
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, background: "#FFFFFF1F", border: "1px solid #FFFFFF33", padding: "12px 14px", borderRadius: 18 }}>
          <i className="ph-fill ph-star" style={{ fontSize: 24, color: "#FFC94A" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 23, fontWeight: 700, lineHeight: 1 }}>{balance}</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>{t("points")}</span>
          </div>
          {bigGoal && (
            <>
              <div style={{ width: 1, height: 34, background: "#FFFFFF33", marginInline: 6 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, opacity: 0.9 }}>
                  <span>{t("nextReward")}</span>
                  <span>{balance} / {bigGoal.points_cost}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "#FFFFFF33", overflow: "hidden" }}>
                  <div style={{ width: `${goalPct}%`, height: "100%", background: "linear-gradient(90deg,#FFC94A,#FFB020)", borderRadius: 99 }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px 24px", marginTop: -40, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="pp-stat-box"><span style={{ fontSize: 20, fontWeight: 700, color: "var(--pp-blue)" }}>{leftToday}</span><span style={{ fontSize: 12, color: "var(--pp-text-muted)" }}>{t("leftToday")}</span></div>
          <div className="pp-stat-box"><span style={{ fontSize: 20, fontWeight: 700, color: "var(--pp-green)" }}>{doneToday}</span><span style={{ fontSize: 12, color: "var(--pp-text-muted)" }}>{t("doneToday")}</span></div>
          <div className="pp-stat-box"><span style={{ fontSize: 20, fontWeight: 700, color: "var(--pp-amber-dark)" }}>0</span><span style={{ fontSize: 12, color: "var(--pp-text-muted)" }}>{t("streak")}</span></div>
        </div>

        <Link
          href={todayTasks[0] ? `/child/ai/${todayTasks[0].id}` : "#"}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 20,
            border: "1.5px solid #DCD3FA", background: "linear-gradient(120deg,#F3EFFF,#EAF1FF)", color: "var(--pp-text)",
          }}
        >
          <span style={{ width: 44, height: 44, borderRadius: 15, background: "var(--pp-purple)", display: "grid", placeItems: "center" }}>
            <i className="ph-fill ph-sparkle" style={{ fontSize: 22, color: "#fff" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{t("askPip")}</span>
            <span style={{ fontSize: 12.5, color: "var(--pp-text-muted)" }}>{t("askPipSub")}</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="pp-h2">{t("todayTasks")}</h2>
          <Link href="/child/day" style={{ fontSize: 13.5, fontWeight: 500 }}>{t("viewAll")}</Link>
        </div>

        {todayTasks.length === 0 && <p className="pp-empty">{t("noTasks")}</p>}
        {todayTasks.map((task) => (
          <Link key={task.id} href={`/child/task/${task.id}`} className="pp-task-card">
            <span style={{ width: 46, height: 46, borderRadius: 15, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-checks" style={{ fontSize: 21, color: "var(--pp-blue)" }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{task.title}</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>{urgencyPill(task.urgency, t)}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
              <i className="ph-fill ph-star" style={{ fontSize: 14 }} />{task.points_value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
