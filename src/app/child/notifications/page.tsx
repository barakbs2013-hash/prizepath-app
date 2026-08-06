import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { MarkAllReadButton } from "@/components/MarkAllReadButton";

export default async function ChildNotificationsPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_profile_id", profile!.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="pp-h1" style={{ flex: 1 }}>{t("notifications")}</h1>
        <MarkAllReadButton label={t("markAllRead")} />
      </div>
      {(!notifications || notifications.length === 0) && <p className="pp-empty">{t("noNotifications")}</p>}
      {notifications?.map((n) => (
        <div key={n.id} className="pp-card" style={{ display: "flex", gap: 12, opacity: n.read_at ? 0.6 : 1 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center", flex: "none" }}>
            <i className="ph ph-bell" style={{ fontSize: 18, color: "var(--pp-blue)" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{n.title}</span>
            {n.message && <span style={{ fontSize: 13, color: "var(--pp-text-muted)" }}>{n.message}</span>}
            <span style={{ fontSize: 11.5, color: "var(--pp-text-faint-2)" }}>{new Date(n.created_at).toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
