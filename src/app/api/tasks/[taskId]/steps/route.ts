import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { createTaskStepSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function GET(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await requireProfile();
    const { taskId } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("task_steps")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    if (error) throw new Error("Could not load steps");
    return NextResponse.json({ steps: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await requireProfile();
    const { taskId } = await params;
    const body = createTaskStepSchema.parse({ ...(await request.json()), taskId });
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("task_steps")
      .insert({ task_id: taskId, text: body.text, position: body.position, source: body.source })
      .select("*")
      .single();
    if (error) throw new Error("Could not add step");
    return NextResponse.json({ step: data });
  } catch (err) {
    return handleApiError(err);
  }
}
