import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireParent } from "@/lib/server/currentProfile";
import { createServiceClient } from "@/lib/server/serviceClient";
import { imageUploadSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Uploads are proxied through the server (using the service role) rather
// than direct-to-storage from the browser, so we can validate MIME + size
// server-side before anything touches the bucket.
export async function POST(request: Request) {
  try {
    await requireParent();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No file provided");

    imageUploadSchema.parse({ mimeType: file.type, sizeBytes: file.size });

    const ext = EXT_BY_MIME[file.type];
    const path = `${randomUUID()}.${ext}`;
    const admin = createServiceClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("reward-images")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error("Could not upload image");

    const { data } = admin.storage.from("reward-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    return handleApiError(err);
  }
}
