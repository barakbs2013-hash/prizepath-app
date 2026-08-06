import { NextResponse } from "next/server";
import { requireProfile, requireParent } from "@/lib/server/currentProfile";
import { getFamilyForParent } from "@/lib/server/family";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET(request: Request) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase.from("tasks").select("*").order("deadline", { ascending: true, nullsFirst: false });

    if (profile.role === "child") {
      query = query.eq("assigned_child_id", profile.id);
    } else {
      const familyId = await getFamilyForParent(profile.id);
      if (!familyId) return NextResponse.json({ tasks: [] });
      query = query.eq("family_id", familyId);
    }

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw new Error("Could not load tasks");
    return NextResponse.json({ tasks: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const parent = await requireParent();
    const familyId = await getFamilyForParent(parent.id);
    if (!familyId) throw new Error("No family found for this parent");

    const body = createTaskSchema.parse(await request.json());
    const supabase = await createClient();

    // RLS (tasks_parent_all) double-checks family ownership server-side too.
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        family_id: familyId,
        created_by_parent_id: parent.id,
        assigned_child_id: body.assignedChildId,
        title: body.title,
        description: body.description ?? null,
        instructions: body.instructions ?? null,
        deadline: body.deadline ?? null,
        urgency: body.urgency,
        importance: body.importance,
        points_value: body.pointsValue,
        requires_parent_approval: body.requiresParentApproval,
        requires_photo: body.requiresPhoto,
      })
      .select("*")
      .single();

    if (error) throw new Error("Could not create task");
    return NextResponse.json({ task: data });
  } catch (err) {
    return handleApiError(err);
  }
}
