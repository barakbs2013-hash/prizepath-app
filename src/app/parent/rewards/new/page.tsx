"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export default function NewRewardPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState(200);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/rewards/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("genericError"));
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/rewards", { name, description: description || undefined, pointsCost, imageUrl });
      router.push("/parent/rewards");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="pp-page-narrow" onSubmit={onSubmit}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/parent/rewards" className="pp-icon-btn"><i className="ph ph-x" style={{ fontSize: 17 }} /></Link>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{t("newReward")}</span>
      </div>

      <div className="pp-field">
        {t("rewardImage")}
        <label
          style={{
            border: "1.5px dashed #C6D8FA", borderRadius: 20, background: "#F6F9FE", padding: 26,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 9, cursor: "pointer",
          }}
        >
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={onFileChange} />
          <span style={{ width: 52, height: 52, borderRadius: 16, background: "var(--pp-blue-tint)", display: "grid", placeItems: "center" }}>
            <i className="ph ph-cloud-arrow-up" style={{ fontSize: 26, color: "var(--pp-blue)" }} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--pp-blue)" }}>{uploading ? t("loading") : t("uploadImage")}</span>
          <span style={{ fontSize: 12, color: "var(--pp-text-faint)" }}>{t("uploadHint")}</span>
        </label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 14 }} />
        )}
      </div>

      <label className="pp-field">{t("rewardName")}<input className="pp-input" value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="pp-field">{t("rewardDesc")}<textarea className="pp-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>

      <div className="pp-field">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("rewardCost")}</span>
          <span style={{ color: "var(--pp-amber-dark)", fontWeight: 700 }}>{pointsCost}</span>
        </div>
        <input type="range" min={0} max={2000} step={10} value={pointsCost} onChange={(e) => setPointsCost(Number(e.target.value))} />
      </div>

      {error && <div className="pp-error">{error}</div>}
      <button className="pp-btn pp-btn-primary" type="submit" disabled={loading}>{loading ? t("loading") : t("saveReward")}</button>
    </form>
  );
}
