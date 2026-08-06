import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ParentTasksPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const familyId = await getFamilyForParent(profile!.id);

  const { data: tasks } = familyId
    ? await supabase.from("tasks").select("*, child:profiles!tasks_assigned_child_id_fkey(display_name)").eq("family_id", familyId).order("created_at", { ascending: false })
    : { data: [] as any[] };

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="pp-h1" style={{ flex: 1 }}>{t("allTasks")}</h1>
        <Link href="/parent/tasks/new" className="pp-icon-btn" style={{ background: "var(--pp-blue)", color: "#fff", border: "none" }}>
          <i className="ph ph-plus" style={{ fontSize: 19 }} />
        </Link>
      </div>

      {(!tasks || tasks.length === 0) && <p className="pp-empty">{t("noTasks")}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks?.map((task: any) => (
          <div key={task.id} className="pp-task-card" style={{ cursor: "default" }}>
            <span className="pp-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{task.child?.display_name?.[0] ?? "?"}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{task.title}</span>
              <span className="pp-pill pp-pill-neutral">{task.status}</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
                <i className="ph-fill ph-star" style={{ fontSize: 13 }} />{task.points_value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
