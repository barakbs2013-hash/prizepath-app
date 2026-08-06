"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function TaskActions({ taskId, status }: { taskId: string; status: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ position: "sticky", bottom: 0, display: "flex", gap: 10 }}>
      {error && <div className="pp-error">{error}</div>}
      <button className="pp-btn pp-btn-success" onClick={markDone} disabled={loading}>
        <i className="ph-fill ph-check-circle" style={{ fontSize: 20 }} />
        {loading ? t("loading") : t("markDone")}
      </button>
    </div>
  );
}
