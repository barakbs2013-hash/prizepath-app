"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function TaskActions({
  taskId,
  status,
  requiresPhoto = false,
  hasPhoto = false,
}: {
  taskId: string;
  status: string;
  requiresPhoto?: boolean;
  hasPhoto?: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The database enforces this too (submit_task_completion raises
  // photo_required); blocking here just explains it before the round-trip.
  const photoMissing = requiresPhoto && !hasPhoto;

  async function markDone() {
    setLoading(true);
    setError(null);
    try {
      if (status === "pending") {
        await api.post(`/api/tasks/${taskId}/start`);
      }
      await api.post(`/api/tasks/${taskId}/complete`);
      router.push(`/child/task/${taskId}/done`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  if (["completed", "waiting_for_approval", "cancelled"].includes(status)) {
    return (
      <div className="pp-pill pp-pill-amber" style={{ width: "100%", justifyContent: "center", padding: 14 }}>
        {status === "waiting_for_approval" ? t("waitingApproval") : status === "completed" ? t("allDone") : status}
      </div>
    );
  }

  return (
    <div style={{ position: "sticky", bottom: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {error && (
        <div className="pp-error">
          <i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />
          {error}
        </div>
      )}
      {photoMissing && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--pp-text-muted)" }}>
          <i className="ph ph-camera" style={{ fontSize: 16 }} />
          {t("photoNeededFirst")}
        </div>
      )}
      <button className="pp-btn pp-btn-success" onClick={markDone} disabled={loading || photoMissing}>
        <i className="ph-fill ph-check-circle" style={{ fontSize: 20 }} />
        {loading ? t("loading") : t("markDone")}
      </button>
    </div>
  );
}
