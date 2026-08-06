import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ChildJournalPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("deadline, status")
    .eq("assigned_child_id", profile!.id)
    .gte("deadline", startOfMonth.toISOString())
    .lt("deadline", endOfMonth.toISOString());

  const byDay = new Map<number, { total: number; done: number }>();
  (tasks ?? []).forEach((tk) => {
    if (!tk.deadline) return;
    const day = new Date(tk.deadline).getDate();
    const entry = byDay.get(day) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (tk.status === "completed") entry.done += 1;
    byDay.set(day, entry);
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function dotColor(day: number) {
    const entry = byDay.get(day);
    if (!entry) return "transparent";
    if (entry.done === entry.total) return "var(--pp-green)";
    if (entry.done > 0) return "var(--pp-amber)";
    return "var(--pp-red)";
  }

  const weekDayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="pp-h1">{t("journal")}</h1>
      <div className="pp-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
          {now.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center", fontSize: 11, color: "var(--pp-text-faint)", marginBottom: 6 }}>
          {weekDayLabels.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {days.map((d) => (
            <span key={d} style={{ position: "relative", textAlign: "center", padding: "6px 0", fontSize: 13 }}>
              {d}
              <span style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: dotColor(d), margin: "2px auto 0" }} />
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "var(--pp-text-muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--pp-green)" }} />{t("allDone")}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--pp-amber)" }} />{t("partial")}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--pp-red)" }} />{t("missed")}</span>
      </div>
    </div>
  );
}
