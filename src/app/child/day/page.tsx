import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ChildDayPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "today" } = await searchParams;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("assigned_child_id", profile!.id)
    .order("deadline", { ascending: true });

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);

  const filtered = (tasks ?? []).filter((tk) => {
    if (!tk.deadline) return range === "today";
    const d = startOfDay(new Date(tk.deadline));
    if (range === "today") return d.getTime() === today.getTime();
    if (range === "tomorrow") return d.getTime() === tomorrow.getTime();
    return d >= today && d < weekEnd;
  });

  const blocks: { label: string; icon: string; items: typeof filtered }[] = [
    { label: t("morning"), icon: "ph-sun", items: filtered.filter((tk) => !tk.deadline || new Date(tk.deadline).getHours() < 12) },
    { label: t("afternoon"), icon: "ph-sun-horizon", items: filtered.filter((tk) => tk.deadline && new Date(tk.deadline).getHours() >= 12 && new Date(tk.deadline).getHours() < 18) },
    { label: t("evening"), icon: "ph-moon-stars", items: filtered.filter((tk) => tk.deadline && new Date(tk.deadline).getHours() >= 18) },
  ].filter((b) => b.items.length > 0);

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="pp-h1">{t("myDay")}</h1>
      <div style={{ display: "flex", gap: 6, padding: 4, background: "#E1E9F8", borderRadius: 14 }}>
        {(["today", "tomorrow", "week"] as const).map((r) => (
          <Link
            key={r}
            href={`/child/day?range=${r}`}
            style={{
              flex: 1, textAlign: "center", padding: 9, borderRadius: 11, fontSize: 13.5,
              background: range === r ? "#fff" : "transparent", color: range === r ? "var(--pp-text)" : "var(--pp-text-muted)",
              fontWeight: range === r ? 600 : 400, boxShadow: range === r ? "0 2px 6px rgba(23,53,107,.08)" : "none",
            }}
          >
            {t(r)}
          </Link>
        ))}
      </div>

      {blocks.length === 0 && <p className="pp-empty">{t("noTasks")}</p>}

      {blocks.map((b) => (
        <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--pp-text-muted)", fontSize: 12.5, fontWeight: 600, textTransform: "uppercase" }}>
            <i className={`ph ${b.icon}`} style={{ fontSize: 15 }} />{b.label}
            <span style={{ flex: 1, height: 1, background: "var(--pp-border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 9 }}>
            {b.items.map((task) => (
              <Link key={task.id} href={`/child/task/${task.id}`} className="pp-task-card">
                <span style={{ width: 44, height: 44, borderRadius: 15, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center", flex: "none" }}>
                  <i className="ph-fill ph-checks" style={{ fontSize: 20, color: "var(--pp-blue)" }} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</span>
                  <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>
                    {task.deadline ? new Date(task.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
                  <i className="ph-fill ph-star" style={{ fontSize: 14 }} />{task.points_value}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
