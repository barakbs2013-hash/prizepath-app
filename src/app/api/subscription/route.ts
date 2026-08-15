import { NextResponse } from "next/server";
import { z } from "zod";
import { requireParent } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { getFamilyPlan, setFamilyPlan } from "@/lib/server/subscription";
import { handleApiError } from "@/lib/server/apiUtils";

const planSchema = z.object({ plan: z.enum(["free", "premium"]) });

export async function GET() {
  try {
    const parent = await requireParent();
    const familyId = await getFamilyForParent(parent.id);
    return NextResponse.json({ plan: await getFamilyPlan(familyId) });
  } catch (err) {
    return handleApiError(err);
  }
}

// Demo-only plan switch: real billing would set this from a provider webhook,
// never from a request the client can make. Parent-only, and the family is
// derived from the session rather than taken from the body.
export async function PATCH(request: Request) {
  try {
    const parent = await requireParent();
    const { plan } = planSchema.parse(await request.json());
    const familyId = await getFamilyForParent(parent.id);
    if (!familyId) throw new Error("No family found for this parent");

    await setFamilyPlan(familyId, plan);
    return NextResponse.json({ plan });
  } catch (err) {
    return handleApiError(err);
  }
}
