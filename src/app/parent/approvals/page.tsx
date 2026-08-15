import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { ApprovalRow } from "@/components/parent/ApprovalRow";
import { getTaskPhotoUrls } from "@/lib/server/taskPhotos";

export default async function ParentApprovalsPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const familyId = await getFamilyForParent(profile!.id);

  const { data: tasks } = familyId
    ? await supabase
        .from("tasks")
        .select("*, child:profiles!tasks_assigned_child_id_fkey(display_name)")
        .eq("family_id", familyId)
        .eq("status", "waiting_for_approval")
        .order("completed_at", { ascending: true })
    : { data: [] as any[] };

  const photoUrls = await getTaskPhotoUrls(
    (tasks ?? []).filter((task: any) => task.requires_photo).map((task: any) => task.id)
  );

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/parent/home" className="pp-icon-btn"><i className="ph ph-arrow-left" style={{ fontSize: 17 }} /></Link>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, flex: 1 }}>{t("approvals")}</h1>
      </div>

      {(!tasks || tasks.length === 0) && <p className="pp-empty">{t("noApprovals")}</p>}

      {tasks?.map((task: any) => (
        <ApprovalRow
          key={task.id}
          taskId={task.id}
          title={task.title}
          childName={task.child?.display_name ?? ""}
          points={task.points_value}
          photoUrl={photoUrls[task.id] ?? null}
          requiresPhoto={task.requires_photo}
        />
      ))}
    </div>
  );
}
