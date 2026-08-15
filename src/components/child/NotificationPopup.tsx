"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { DictKey } from "@/lib/i18n";
import { api } from "@/lib/apiClient";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read_at: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
};

// Notification titles are written in English by the server (they predate the
// dictionary and are also read by parents), so the child-facing popup styles
// each type itself and only falls back to the stored title for unknown ones.
const STYLES: Record<string, { icon: string; tint: string; color: string; titleKey: DictKey }> = {
  task_approved: { icon: "ph-fill ph-confetti", tint: "var(--pp-green-tint)", color: "var(--pp-green)", titleKey: "notifTaskApproved" },
  task_sent_back: { icon: "ph-fill ph-arrow-counter-clockwise", tint: "var(--pp-amber-tint)", color: "var(--pp-amber-dark)", titleKey: "notifTaskSentBack" },
  redemption_approved: { icon: "ph-fill ph-gift", tint: "var(--pp-purple-tint)", color: "var(--pp-purple)", titleKey: "notifRedemptionApproved" },
  redemption_fulfilled: { icon: "ph-fill ph-package", tint: "var(--pp-purple-tint)", color: "var(--pp-purple)", titleKey: "notifRedemptionFulfilled" },
  redemption_rejected: { icon: "ph-fill ph-x-circle", tint: "var(--pp-red-tint)", color: "var(--pp-red-dark)", titleKey: "notifRedemptionRejected" },
};

const POLL_MS = 30_000;

/**
 * Shows unread notifications to a child as a popup, one at a time, instead of
 * waiting for them to open the bell screen — a task coming back with a reason
 * is worth interrupting for.
 *
 * Dismissing marks that one read, so it never reappears; the queue then shows
 * the next. Polling is cheap (one indexed query) and refreshes on focus, so a
 * child who leaves the tab open still sees new ones.
 */
export function NotificationPopup() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const [queue, setQueue] = useState<Notification[]>([]);
  const [dismissing, setDismissing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ notifications: Notification[] }>("/api/notifications");
      // Oldest first, so a child reads them in the order they happened.
      setQueue((res.notifications ?? []).filter((n) => !n.read_at).reverse());
    } catch {
      // A failed poll is not worth showing anyone — the bell screen still works.
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const current = queue[0];
  if (!current) return null;

  const style = STYLES[current.type];

  async function dismiss(thenGoToTask = false) {
    if (!current || dismissing) return;
    setDismissing(true);
    const { id, related_entity_type: entityType, related_entity_id: entityId } = current;
    try {
      await api.patch(`/api/notifications/${id}`);
    } catch {
      // Even if the mark-read call fails, don't trap the child behind a popup.
    } finally {
      setQueue((prev) => prev.filter((n) => n.id !== id));
      setDismissing(false);
      if (thenGoToTask && entityType === "task" && entityId) {
        router.push(`/child/task/${entityId}`);
      } else {
        router.refresh();
      }
    }
  }

  const canOpenTask = current.related_entity_type === "task" && Boolean(current.related_entity_id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={dir}
      onClick={() => dismiss()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "#0B1B3A66",
        display: "grid",
        placeItems: "center",
        padding: 22,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 24,
          padding: "22px 20px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
          boxShadow: "0 18px 44px rgba(11,27,58,.28)",
        }}
      >
        <span
          style={{
            width: 62,
            height: 62,
            borderRadius: 20,
            background: style?.tint ?? "var(--pp-blue-tint)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <i className={style?.icon ?? "ph-fill ph-bell"} style={{ fontSize: 30, color: style?.color ?? "var(--pp-blue)" }} />
        </span>

        <span style={{ fontSize: 18, fontWeight: 700 }}>{style ? t(style.titleKey) : current.title}</span>
        {current.message && (
          <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--pp-text-soft)" }}>{current.message}</span>
        )}

        {queue.length > 1 && (
          <span style={{ fontSize: 12, color: "var(--pp-text-faint)" }}>
            {queue.length - 1}+
          </span>
        )}

        <div style={{ display: "flex", gap: 9, width: "100%", marginTop: 2 }}>
          {canOpenTask && (
            <button className="pp-btn pp-btn-secondary" disabled={dismissing} onClick={() => dismiss(true)}>
              {t("openTask")}
            </button>
          )}
          <button className="pp-btn pp-btn-primary" style={{ flex: 1.3 }} disabled={dismissing} onClick={() => dismiss()}>
            {t("gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
