"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, BackButton } from "@/components/auth/AuthShell";

export default function LangPage() {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();

  function choose(l: "he" | "en") {
    setLocale(l);
    router.back();
  }

  return (
    <AuthShell>
      <div className="pp-page-narrow">
        <BackButton href="/" />
        <div>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("langTitle")}</h1>
          <p className="pp-sub">{t("langSub")}</p>
        </div>

        {(
          [
            { code: "he" as const, label: "עברית", sub: "RTL · Hebrew" },
            { code: "en" as const, label: "English", sub: "LTR · English" },
          ]
        ).map((opt) => (
          <button
            key={opt.code}
            onClick={() => choose(opt.code)}
            className="pp-role-card"
            style={{ padding: "15px 16px" }}
          >
            <span
              style={{
                width: 34, height: 34, borderRadius: "50%", background: "var(--pp-bg-alt)",
                display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "var(--pp-blue)",
              }}
            >
              {opt.code.toUpperCase()}
            </span>
            <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 15.5 }}>{opt.label}</span>
              <span style={{ fontSize: 12.5, color: "var(--pp-text-muted)" }}>{opt.sub}</span>
            </span>
            {locale === opt.code && <i className="ph-fill ph-check-circle" style={{ fontSize: 21, color: "var(--pp-blue)" }} />}
          </button>
        ))}

        {(["العربية", "Français"]).map((label) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderRadius: 16,
              border: "1.5px solid #E3EAF7", background: "#F6F9FE", opacity: 0.6,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15.5, flex: 1 }}>{label}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--pp-text-muted)", background: "#E3EAF7", padding: "4px 9px", borderRadius: 99 }}>
              {t("soon")}
            </span>
          </div>
        ))}
      </div>
    </AuthShell>
  );
}
