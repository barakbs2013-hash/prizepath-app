import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { createServiceClient } from "@/lib/server/serviceClient";

const CHILD_EMAIL_DOMAIN = "child.prizepath.local";

function childInternalEmail(username: string) {
  return `${username}@${CHILD_EMAIL_DOMAIN}`;
}

function generateRandomPassword() {
  // 32 bytes of randomness, base64url — never shown to anyone, never
  // reused; only exists so Supabase Auth has a password-grant credential to
  // authenticate the underlying auth.users row against server-side.
  return randomBytes(32).toString("base64url");
}

/**
 * Creates a brand-new child login: a real `auth.users` row (via the admin
 * API, service role only), a `profiles` row, a `family_members` row, and a
 * `child_credentials` row storing a bcrypt hash of the PIN. The random
 * Supabase Auth password is stored (also service-role only, inside
 * child_credentials is NOT an option since that table only holds pin_hash —
 * instead we keep the random password in Supabase Auth itself and simply
 * re-derive a fresh one on each login by using `admin.updateUserById` to
 * rotate the password at sign-in time; see verifyChildLogin below).
 */
export async function createChildLogin(params: {
  familyId: string;
  displayName: string;
  username: string;
  pin: string;
  preferredLanguage?: string;
}) {
  const admin = createServiceClient();
  const { familyId, displayName, username, pin, preferredLanguage } = params;

  const { data: existing } = await admin
    .from("child_credentials")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (existing) {
    throw new Error("Username already taken");
  }

  const email = childInternalEmail(username);
  const tempPassword = generateRandomPassword();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "child", username },
  });
  if (authError || !authUser?.user) {
    throw new Error(authError?.message ?? "Could not create child account");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: authUser.user.id,
      role: "child",
      display_name: displayName,
      preferred_language: preferredLanguage ?? "he",
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Could not create child profile");
  }

  const { error: memberError } = await admin.from("family_members").insert({
    family_id: familyId,
    profile_id: profile.id,
    member_role: "child",
  });
  if (memberError) {
    throw new Error("Could not link child to family");
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const { error: credError } = await admin.from("child_credentials").insert({
    profile_id: profile.id,
    username,
    pin_hash: pinHash,
  });
  if (credError) {
    throw new Error("Could not store child credentials");
  }

  return { profileId: profile.id as string, username, authUserId: authUser.user.id as string };
}

/**
 * Verifies username+PIN against `child_credentials` (service role only —
 * this table has zero client-facing RLS policies) and, on success, mints a
 * real Supabase session for the child's underlying auth user.
 *
 * Mechanism: we don't persist the child's real Auth password anywhere (it
 * would be a second secret to protect). Instead, on every successful PIN
 * verification we rotate the auth user's password to a fresh one-time
 * random value via the admin API, then immediately call
 * `signInWithPassword` with that value using a normal (anon-key) client to
 * obtain a real session + refresh token. The random password is discarded
 * right after. This keeps exactly one durable secret (the bcrypt PIN hash)
 * while still producing a standard Supabase session so RLS via `auth.uid()`
 * works identically for parents and children.
 *
 * Residual limitation: rotating the password on every login means a child
 * cannot have two concurrent "first login" races complete safely at the
 * exact same instant (the second rotation invalidates the first's password
 * before it signs in) — acceptable for this MVP's single-device usage
 * pattern; documented in the final report.
 */
export async function verifyChildLogin(params: { username: string; pin: string }) {
  const admin = createServiceClient();
  const { username, pin } = params;

  const { data: cred, error } = await admin
    .from("child_credentials")
    .select("id, profile_id, pin_hash, username")
    .ilike("username", username)
    .maybeSingle();

  if (error || !cred) {
    throw new Error("Invalid username or PIN");
  }

  const valid = await bcrypt.compare(pin, cred.pin_hash);
  if (!valid) {
    throw new Error("Invalid username or PIN");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("auth_user_id")
    .eq("id", cred.profile_id)
    .single();
  if (profileError || !profile) {
    throw new Error("Invalid username or PIN");
  }

  const oneTimePassword = generateRandomPassword();
  const { error: updateError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
    password: oneTimePassword,
  });
  if (updateError) {
    throw new Error("Could not start session");
  }

  return {
    email: childInternalEmail(cred.username),
    password: oneTimePassword,
  };
}
