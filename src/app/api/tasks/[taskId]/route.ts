import { NextResponse } from "next/server";
import { requireProfile, requireParent } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { updateTaskSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await requireProfile();
    const { taskId } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).single();
    if (error || !data) throw new Error("Task not found");
    return NextResponse.json({ task: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await requireParent();
    const { taskId } = await params;
    const body = updateTaskSchema.parse({ ...(await request.json()), taskId });
    const supabase = await createClient();

    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.instructions !== undefined) update.instructions = body.instructions;
    if (body.deadline !== undefined) update.deadline = body.deadline;
    if (body.urgency !== undefined) update.urgency = body.urgency;
    if (body.importance !== undefined) update.importance = body.importance;
    if (body.pointsValue !== undefined) update.points_value = body.pointsValue;
    if (body.requiresParentApproval !== undefined) update.requires_parent_approval = body.requiresParentApproval;
    if (body.requiresPhoto !== undefined) update.requires_photo = body.requiresPhoto;
    if (body.assignedChildId !== undefined) update.assigned_child_id = body.assignedChildId;
    if (body.status !== undefined) update.status = body.status;

    const { data, error } = await supabase
      .from("tasks")
      .update(update)
      .eq("id", taskId)
      .select("*")
      .single();
    if (error) throw new Error("Could not update task");
    return NextResponse.json({ task: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await requireParent();
    const { taskId } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("tasks").update({ status: "cancelled" }).eq("id", taskId);
    if (error) throw new Error("Could not cancel task");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
