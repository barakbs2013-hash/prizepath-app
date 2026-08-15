import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireChild } from "@/lib/server/currentProfile";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/server/serviceClient";
import { TASK_PHOTO_BUCKET } from "@/lib/server/taskPhotos";
import { taskPhotoUploadSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

// Child attaches the proof photo for a task. Like the reward-image upload,
// the file is proxied through the server so MIME + size are checked before
// anything reaches the bucket — and here the task ownership is checked too.
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const child = await requireChild();
    const { taskId } = await params;

    const supabase = await createClient();
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_child_id, status")
      .eq("id", taskId)
      .single();
    if (taskError || !task) throw new Error("Task not found");
    if (task.assigned_child_id !== child.id) throw new Error("Not your task");
    // Once it's submitted, the photo the parent is reviewing must not change
    // under them.
    if (!["pending", "in_progress"].includes(task.status)) {
      throw new Error("This task can no longer be changed");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No photo provided");

    taskPhotoUploadSchema.parse({ mimeType: file.type, sizeBytes: file.size });

    const ext = EXT_BY_MIME[file.type];
    const path = `${taskId}/${randomUUID()}.${ext}`;
    const admin = createServiceClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(TASK_PHOTO_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("[tasks] photo upload failed:", uploadError);
      throw new Error("Could not upload the photo");
    }

    // A retake replaces the previous photo instead of piling up next to it,
    // so the folder holds exactly the photo the parent will be shown. Failing
    // to clean up is not worth failing the upload over — the newest object
    // still wins — so this is best-effort.
    const { data: existing } = await admin.storage.from(TASK_PHOTO_BUCKET).list(taskId, { limit: 100 });
    const stale = (existing ?? []).map((f) => `${taskId}/${f.name}`).filter((p) => p !== path);
    if (stale.length > 0) {
      const { error: removeError } = await admin.storage.from(TASK_PHOTO_BUCKET).remove(stale);
      if (removeError) console.error("[tasks] could not remove replaced photos:", removeError);
    }

    const { data: publicUrl } = admin.storage.from(TASK_PHOTO_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
