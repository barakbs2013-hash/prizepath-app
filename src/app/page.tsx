"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell, LangPill } from "@/components/auth/AuthShell";

export default function WelcomePage() {
  const { t } = useLocale();
  return (
    <AuthShell>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg,#FFFFFF,#EAF1FE 55%,#E1EBFF)",
        }}
      >
        <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--pp-blue-dark)" }}>PrizePath</span>
          <LangPill />
        </div>

        <div style={{ padding: "40px 26px 0", textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>🏆</div>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.22, fontWeight: 700 }}>{t("welcomeTitle")}</h1>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--pp-text-muted)" }}>{t("welcomeSub")}</p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "18px 22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/role" className="pp-btn pp-btn-primary">
            {t("getStarted")}
          </Link>
          <Link href="/signin" className="pp-btn pp-btn-secondary">
            {t("haveAccount")}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
