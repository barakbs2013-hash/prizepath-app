import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/server/serviceClient";
import { updateRewardSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function PATCH(request: Request, { params }: { params: Promise<{ rewardId: string }> }) {
  try {
    await requireParent();
    const { rewardId } = await params;
    const body = updateRewardSchema.parse({ ...(await request.json()), rewardId });
    const supabase = await createClient();

    if (body.imageUrl !== undefined) {
      const { data: existing } = await supabase.from("rewards").select("image_url").eq("id", rewardId).single();
      if (existing?.image_url && existing.image_url !== body.imageUrl) {
        await deleteStorageObjectByUrl(existing.image_url);
      }
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.imageUrl !== undefined) update.image_url = body.imageUrl;
    if (body.pointsCost !== undefined) update.points_cost = body.pointsCost;
    if (body.quantityAvailable !== undefined) update.quantity_available = body.quantityAvailable;
    if (body.active !== undefined) update.active = body.active;

    const { data, error } = await supabase.from("rewards").update(update).eq("id", rewardId).select("*").single();
    if (error) throw new Error("Could not update reward");
    return NextResponse.json({ reward: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ rewardId: string }> }) {
  try {
    await requireParent();
    const { rewardId } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("rewards").update({ active: false }).eq("id", rewardId);
    if (error) throw new Error("Could not deactivate reward");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

async function deleteStorageObjectByUrl(url: string) {
  try {
    const marker = "/reward-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    const admin = createServiceClient();
    await admin.storage.from("reward-images").remove([path]);
  } catch {
    // best-effort cleanup only
  }
}
