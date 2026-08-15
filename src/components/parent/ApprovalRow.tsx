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
  // Sending back opens the reason panel first; approving is still one tap.
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // Tapping a preset fills the note rather than sending immediately, so a
  // parent can pick the closest one and then adjust the wording.
  const presets = [
    t("rejectReasonNotClean"),
    t("rejectReasonUnfinished"),
    t("rejectReasonPhotoUnclear"),
    t("rejectReasonPhotoWrong"),
    t("rejectReasonPartial"),
    t("rejectReasonRedo"),
  ];

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      await api.post(
        `/api/tasks/${taskId}/${action}`,
        action === "reject" && reason.trim() ? { reason: reason.trim() } : undefined
      );
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
      {rejecting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: 13, borderRadius: 16, background: "var(--pp-bg-alt)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{t("rejectReasonTitle")}</span>
          <span style={{ fontSize: 12.5, color: "var(--pp-text-muted)" }}>{t("rejectReasonSub")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                style={{
                  border: reason === p ? "1.5px solid var(--pp-blue)" : "1.5px solid #DCE3EF",
                  background: reason === p ? "var(--pp-blue-tint)" : "#fff",
                  color: reason === p ? "var(--pp-blue-dark)" : "var(--pp-text-soft)",
                  fontSize: 12.5,
                  fontWeight: 500,
                  padding: "8px 12px",
                  borderRadius: 99,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            className="pp-input"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("rejectReasonPlaceholder")}
            maxLength={300}
            style={{ resize: "none", fontFamily: "inherit" }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {rejecting ? (
          <>
            <button
              className="pp-btn pp-btn-secondary"
              disabled={!!loading}
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
            >
              {t("cancel")}
            </button>
            <button className="pp-btn pp-btn-danger" style={{ flex: 1.4 }} disabled={!!loading} onClick={() => act("reject")}>
              <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 17 }} />
              {loading === "reject" ? t("loading") : t("rejectConfirm")}
            </button>
          </>
        ) : (
          <>
            <button className="pp-btn pp-btn-danger" disabled={!!loading} onClick={() => setRejecting(true)}>
              <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 17 }} />{t("sendBack")}
            </button>
            <button className="pp-btn pp-btn-success" style={{ flex: 1.4 }} disabled={!!loading} onClick={() => act("approve")}>
              <i className="ph-fill ph-check-circle" style={{ fontSize: 17 }} />{t("approveAward")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
