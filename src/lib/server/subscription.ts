import "server-only";
import { createServiceClient } from "@/lib/server/serviceClient";

export type Plan = "free" | "premium";

/**
 * Reads a family's plan. Subscriptions have no client write policy, and only
 * a parent-select read policy, so this always goes through the service role —
 * a child needs to know the family's plan too (Pip is premium-only) and
 * cannot read the row itself.
 *
 * A family with no subscription row counts as free rather than erroring:
 * families created before the free-row insert existed shouldn't get a
 * free upgrade or a crash.
 */
export async function getFamilyPlan(familyId: string | null): Promise<Plan> {
  if (!familyId) return "free";
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    console.error("[subscription] could not read plan:", familyId, error);
    return "free";
  }
  return data?.plan === "premium" && data?.status === "active" ? "premium" : "free";
}

export async function isFamilyPremium(familyId: string | null): Promise<boolean> {
  return (await getFamilyPlan(familyId)) === "premium";
}

/**
 * Flips a family's plan. Until real billing exists this is driven by the
 * demo toggle in parent settings, so it upserts rather than assuming the
 * free row is already there.
 */
export async function setFamilyPlan(familyId: string, plan: Plan) {
  const admin = createServiceClient();
  const { error } = await admin
    .from("subscriptions")
    .upsert({ family_id: familyId, plan, status: "active" }, { onConflict: "family_id" });
  if (error) {
    console.error("[subscription] could not set plan:", familyId, plan, error);
    throw new Error("Could not change the plan");
  }
  return plan;
}
