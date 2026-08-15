import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n";
import { TaskActions } from "@/components/child/TaskActions";
import { TaskPhotoProof } from "@/components/child/TaskPhotoProof";
import { getTaskPhotoUrl } from "@/lib/server/taskPhotos";
import { isFamilyPremium } from "@/lib/server/subscription";

export default async function ChildTaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const profile = await getCurrentProfile();
  const t = (k: string) => (getDictionary(profile?.preferredLanguage ?? "he") as Record<string, string>)[k] ?? k;
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  if (!task) notFound();

  const { data: steps } = await supabase.from("task_steps").select("*").eq("task_id", taskId).order("position");

  const photoUrl = task.requires_photo ? await getTaskPhotoUrl(taskId) : null;
  const premium = await isFamilyPremium(task.family_id);

  const urgencyLabel = task.urgency === "high" ? t("urgHigh") : task.urgency === "low" ? t("urgLow") : t("urgMedium");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="pp-topbar" style={{ padding: "8px 16px 16px" }}>
        <Link href="/child/home" className="pp-icon-btn"><i className="ph ph-arrow-left" style={{ fontSize: 17 }} /></Link>
        <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{t("taskDetails")}</span>
      </div>

      <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="pp-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
            <span style={{ width: 50, height: 50, borderRadius: 16, background: "var(--pp-bg-alt)", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-checks" style={{ fontSize: 24, color: "var(--pp-blue)" }} />
            </span>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>{task.title}</h1>
              <span className={`pp-pill ${task.urgency === "high" ? "pp-pill-red" : task.urgency === "low" ? "pp-pill-green" : "pp-pill-amber"}`}>
                {urgencyLabel}
              </span>
            </div>
          </div>
          {task.description && <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--pp-text-soft)" }}>{task.description}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
            <div style={{ background: "#F6F9FE", borderRadius: 14, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("deadline")}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{task.deadline ? new Date(task.deadline).toLocaleString() : "—"}</span>
            </div>
            <div style={{ background: "#F6F9FE", borderRadius: 14, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("reward")}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--pp-amber-dark)" }}>{task.points_value} {t("pts")}</span>
            </div>
            <div style={{ background: "#F6F9FE", borderRadius: 14, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11.5, color: "var(--pp-text-muted)" }}>{t("approval")}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{task.requires_parent_approval ? t("needsApproval") : t("noApprovalNeeded")}</span>
            </div>
          </div>

          {steps && steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                  <i className={s.completed ? "ph-fill ph-check-circle" : "ph ph-circle"} style={{ color: s.completed ? "var(--pp-green)" : "var(--pp-text-faint)" }} />
                  {s.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pip is Premium-only. Free families still see the card — it's how
            they learn the feature exists — but it doesn't link anywhere. */}
        {premium ? (
          <Link
            href={`/child/ai/${task.id}`}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, border: "1.5px dashed #B9A8F0", background: "var(--pp-purple-tint)", color: "var(--pp-text)" }}
          >
            <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--pp-purple)", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-sparkle" style={{ fontSize: 21, color: "#fff" }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{t("stuck")}</span>
              <span style={{ fontSize: 12.5, color: "var(--pp-text-muted)" }}>{t("stuckSub")}</span>
            </span>
          </Link>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, border: "1.5px dashed #E0E6F2", background: "var(--pp-bg-alt)", color: "var(--pp-text-muted)" }}>
            <span style={{ width: 42, height: 42, borderRadius: 14, background: "#E7EBF3", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-lock-key" style={{ fontSize: 20, color: "var(--pp-text-faint)" }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5, color: "var(--pp-text)" }}>{t("stuck")}</span>
              <span style={{ fontSize: 12.5 }}>{t("premiumOnlySub")}</span>
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7A4E00", background: "linear-gradient(120deg,#FFD873,#FFB020)", padding: "5px 9px", borderRadius: 99 }}>PRO</span>
          </div>
        )}

        {task.requires_photo && <TaskPhotoProof taskId={task.id} photoUrl={photoUrl} />}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "14px 16px 18px" }}>
        <TaskActions
          taskId={task.id}
          status={task.status}
          requiresPhoto={task.requires_photo}
          hasPhoto={Boolean(photoUrl)}
        />
      </div>
    </div>
  );
}
