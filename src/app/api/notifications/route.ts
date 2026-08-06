import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET() {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load notifications");
    return NextResponse.json({ notifications: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH() {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_profile_id", profile.id)
      .is("read_at", null);
    if (error) throw new Error("Could not update notifications");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
