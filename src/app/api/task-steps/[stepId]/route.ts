import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { updateTaskStepSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function PATCH(request: Request, { params }: { params: Promise<{ stepId: string }> }) {
  try {
    await requireProfile();
    const { stepId } = await params;
    const body = updateTaskStepSchema.parse({ ...(await request.json()), stepId });
    const supabase = await createClient();
    const update: Record<string, unknown> = {};
    if (body.completed !== undefined) update.completed = body.completed;
    if (body.text !== undefined) update.text = body.text;
    if (body.position !== undefined) update.position = body.position;
    const { data, error } = await supabase.from("task_steps").update(update).eq("id", stepId).select("*").single();
    if (error) throw new Error("Could not update step");
    return NextResponse.json({ step: data });
  } catch (err) {
    return handleApiError(err);
  }
}
