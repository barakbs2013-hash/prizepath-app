import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyChildLogin } from "@/lib/server/childAuth";
import { childSignInSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function POST(request: Request) {
  try {
    const body = childSignInSchema.parse(await request.json());
    const { email, password } = await verifyChildLogin(body);

    // Forward the freshly-rotated one-time credential straight into a real
    // Supabase sign-in so normal session cookies get set on the response.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new Error("Invalid username or PIN");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
