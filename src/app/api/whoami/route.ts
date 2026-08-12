import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/whoami
 * Returns the current session's role (CLIENT/ADMIN) and whether onboarding
 * (Tenant creation) is complete. Used right after login to decide whether
 * to route to /admin or /dashboard (or /onboarding for a first-time client).
 *
 * Explicitly forced dynamic: this reads the caller's session cookie on
 * every request, so a cached response here means one person's answer
 * (e.g. a logged-out 401) can get served back to a different, genuinely
 * logged-in person — exactly the "role: null, onboarded: false for a
 * real, onboarded account" bug this fixes. Next.js usually infers
 * dynamic rendering from cookie access automatically, but this route has
 * bitten that inference before, so it's explicit rather than assumed.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ role: null, onboarded: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { authUserId: authUser.id } });

  return NextResponse.json({
    role: user?.role ?? null,
    onboarded: Boolean(user?.tenantId),
  });
}
