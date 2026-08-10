import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminAuth";

/**
 * TEMPORARY — delete this file once Sentry is confirmed working.
 *
 * Admin-only, deliberately throws an unhandled error so we can confirm
 * it actually reaches Sentry's Issues tab in production, rather than
 * just assuming the env vars/config are wired correctly. Not caught
 * here on purpose — Next.js's instrumentation.ts onRequestError hook
 * (which calls Sentry.captureRequestError) is what should pick this up,
 * same as it would for a genuine bug elsewhere in the app.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  throw new Error("Deliberate test error — confirming Sentry is wired up correctly. Safe to ignore/resolve in Sentry once seen.");
}

export function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
