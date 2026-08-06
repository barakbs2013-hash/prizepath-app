import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/server/serviceClient";
import { createFamilyForParent } from "@/lib/server/family";
import { parentSignUpSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function POST(request: Request) {
  try {
    const body = parentSignUpSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? "Could not create account");
    }

    // Profile row is created with the service role so it exists even if the
    // client's session isn't fully established yet (e.g. email confirmation
    // required in the Supabase project settings).
    const admin = createServiceClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        auth_user_id: data.user.id,
        role: "parent",
        display_name: body.fullName,
        preferred_language: body.preferredLanguage,
      })
      .select("id")
      .single();

    if (profileError || !profile) {
      // Log the exact Postgres/PostgREST error server-side (message, code,
      // details, hint) so the real cause is diagnosable — the client still
      // only ever sees the generic "Could not create profile" message.
      console.error("[parent-signup] profile insert failed:", {
        authUserId: data.user.id,
        code: profileError?.code,
        message: profileError?.message,
        details: profileError?.details,
        hint: profileError?.hint,
      });
      throw new Error("Could not create profile");
    }

    const familyId = await createFamilyForParent({
      parentProfileId: profile.id,
      familyName: body.familyName?.trim() || `${body.fullName}'s family`,
    });

    return NextResponse.json({ profileId: profile.id, familyId, session: data.session });
  } catch (err) {
    return handleApiError(err);
  }
}
