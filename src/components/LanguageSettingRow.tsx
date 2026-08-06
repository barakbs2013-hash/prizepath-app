"use client";

import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function LanguageSettingRow() {
  const { t, locale, setLocale } = useLocale();
  return (
    <button
      className="pp-list-row"
      style={{ width: "100%", border: "none", background: "#fff", cursor: "pointer", textAlign: "start" }}
      onClick={async () => {
        const next = locale === "he" ? "en" : "he";
        setLocale(next);
        try {
          await api.patch("/api/auth/me", { preferredLanguage: next });
        } catch {
          // best-effort sync
        }
      }}
    >
      <i className="ph ph-translate" style={{ fontSize: 19, color: "var(--pp-blue)" }} />
      <span style={{ flex: 1, fontSize: 14.5 }}>{t("language")}</span>
      <span style={{ fontSize: 13, color: "var(--pp-text-faint)" }}>{locale === "he" ? "עברית" : "English"}</span>
    </button>
  );
}
