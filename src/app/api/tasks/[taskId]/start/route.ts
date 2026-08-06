import { NextResponse } from "next/server";
import { requireChild } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";

export async function POST(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const child = await requireChild();
    const { taskId } = await params;
    const supabase = await createClient();

    const { data: task, error: fetchError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
    if (fetchError || !task) throw new Error("Task not found");
    if (task.assigned_child_id !== child.id) throw new Error("Not your task");
    if (task.status !== "pending") throw new Error("Task cannot be started from its current status");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId)
      .select("*")
      .single();
    if (error) throw new Error("Could not start task");
    return NextResponse.json({ task: data });
  } catch (err) {
    return handleApiError(err);
  }
}
