import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createServiceClient } from "@/lib/server/serviceClient";
import { z } from "zod";
import { handleApiError } from "@/lib/server/apiUtils";

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

async function assertChildInParentFamily(parentId: string, childId: string) {
  const familyId = await getFamilyForParent(parentId);
  if (!familyId) throw new Error("No family found");
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("profile_id", childId)
    .eq("member_role", "child")
    .maybeSingle();
  if (error || !data) throw new Error("Child not found in your family");
  return familyId;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  try {
    const parent = await requireParent();
    const { childId } = await params;
    await assertChildInParentFamily(parent.id, childId);
    const body = patchSchema.parse(await request.json());

    const admin = createServiceClient();
    const { error } = await admin
      .from("profiles")
      .update({
        ...(body.displayName ? { display_name: body.displayName } : {}),
        ...(body.isActive !== undefined ? { is_active: body.isActive } : {}),
      })
      .eq("id", childId);
    if (error) throw new Error("Could not update child profile");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
