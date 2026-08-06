import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  authUserId: string;
  role: "parent" | "child";
  displayName: string;
  avatarUrl: string | null;
  preferredLanguage: string;
};

/**
 * Resolves the caller's own profile row from their Supabase session cookie.
 * Never trusts a client-supplied profile/parent/child id — every mutating
 * route must call this first and derive ids from the result.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, role, display_name, avatar_url, preferred_language")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) return null;

  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    role: profile.role,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    preferredLanguage: profile.preferred_language,
  };
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Not authenticated") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Not authorized") {
    super(message);
  }
}

export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new UnauthorizedError();
  return profile;
}

export async function requireParent(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role !== "parent") throw new ForbiddenError("Parent account required");
  return profile;
}

export async function requireChild(): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role !== "child") throw new ForbiddenError("Child account required");
  return profile;
}
