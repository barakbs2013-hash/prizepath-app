import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createChildLogin } from "@/lib/server/childAuth";
import { createChildSchema } from "@/lib/validation/schemas";
import { createServiceClient } from "@/lib/server/serviceClient";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET() {
  try {
    const parent = await requireParent();
    const familyId = await getFamilyForParent(parent.id);
    if (!familyId) return NextResponse.json({ children: [] });

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("family_members")
      .select("profile:profiles!family_members_profile_id_fkey(id, display_name, avatar_url, preferred_language, is_active)")
      .eq("family_id", familyId)
      .eq("member_role", "child");
    if (error) throw new Error("Could not load children");

    const children = (data ?? []).map((row: any) => row.profile).filter(Boolean);
    return NextResponse.json({ children });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const parent = await requireParent();
    const familyId = await getFamilyForParent(parent.id);
    if (!familyId) throw new Error("No family found for this parent");

    const body = createChildSchema.parse(await request.json());
    const result = await createChildLogin({
      familyId,
      displayName: body.displayName,
      username: body.username,
      pin: body.pin,
    });

    // Return the plaintext PIN + username exactly once so the parent can
    // write it down / share it with their child — it is never retrievable
    // again (only the bcrypt hash is stored).
    return NextResponse.json({
      profileId: result.profileId,
      username: result.username,
      pin: body.pin,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
