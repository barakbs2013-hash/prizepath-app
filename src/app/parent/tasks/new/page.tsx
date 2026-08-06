"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

type Kid = { id: string; display_name: string };

export default function NewTaskPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [kids, setKids] = useState<Kid[]>([]);
  const [assignedChildId, setAssignedChildId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [pointsValue, setPointsValue] = useState(30);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ children: Kid[] }>("/api/children").then((res) => {
      setKids(res.children);
      if (res.children[0]) setAssignedChildId(res.children[0].id);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/tasks", {
        assignedChildId,
        title,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        urgency,
        pointsValue,
        requiresParentApproval: requiresApproval,
        requiresPhoto,
      });
      router.push("/parent/tasks");
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
        <Link href="/parent/tasks" className="pp-icon-btn"><i className="ph ph-x" style={{ fontSize: 17 }} /></Link>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{t("newTask")}</span>
      </div>
      <label className="pp-field">{t("taskTitle")}<input className="pp-input" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      <label className="pp-field">{t("taskExplain")}<textarea className="pp-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>

      <div className="pp-field">
        {t("assignTo")}
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {kids.map((k) => (
            <button
              type="button"
              key={k.id}
              onClick={() => setAssignedChildId(k.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 8px", borderRadius: 99,
                border: assignedChildId === k.id ? "1.5px solid var(--pp-blue)" : "1.5px solid var(--pp-border)",
                background: assignedChildId === k.id ? "var(--pp-blue-tint)" : "#fff", cursor: "pointer", fontSize: 13.5,
              }}
            >
              <span className="pp-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{k.display_name[0]}</span>
              {k.display_name}
            </button>
          ))}
        </div>
      </div>

      <label className="pp-field">{t("date")}<input className="pp-input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>

      <div className="pp-field">
        {t("urgency")}
        <div style={{ display: "flex", gap: 8 }}>
          {(["low", "medium", "high"] as const).map((u) => (
            <button
              type="button"
              key={u}
              onClick={() => setUrgency(u)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 13, cursor: "pointer",
                border: urgency === u ? "1.5px solid var(--pp-blue)" : "1.5px solid var(--pp-border)",
                background: urgency === u ? "var(--pp-blue-tint)" : "#fff",
              }}
            >
              {t(u === "high" ? "urgHigh" : u === "low" ? "urgLow" : "urgMedium")}
            </button>
          ))}
        </div>
      </div>

      <div className="pp-field">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("pointsValue")}</span>
          <span style={{ color: "var(--pp-amber-dark)", fontWeight: 700 }}>{pointsValue}</span>
        </div>
        <input type="range" min={0} max={200} step={5} value={pointsValue} onChange={(e) => setPointsValue(Number(e.target.value))} />
      </div>

      <label className="pp-checkbox-row">
        <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
        {t("requireApproval")}
      </label>
      <label className="pp-checkbox-row">
        <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} />
        {t("requirePhoto")}
      </label>

      {error && <div className="pp-error">{error}</div>}
      <button className="pp-btn pp-btn-primary" type="submit" disabled={loading || !assignedChildId}>
        {loading ? t("loading") : t("saveTask")}
      </button>
    </form>
  );
}
