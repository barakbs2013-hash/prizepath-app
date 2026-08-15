"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function ApprovalRow({
  taskId,
  title,
  childName,
  points,
  photoUrl = null,
  requiresPhoto = false,
}: {
  taskId: string;
  title: string;
  childName: string;
  points: number;
  photoUrl?: string | null;
  requiresPhoto?: boolean;
}) {
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
      {/* The proof photo is the whole point of requires_photo — show it here
          so approving is a decision, not a guess. */}
      {photoUrl && (
        <a href={photoUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload
              on a Supabase public bucket; no image loader for that host. */}
          <img
            src={photoUrl}
            alt={t("photoAttached")}
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14 }}
          />
        </a>
      )}
      {requiresPhoto && !photoUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--pp-text-muted)" }}>
          <i className="ph ph-camera-slash" style={{ fontSize: 16 }} />
          {t("photoMissing")}
        </div>
      )}
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
