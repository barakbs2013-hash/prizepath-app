import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";
import { notify } from "@/lib/server/notify";

export async function POST(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const parent = await requireParent();
    const { taskId } = await params;
    const supabase = await createClient();
    const { error } = await supabase.rpc("approve_task_and_award_points", {
      p_task_id: taskId,
      p_approving_parent_id: parent.id,
    });
    if (error) throw new Error(error.message || "Could not approve task");
    const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();

    if (task) {
      await notify({
        recipientProfileId: task.assigned_child_id,
        type: "task_approved",
        title: "Task approved",
        message: task.title,
        relatedEntityType: "task",
        relatedEntityId: taskId,
      });
    }

    return NextResponse.json({ task });
  } catch (err) {
    return handleApiError(err);
  }
}
