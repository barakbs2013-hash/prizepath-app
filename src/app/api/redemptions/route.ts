import { NextResponse } from "next/server";
import { requireProfile, requireChild } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/server/serviceClient";
import { redeemRewardSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";
import { notify } from "@/lib/server/notify";

export async function GET() {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    let query = supabase
      .from("reward_redemptions")
      .select("*, reward:rewards(name, image_url, family_id)")
      .order("requested_at", { ascending: false });

    if (profile.role === "child") {
      query = query.eq("child_id", profile.id);
    } else {
      const familyId = await getFamilyForParent(profile.id);
      if (!familyId) return NextResponse.json({ redemptions: [] });
      // RLS scopes this to redemptions on rewards owned by the parent's family.
    }

    const { data, error } = await query;
    if (error) throw new Error("Could not load redemptions");
    return NextResponse.json({ redemptions: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const child = await requireChild();
    const body = redeemRewardSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_child_id: child.id,
      p_reward_id: body.rewardId,
    });
    if (error) throw new Error(error.message || "Could not redeem reward");

    const admin = createServiceClient();
    const { data: reward } = await admin.from("rewards").select("name, created_by_parent_id").eq("id", body.rewardId).single();
    if (reward) {
      await notify({
        recipientProfileId: reward.created_by_parent_id,
        type: "redemption_requested",
        title: "Reward redemption requested",
        message: reward.name,
        relatedEntityType: "redemption",
        relatedEntityId: data as unknown as string,
      });
    }

    return NextResponse.json({ redemptionId: data });
  } catch (err) {
    return handleApiError(err);
  }
}
