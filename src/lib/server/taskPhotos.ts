import "server-only";
import { createServiceClient } from "@/lib/server/serviceClient";

export const TASK_PHOTO_BUCKET = "task-photos";

/**
 * The bucket itself is the record of a task's proof photo — every photo lives
 * under `task-photos/<taskId>/`, so "does this task have a photo?" is a
 * listing, not a column lookup. That keeps the feature working on a database
 * we can't run DDL against, and there is nothing to keep in sync: a photo
 * exists exactly when its object exists.
 *
 * Uploads clear the folder first, so a retake replaces rather than stacks and
 * this listing holds at most one object.
 */
export async function getTaskPhotoUrl(taskId: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(TASK_PHOTO_BUCKET)
    .list(taskId, { limit: 1, sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    console.error("[tasks] could not list photos for task:", taskId, error);
    return null;
  }
  const file = data?.[0];
  if (!file) return null;

  const { data: publicUrl } = admin.storage
    .from(TASK_PHOTO_BUCKET)
    .getPublicUrl(`${taskId}/${file.name}`);
  return publicUrl.publicUrl;
}

/** Same lookup for several tasks at once, for list screens. */
export async function getTaskPhotoUrls(taskIds: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    taskIds.map(async (id) => [id, await getTaskPhotoUrl(id)] as const)
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, string] => Boolean(e[1])));
}
