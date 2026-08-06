import { NextResponse } from "next/server";
import { requireProfile, requireParent } from "@/lib/server/currentProfile";
import { getFamilyForParent, getFamilyForChild } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { createRewardSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET() {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    const familyId =
      profile.role === "parent" ? await getFamilyForParent(profile.id) : await getFamilyForChild(profile.id);
    if (!familyId) return NextResponse.json({ rewards: [] });

    let query = supabase.from("rewards").select("*").eq("family_id", familyId).order("points_cost", { ascending: true });
    if (profile.role === "child") query = query.eq("active", true);

    const { data, error } = await query;
    if (error) throw new Error("Could not load rewards");
    return NextResponse.json({ rewards: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const parent = await requireParent();
    const familyId = await getFamilyForParent(parent.id);
    if (!familyId) throw new Error("No family found for this parent");
    const body = createRewardSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rewards")
      .insert({
        family_id: familyId,
        created_by_parent_id: parent.id,
        name: body.name,
        description: body.description ?? null,
        image_url: body.imageUrl ?? null,
        points_cost: body.pointsCost,
        quantity_available: body.quantityAvailable ?? null,
        active: body.active,
      })
      .select("*")
      .single();
    if (error) throw new Error("Could not create reward");
    return NextResponse.json({ reward: data });
  } catch (err) {
    return handleApiError(err);
  }
}
