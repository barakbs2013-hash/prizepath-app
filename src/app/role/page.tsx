"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RolePage() {
  const { t } = useLocale();
  const [role, setRole] = useState<"parent" | "child" | null>(null);
  const router = useRouter();

  function goContinue() {
    if (role === "parent") router.push("/signup");
    if (role === "child") router.push("/child-signin");
  }

  return (
    <AuthShell>
      <div className="pp-page-narrow" style={{ flex: 1 }}>
        <div style={{ textAlign: "center", paddingTop: 10 }}>
          <h1 className="pp-h1" style={{ marginBottom: 6, fontSize: 25 }}>{t("roleTitle")}</h1>
          <p className="pp-sub">{t("roleSub")}</p>
        </div>

        <button className={`pp-role-card ${role === "parent" ? "selected" : ""}`} onClick={() => setRole("parent")}>
          <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center", flex: "none" }}>
            <i className="ph-fill ph-users-three" style={{ fontSize: 28, color: "var(--pp-blue)" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{t("parent")}</span>
            <span style={{ fontSize: 13.5, color: "var(--pp-text-muted)" }}>{t("parentDesc")}</span>
          </span>
          {role === "parent" && <i className="ph-fill ph-check-circle" style={{ fontSize: 22, color: "var(--pp-blue)" }} />}
        </button>

        <button className={`pp-role-card ${role === "child" ? "selected" : ""}`} onClick={() => setRole("child")}>
          <span style={{ width: 56, height: 56, borderRadius: 18, background: "var(--pp-amber-tint)", display: "grid", placeItems: "center", flex: "none" }}>
            <i className="ph-fill ph-star" style={{ fontSize: 28, color: "var(--pp-amber-dark)" }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{t("child")}</span>
            <span style={{ fontSize: 13.5, color: "var(--pp-text-muted)" }}>{t("childDesc")}</span>
          </span>
          {role === "child" && <i className="ph-fill ph-check-circle" style={{ fontSize: 22, color: "var(--pp-amber-dark)" }} />}
        </button>

        <div style={{ flex: 1 }} />
        <button className="pp-btn pp-btn-primary" disabled={!role} onClick={goContinue}>
          {t("continueBtn")}
        </button>
      </div>
    </AuthShell>
  );
}
