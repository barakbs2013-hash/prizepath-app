import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createServiceClient } from "@/lib/server/serviceClient";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET(request: Request) {
  try {
    const profile = await requireProfile();
    const { searchParams } = new URL(request.url);
    const childId = profile.role === "child" ? profile.id : searchParams.get("childId");
    if (!childId) throw new Error("childId is required");

    // get_child_balance is a SECURITY DEFINER function that bypasses RLS, so
    // when a parent requests another profile's balance we must explicitly
    // verify that profile is a child within the parent's own family first.
    if (profile.role === "parent") {
      const familyId = await getFamilyForParent(profile.id);
      const admin = createServiceClient();
      const { data: membership } = await admin
        .from("family_members")
        .select("id")
        .eq("family_id", familyId ?? "")
        .eq("profile_id", childId)
        .eq("member_role", "child")
        .maybeSingle();
      if (!familyId || !membership) throw new Error("Child not found in your family");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_child_balance", { p_child_id: childId });
    if (error) throw new Error("Could not load balance");
    return NextResponse.json({ balance: data ?? 0 });
  } catch (err) {
    return handleApiError(err);
  }
}
