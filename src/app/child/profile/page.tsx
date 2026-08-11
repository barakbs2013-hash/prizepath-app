import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { SignOutButton } from "@/components/SignOutButton";
import { GoogleSignInButton } from "@/components/auth/AuthShell";

export default async function ChildProfilePage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const { data: balanceData } = await supabase.rpc("get_child_balance", { p_child_id: profile!.id });
  const { count: completedCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_child_id", profile!.id)
    .eq("status", "completed");

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="pp-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
        <div className="pp-avatar" style={{ width: 78, height: 78, fontSize: 31 }}>{profile?.displayName?.[0] ?? "?"}</div>
        <div style={{ fontSize: 19, fontWeight: 700 }}>{profile?.displayName}</div>
        <div style={{ display: "flex", gap: 22, marginTop: 4 }}>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--pp-blue)" }}>{completedCount ?? 0}</span>
            <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("tasksDone")}</span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--pp-amber-dark)" }}>{balanceData ?? 0}</span>
            <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("points")}</span>
          </span>
        </div>
      </div>
      <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 13.5, color: "var(--pp-text-muted)" }}>{t("linkGoogleAccountHint")}</div>
        <GoogleSignInButton role="child" mode="link" next="/child/profile?linked=1" />
      </div>
      <SignOutButton />
    </div>
  );
}
