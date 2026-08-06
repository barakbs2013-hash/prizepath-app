import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function PATCH(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const profile = await requireProfile();
    const { notificationId } = await params;
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_profile_id", profile.id);
    if (error) throw new Error("Could not update notification");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
