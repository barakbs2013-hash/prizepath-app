import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ParentHomePage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const familyId = await getFamilyForParent(profile!.id);

  const [{ data: tasks }, { data: children }] = await Promise.all([
    familyId ? supabase.from("tasks").select("*").eq("family_id", familyId) : Promise.resolve({ data: [] as any[] }),
    familyId
      ? supabase
          .from("family_members")
          .select("profile:profiles!family_members_profile_id_fkey(id, display_name, avatar_url)")
          .eq("family_id", familyId)
          .eq("member_role", "child")
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const allTasks = tasks ?? [];
  const awaitingApproval = allTasks.filter((tk) => tk.status === "waiting_for_approval").length;
  const kidsList = (children ?? []).map((row: any) => row.profile).filter(Boolean);

  const balances = await Promise.all(
    kidsList.map((k: any) => supabase.rpc("get_child_balance", { p_child_id: k.id }))
  );

  const stats = [
    { icon: "ph-list-checks", value: allTasks.filter((tk) => tk.status !== "cancelled").length, label: t("allTasks"), color: "var(--pp-blue)" },
    { icon: "ph-check-circle", value: allTasks.filter((tk) => tk.status === "completed").length, label: t("doneToday"), color: "var(--pp-green)" },
    { icon: "ph-hourglass-high", value: awaitingApproval, label: t("awaitingApproval"), color: "var(--pp-amber-dark)" },
    { icon: "ph-users-three", value: kidsList.length, label: t("myChildren"), color: "var(--pp-purple)" },
  ];

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--pp-blue)", color: "#fff", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 600 }}>
          {profile?.displayName?.[0] ?? "?"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--pp-text-muted)" }}>{t("hiParent")}</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{profile?.displayName}</div>
        </div>
        <Link href="/parent/notifications" className="pp-icon-btn"><i className="ph ph-bell" style={{ fontSize: 19 }} /></Link>
      </div>

      {awaitingApproval > 0 && (
        <Link href="/parent/approvals" style={{ display: "flex", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, border: "1.5px solid #FFE0A3", background: "#FFF8E8", color: "var(--pp-text)" }}>
          <span style={{ width: 44, height: 44, borderRadius: 15, background: "var(--pp-amber)", display: "grid", placeItems: "center", flex: "none" }}>
            <i className="ph-fill ph-hourglass-high" style={{ fontSize: 22, color: "#fff" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{awaitingApproval} {t("awaitingApproval")}</span>
            <span style={{ fontSize: 12.5, color: "#7A5200" }}>{t("awaitingSub")}</span>
          </span>
        </Link>
      )}

      <div className="pp-grid-2">
        {stats.map((s) => (
          <div key={s.label} className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <i className={`ph ${s.icon}`} style={{ fontSize: 16, color: s.color }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: "var(--pp-text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/parent/tasks/new" className="pp-btn pp-btn-primary" style={{ flex: 1, minWidth: 150 }}>
          <i className="ph ph-plus-circle" style={{ fontSize: 18 }} />{t("newTask")}
        </Link>
        <Link href="/parent/rewards/new" className="pp-btn" style={{ flex: 1, minWidth: 150, background: "#FFF8E8", color: "#8A5A00", border: "1.5px solid #FFD873" }}>
          <i className="ph ph-gift" style={{ fontSize: 18 }} />{t("newReward")}
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="pp-h2">{t("myChildren")}</h2>
        <Link href="/parent/kids" style={{ fontSize: 13.5, fontWeight: 500 }}>{t("viewAll")}</Link>
      </div>

      {kidsList.length === 0 && <p className="pp-empty">{t("addChild")}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {kidsList.map((k: any, i: number) => (
          <Link key={k.id} href={`/parent/kids/${k.id}`} className="pp-task-card">
            <span className="pp-avatar">{k.display_name?.[0] ?? "?"}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{k.display_name}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13.5, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
              <i className="ph-fill ph-star" style={{ fontSize: 14 }} />{balances[i]?.data ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
