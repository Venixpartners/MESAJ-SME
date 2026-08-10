import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanAndSortNumbers } from "@/lib/numbers";
import { createClient } from "@/lib/supabase/server";
import { PRICE_PER_SMS } from "@/lib/pricing";
import { getSegmentInfo } from "@/lib/smsSegments";
import { loadCarrierOverrides } from "@/lib/portedNumbers";
import { checkContentLength, checkRecipientCount, MAX_MESSAGE_SEGMENTS } from "@/lib/limits";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rateLimit";
import { isUniqueConstraintViolation } from "@/lib/prismaErrors";
import { checkHardFailRules } from "@/lib/campaignCompliance";
import { claimCampaignForSending, processNextCampaignBatch } from "@/lib/campaignSendProcessor";

/**
 * Builds the same response shape POST returns for a freshly created
 * campaign, from an already-existing row — used on both idempotency
 * paths below (early-exit lookup and the post-race refetch) so a client
 * retry gets a response indistinguishable from the original.
 */
function idempotentResponse(campaign: {
  recipientCount: number;
  invalidCount: number;
  validatedNumbersJson: string;
}) {
  return NextResponse.json(
    {
      campaign,
      validatedCounts: {
        totalValid: campaign.recipientCount,
        totalInvalid: campaign.invalidCount,
        validByCarrier: JSON.parse(campaign.validatedNumbersJson),
      },
      idempotent: true,
    },
    { status: 200 }
  );
}

/**
 * POST /api/campaigns/submit
 * Body: { senderId: string, message: string, numbers: string[] }
 * Optional header: Idempotency-Key: <client-generated string>
 *
 * Called after the client has seen the exclusion pop-up and clicked "Agree".
 * Re-validates numbers server-side (never trust client-reported counts),
 * checks wallet balance, deducts estimated cost, and creates the campaign.
 *
 * Compliance: the message is checked against the NCC hard-fail rules
 * (lib/campaignCompliance.ts) BEFORE any of that — a message that fails
 * is rejected with 422 and never becomes a campaign at all, nothing
 * charged, nothing created. A message that passes every hard-fail check
 * skips human review entirely: it's auto-approved and starts sending
 * immediately (see claimCampaignForSending in campaignSendProcessor.ts,
 * the same function the admin approve route uses). This is a genuine
 * change from the original all-campaigns-need-a-human model — see the
 * NCC guideline doc for what's and isn't automated, and why the
 * remaining judgment-call clauses ("unfair disparagement," "exaggerated
 * value," etc.) still aren't checked here and would still need a human
 * if/when that's built.
 *
 * Idempotency: the rate limiter below stops abuse, but not a legitimate
 * double-click or a client retrying after a dropped response — both send
 * a genuine second POST inside the rate limit window. If the client sends
 * an Idempotency-Key header (recommended: one generated per submit
 * attempt, e.g. regenerated each time the "Agree" button becomes
 * clickable), a repeat of that key returns the original campaign instead
 * of creating a second one and deducting the wallet twice. Enforced at
 * the database level via a unique (tenantId, idempotencyKey) constraint —
 * see prisma/migrations/..._campaign_idempotency_key — not just an
 * in-request check, so two concurrent requests with the same key can't
 * both slip through before either commits.
 */
export async function POST(req: NextRequest) {
  const sizeError = checkContentLength(req);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 413 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { authUserId: authUser.id } });
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: "No tenant associated with this user" }, { status: 400 });
  }

  const rawIdempotencyKey = req.headers.get("idempotency-key");
  const idempotencyKey = rawIdempotencyKey?.trim() ? rawIdempotencyKey.trim() : null;

  // Early-exit path: if this exact (tenant, key) pair already produced a
  // campaign, return it without touching the rate limiter, without
  // re-validating numbers, and without any wallet activity. This is the
  // common case for a retry — the request that already succeeded, not a
  // real race — so it's worth short-circuiting before any of the more
  // expensive work below. The DB-level unique constraint (checked again
  // inside the transaction further down) is what actually prevents a
  // double-charge if two requests with the same key land at the same time;
  // this check is just an optimization for the non-concurrent case.
  if (idempotencyKey) {
    const existing = await prisma.campaign.findFirst({
      where: { tenantId: user.tenantId, idempotencyKey },
    });
    if (existing) {
      return idempotentResponse(existing);
    }
  }

  const rl = await checkRateLimit(
    `campaign-submit:${user.tenantId}`,
    RATE_LIMITS.CAMPAIGN_SUBMIT.limit,
    RATE_LIMITS.CAMPAIGN_SUBMIT.windowMs
  );
  if (!rl.allowed) return rateLimitResponse(rl);

  const { senderId, message, numbers } = await req.json();

  if (!senderId || !message || !Array.isArray(numbers)) {
    return NextResponse.json({ error: "senderId, message, and numbers are required" }, { status: 400 });
  }

  // NCC hard-fail compliance check — cheapest possible place to reject:
  // before segment/number validation, before touching the wallet, before
  // creating any row at all. A message that fails here never becomes a
  // campaign, so there's nothing to clean up — the client just sees why
  // and can fix it and resubmit. See lib/campaignCompliance.ts for what's
  // actually checked and why only these specific rules are automated.
  const compliance = checkHardFailRules(message);
  if (!compliance.passed) {
    return NextResponse.json(
      {
        error: "Message doesn't meet NCC advertising requirements.",
        complianceFailures: compliance.failures,
      },
      { status: 422 }
    );
  }

  const segmentInfo = getSegmentInfo(message);
  if (segmentInfo.segments > MAX_MESSAGE_SEGMENTS) {
    return NextResponse.json(
      {
        error: `Message is too long: ${segmentInfo.segments} SMS segments (${segmentInfo.encoding} encoding). Max is ${MAX_MESSAGE_SEGMENTS} segments.`,
      },
      { status: 400 }
    );
  }

  const countError = checkRecipientCount(numbers);
  if (countError) {
    return NextResponse.json({ error: countError }, { status: 400 });
  }

  const overrides = await loadCarrierOverrides(numbers);
  const cleaned = cleanAndSortNumbers(numbers, overrides);

  if (cleaned.totalValid === 0) {
    return NextResponse.json({ error: "No valid numbers to send to" }, { status: 400 });
  }

  const estimatedCost = cleaned.totalValid * PRICE_PER_SMS;

  // Reserve funds atomically: the balance check and the decrement happen in
  // a single conditional UPDATE (walletBalance >= estimatedCost in the WHERE
  // clause), not as a separate read-then-write. This closes a race where two
  // concurrent submissions could both read a sufficient balance before
  // either had decremented it, letting the wallet go negative. If the
  // guarded update affects zero rows, the balance was insufficient (whether
  // from the start or because a concurrent request got there first) and we
  // roll back and return 402 — no campaign or wallet transaction is created.
  //
  // Unused reservation is refunded at approval time if fewer messages
  // actually send than recipientCount; a full refund happens on rejection.
  // See /api/admin/campaigns/approve and /reject.
  let campaign;
  try {
    campaign = await prisma.$transaction(async (tx) => {
      const senderIdRecord = await tx.senderId.findFirst({
        where: { id: senderId, tenantId: user.tenantId! },
      });
      if (!senderIdRecord) {
        throw new Error("SENDER_ID_NOT_FOUND");
      }

      const reserved = await tx.tenant.updateMany({
        where: { id: user.tenantId!, walletBalance: { gte: estimatedCost } },
        data: { walletBalance: { decrement: estimatedCost } },
      });
      if (reserved.count === 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const created = await tx.campaign.create({
        data: {
          tenantId: user.tenantId!,
          senderIdId: senderId,
          messageBody: message,
          recipientCount: cleaned.totalValid,
          invalidCount: cleaned.totalInvalid,
          validatedNumbersJson: JSON.stringify(cleaned.validByCarrier),
          status: "PENDING_APPROVAL",
          idempotencyKey,
        },
      });

      await tx.walletTransaction.create({
        data: {
          tenantId: user.tenantId!,
          type: "SPEND",
          amount: estimatedCost,
          units: -cleaned.totalValid,
        },
      });

      return created;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SENDER_ID_NOT_FOUND") {
      return NextResponse.json({ error: "Sender ID not found for this tenant" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 402 });
    }
    // A concurrent request with the same idempotency key won the race and
    // committed first — the whole transaction above (including this one's
    // wallet decrement) rolled back automatically, so nothing to undo.
    // Fetch the winner's campaign and hand back the same response a retry
    // would get from the early-exit check above.
    if (idempotencyKey && isUniqueConstraintViolation(err)) {
      const existing = await prisma.campaign.findFirst({
        where: { tenantId: user.tenantId, idempotencyKey },
      });
      if (existing) {
        return idempotentResponse(existing);
      }
    }
    throw err;
  }

  // Every rule in lib/campaignCompliance.ts already passed (checked
  // before the campaign was even created, above) — so the message
  // cleared every automated check there is right now, and doesn't need a
  // human in the loop. Auto-approve immediately, reusing the exact same
  // atomic-claim function the admin approve route uses (see
  // lib/campaignSendProcessor.ts claimCampaignForSending) so there's one
  // single code path for "a campaign becomes APPROVED and starts
  // sending," whether a human or the compliance check made that call.
  //
  // If this can't proceed for a structural reason unrelated to the
  // message itself (e.g. the Sender ID has no carrier actually approved
  // yet, so there's nothing eligible to send to) — deliberately don't
  // fail the whole request over that. The campaign stays PENDING_APPROVAL
  // exactly as it always did before this feature existed, and falls back
  // to the ordinary admin queue. The client already paid into escrow for
  // this campaign; a scary error for a problem that isn't about their
  // message text would be the wrong failure mode here.
  const autoApproval = await claimCampaignForSending({
    campaignId: campaign.id,
    reviewedByAdminId: null,
    auditActorId: null,
    auditNotesPrefix: "Auto-approved (passed NCC hard-fail checks)",
  });

  if (autoApproval.ok) {
    after(() => processNextCampaignBatch(campaign.id));
    return NextResponse.json(
      { campaign: { ...campaign, status: "APPROVED", autoApproved: true }, validatedCounts: cleaned, autoApproved: true },
      { status: 201 }
    );
  }

  return NextResponse.json({ campaign, validatedCounts: cleaned }, { status: 201 });
}
