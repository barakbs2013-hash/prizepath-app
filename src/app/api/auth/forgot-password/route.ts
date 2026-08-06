import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function POST(request: Request) {
  try {
    const body = forgotPasswordSchema.parse(await request.json());
    const supabase = await createClient();
    // Always respond success regardless of whether the email exists, to
    // avoid leaking account existence.
    await supabase.auth.resetPasswordForEmail(body.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
