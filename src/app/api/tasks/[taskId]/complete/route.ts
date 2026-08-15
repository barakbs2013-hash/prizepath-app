import { NextResponse } from "next/server";
import { requireChild } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/server/apiUtils";
import { notify } from "@/lib/server/notify";

// Child marks a task as done. Delegates entirely to the
// `submit_task_completion` SECURITY DEFINER function, which — in a single
// transaction — either moves the task to waiting_for_approval (when the
// parent requires approval) or completes it and awards points immediately
// (relying on the ledger's partial unique index to prevent double-awards).
export async function POST(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const child = await requireChild();
    const { taskId } = await params;
    const supabase = await createClient();

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("assigned_child_id, created_by_parent_id, title")
      .eq("id", taskId)
      .single();
    if (fetchError || !task) throw new Error("Task not found");
    if (task.assigned_child_id !== child.id) throw new Error("Not your task");

    const { data, error } = await supabase.rpc("submit_task_completion", { p_task_id: taskId }).single();
    if (error) {
      // The function raises a bare code for this one; turn it into something
      // a child can act on instead of surfacing raw Postgres text.
      if (error.message?.includes("photo_required")) {
        throw new Error("This task needs a photo before you can finish it.");
      }
      throw new Error(error.message || "Could not complete task");
    }

    const result = data as { status: string } | null;
    const awaitingApproval = result?.status === "waiting_for_approval";

    if (awaitingApproval) {
      await notify({
        recipientProfileId: task.created_by_parent_id,
        type: "task_awaiting_approval",
        title: "Task awaiting approval",
        message: task.title,
        relatedEntityType: "task",
        relatedEntityId: taskId,
      });
    }

    return NextResponse.json({ task: data, awaitingApproval });
  } catch (err) {
    return handleApiError(err);
  }
}
