"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Photo-proof card on the child's task screen. The button used to be a
 * disabled placeholder — it now opens the camera (or the gallery) through a
 * hidden file input, uploads, and refreshes the route so the server re-renders
 * with the photo attached, which is also what unlocks "I finished the task".
 */
export function TaskPhotoProof({ taskId, photoUrl }: { taskId: string; photoUrl: string | null }) {
  const { t } = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Shows the just-picked photo immediately, before the server round-trip.
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? photoUrl;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset straight away so picking the same file twice still fires change.
    e.target.value = "";
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tasks/${taskId}/photo`, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t("photoUploadFailed"));
      router.refresh();
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : t("photoUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14.5 }}>
        <i className="ph ph-camera" style={{ fontSize: 19, color: "var(--pp-blue)" }} />
        {t("photoProof")}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--pp-text-muted)" }}>{t("photoProofSub")}</p>

      {shown && (
        // eslint-disable-next-line @next/next/no-img-element -- user upload on
        // a Supabase public bucket; no loader configured for that host.
        <img
          src={shown}
          alt={t("photoAttached")}
          style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 16, opacity: uploading ? 0.6 : 1 }}
        />
      )}

      {shown && !uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--pp-green)" }}>
          <i className="ph-fill ph-check-circle" style={{ fontSize: 16 }} />
          {t("photoAttached")}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // Asks a phone to open the rear camera directly; on desktop, and on
        // phones that ignore it, this falls back to the normal file picker.
        capture="environment"
        onChange={onFileChange}
        style={{ display: "none" }}
      />
      <button
        className="pp-btn pp-btn-secondary"
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <i className="ph ph-camera-plus" style={{ fontSize: 22 }} />
        {uploading ? t("photoUploading") : shown ? t("photoRetake") : t("addPhoto")}
      </button>

      {error && (
        <div className="pp-error">
          <i className="ph-fill ph-warning-circle" style={{ fontSize: 16 }} />
          {error}
        </div>
      )}
    </div>
  );
}
