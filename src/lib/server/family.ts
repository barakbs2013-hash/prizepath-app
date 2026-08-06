import "server-only";
import { createServiceClient } from "@/lib/server/serviceClient";

/**
 * Creates a family for a brand-new parent, wires up family_members and a
 * default `free` subscription row. Called right after parent sign-up.
 */
export async function createFamilyForParent(params: { parentProfileId: string; familyName: string }) {
  const admin = createServiceClient();

  const { data: family, error: familyError } = await admin
    .from("families")
    .insert({ name: params.familyName, owner_parent_id: params.parentProfileId })
    .select("id")
    .single();
  if (familyError || !family) {
    throw new Error("Could not create family");
  }

  const { error: memberError } = await admin.from("family_members").insert({
    family_id: family.id,
    profile_id: params.parentProfileId,
    member_role: "parent",
  });
  if (memberError) {
    throw new Error("Could not link parent to family");
  }

  const { error: subError } = await admin.from("subscriptions").insert({
    family_id: family.id,
    plan: "free",
    status: "active",
  });
  if (subError) {
    throw new Error("Could not create subscription");
  }

  return family.id as string;
}

/**
 * Called from the OAuth callback route right after Supabase exchanges the
 * Google auth code for a session. Google sign-in bypasses the normal
 * /api/auth/parent-signup insert, so a first-time Google user has an
 * `auth.users` row but no `profiles` row yet — this creates one (as a
 * parent, matching the sign-up flow) plus their family, exactly once.
 * Safe to call on every login: no-ops if a profile already exists.
 */
export async function ensureParentProfileForOAuthUser(params: {
  authUserId: string;
  email: string | null;
  fullName: string | null;
}) {
  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();
  if (existing) return existing.id as string;

  const displayName = params.fullName?.trim() || params.email?.split("@")[0] || "Parent";

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: params.authUserId,
      role: "parent",
      display_name: displayName,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    console.error("[ensureParentProfileForOAuthUser] profile insert failed:", {
      authUserId: params.authUserId,
      code: profileError?.code,
      message: profileError?.message,
      details: profileError?.details,
      hint: profileError?.hint,
    });
    throw new Error("Could not create profile");
  }

  await createFamilyForParent({
    parentProfileId: profile.id,
    familyName: `${displayName}'s family`,
  });

  return profile.id as string;
}

export async function getFamilyForParent(parentProfileId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", parentProfileId)
    .eq("member_role", "parent")
    .maybeSingle();
  if (error || !data) return null;
  return data.family_id as string;
}

export async function getFamilyForChild(childProfileId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("family_members")
    .select("family_id")
    .eq("profile_id", childProfileId)
    .eq("member_role", "child")
    .maybeSingle();
  if (error || !data) return null;
  return data.family_id as string;
}
