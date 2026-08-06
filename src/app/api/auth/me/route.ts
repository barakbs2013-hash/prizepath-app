import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const body = updateProfileSchema.parse(await request.json());
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(body.displayName ? { display_name: body.displayName } : {}),
        ...(body.preferredLanguage ? { preferred_language: body.preferredLanguage } : {}),
        ...(body.avatarUrl !== undefined ? { avatar_url: body.avatarUrl } : {}),
      })
      .eq("id", profile.id);
    if (error) throw new Error("Could not update profile");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
