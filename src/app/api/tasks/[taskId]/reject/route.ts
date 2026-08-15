import { NextResponse } from "next/server";
import { requireParent } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";
import { rejectTaskSchema } from "@/lib/validation/schemas";
import { notify } from "@/lib/server/notify";

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const parent = await requireParent();
    const { taskId } = await params;

    // The body is optional — sending a task back without a note is still a
    // single tap — so an absent or unparsable body means "no reason given".
    const body = await request.json().catch(() => ({}));
    const { reason } = rejectTaskSchema.parse(body ?? {});

    const supabase = await createClient();
    const { error } = await supabase.rpc("reject_task_completion", {
      p_task_id: taskId,
      p_approving_parent_id: parent.id,
    });
    if (error) throw new Error(error.message || "Could not send task back");
    const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();

    if (task) {
      // The reason rides on the notification: it is the child-visible record
      // of this rejection, and the task screen reads the newest one back.
      await notify({
        recipientProfileId: task.assigned_child_id,
        type: "task_sent_back",
        title: "Task sent back",
        message: reason ? `${task.title} — ${reason}` : task.title,
        relatedEntityType: "task",
        relatedEntityId: taskId,
      });
    }

    return NextResponse.json({ task, reason: reason ?? null });
  } catch (err) {
    return handleApiError(err);
  }
}
