import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";
import { notify } from "@/lib/server/notify";

export async function POST(_request: Request, { params }: { params: Promise<{ redemptionId: string }> }) {
  try {
    const parent = await requireParent();
    const { redemptionId } = await params;
    const supabase = await createClient();
    const { error } = await supabase.rpc("reject_redemption", {
      p_redemption_id: redemptionId,
      p_approving_parent_id: parent.id,
    });
    if (error) throw new Error(error.message || "Could not reject redemption");
    const { data: redemption } = await supabase
      .from("reward_redemptions")
      .select("*, reward:rewards(name)")
      .eq("id", redemptionId)
      .single();

    if (redemption) {
      await notify({
        recipientProfileId: redemption.child_id,
        type: "redemption_rejected",
        title: "Redemption rejected",
        message: redemption.reward?.name,
        relatedEntityType: "redemption",
        relatedEntityId: redemptionId,
      });
    }

    return NextResponse.json({ redemption });
  } catch (err) {
    return handleApiError(err);
  }
}
