import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/server/currentProfile";

// Generic error responses — never leak raw provider/DB error internals to
// the client. The real error IS logged server-side (terminal running
// `npm run dev` / your hosting provider's logs) for debugging — it just
// never goes into the HTTP response body.
export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    console.error("[api] validation error:", err.issues);
    // Name the offending fields in `error` too — the client only surfaces
    // `error`, and a bare "Invalid input" gives the user nothing to act on.
    // Zod messages describe our own schema, so this leaks no internals.
    const summary = err.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return NextResponse.json(
      { error: summary ? `Invalid input — ${summary}` : "Invalid input", details: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof UnauthorizedError) {
    console.error("[api] unauthorized:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    console.error("[api] forbidden:", err.message);
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof Error) {
    // Known, intentionally-thrown application errors carry a safe message
    // to the client, but log the full error server-side for diagnosis.
    console.error("[api] error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error("[api] unknown error:", err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
