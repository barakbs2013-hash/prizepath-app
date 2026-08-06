import "server-only";
import { createServiceClient } from "@/lib/server/serviceClient";

/**
 * Creates a notification row. Uses the service role because `notifications`
 * intentionally has no client-facing insert policy — all notifications are
 * produced by trusted server-side code paths, never directly by a client.
 */
export async function notify(params: {
  recipientProfileId: string;
  type: string;
  title: string;
  message?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) {
  try {
    const admin = createServiceClient();
    await admin.from("notifications").insert({
      recipient_profile_id: params.recipientProfileId,
      type: params.type,
      title: params.title,
      message: params.message ?? null,
      related_entity_type: params.relatedEntityType ?? null,
      related_entity_id: params.relatedEntityId ?? null,
    });
  } catch {
    // Notifications are best-effort; never fail the calling action over this.
  }
}
