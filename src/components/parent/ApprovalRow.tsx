"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function ApprovalRow({ taskId, title, childName, points }: { taskId: string; title: string; childName: string; points: number }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      await api.post(`/api/tasks/${taskId}/${action}`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span className="pp-avatar">{childName?.[0] ?? "?"}</span>
        <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: 12.5, color: "var(--pp-text-faint)" }}>{childName}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--pp-amber-dark)" }}>
          <i className="ph-fill ph-star" style={{ fontSize: 14 }} />{points}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="pp-btn pp-btn-danger" disabled={!!loading} onClick={() => act("reject")}>
          <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 17 }} />{t("sendBack")}
        </button>
        <button className="pp-btn pp-btn-success" style={{ flex: 1.4 }} disabled={!!loading} onClick={() => act("approve")}>
          <i className="ph-fill ph-check-circle" style={{ fontSize: 17 }} />{t("approveAward")}
        </button>
      </div>
    </div>
  );
}
