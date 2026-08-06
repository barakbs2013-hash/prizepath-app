import Link from "next/link";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";

export default async function ParentKidsPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const familyId = await getFamilyForParent(profile!.id);

  const { data: children } = familyId
    ? await supabase
        .from("family_members")
        .select("profile:profiles!family_members_profile_id_fkey(id, display_name, avatar_url, is_active)")
        .eq("family_id", familyId)
        .eq("member_role", "child")
    : { data: [] as any[] };

  const kidsList = (children ?? []).map((row: any) => row.profile).filter(Boolean);

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="pp-h1" style={{ flex: 1 }}>{t("myChildren")}</h1>
        <Link href="/parent/kids/new" className="pp-icon-btn" style={{ background: "var(--pp-blue)", color: "#fff", border: "none" }}>
          <i className="ph ph-plus" style={{ fontSize: 19 }} />
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {kidsList.map((k: any) => (
          <Link key={k.id} href={`/parent/kids/${k.id}`} className="pp-task-card">
            <span className="pp-avatar">{k.display_name?.[0] ?? "?"}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{k.display_name}</span>
              {!k.is_active && <span style={{ fontSize: 12, color: "var(--pp-red-dark)" }}>Inactive</span>}
            </span>
            <i className="ph ph-caret-left" style={{ fontSize: 17, color: "var(--pp-text-faint)" }} />
          </Link>
        ))}
      </div>

      <Link href="/parent/kids/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 18, borderRadius: 20, border: "1.5px dashed #C6D8FA", background: "#F6F9FE", color: "var(--pp-blue)", fontWeight: 600 }}>
        <i className="ph ph-user-plus" style={{ fontSize: 19 }} />{t("addChild")}
      </Link>
    </div>
  );
}
