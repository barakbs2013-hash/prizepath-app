import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parentSignInSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/server/apiUtils";

export async function POST(request: Request) {
  try {
    const body = parentSignInSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.session) {
      throw new Error("Invalid email or password");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
