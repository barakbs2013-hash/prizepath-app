import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET(request: Request) {
  try {
    const profile = await requireProfile();
    const { searchParams } = new URL(request.url);
    const childId = profile.role === "child" ? profile.id : searchParams.get("childId");
    if (!childId) throw new Error("childId is required");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("points_ledger")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Could not load ledger");
    return NextResponse.json({ ledger: data });
  } catch (err) {
    return handleApiError(err);
  }
}
