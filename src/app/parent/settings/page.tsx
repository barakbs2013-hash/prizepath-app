import { getCurrentProfile } from "@/lib/server/currentProfile";
import { getDictionary } from "@/lib/i18n";
import { LanguageSettingRow } from "@/components/LanguageSettingRow";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ParentSettingsPage() {
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;

  return (
    <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 className="pp-h1">{t("settings")}</h1>
      <button
        style={{
          display: "flex", alignItems: "center", gap: 13, padding: 16, borderRadius: 20, border: "none",
          background: "linear-gradient(120deg,#16305F,#2B6BF5)", color: "#fff", cursor: "pointer", textAlign: "start",
        }}
      >
        <span style={{ width: 44, height: 44, borderRadius: 15, background: "#FFFFFF24", display: "grid", placeItems: "center", flex: "none" }}>
          <i className="ph-fill ph-crown" style={{ fontSize: 22, color: "#FFC94A" }} />
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{t("upgradeTitle")}</span>
          <span style={{ fontSize: 12.5, opacity: 0.85 }}>{t("upgradeSub")}</span>
        </span>
      </button>

      <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
        <LanguageSettingRow />
      </div>

      <SignOutButton />
    </div>
  );
}
