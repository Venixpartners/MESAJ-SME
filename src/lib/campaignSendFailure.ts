/**
 * Recovery path for when sendCampaignAcrossCarriers() throws outright —
 * as opposed to a batch coming back with some/all recipients failed, which
 * is a normal SendBatchResult and already handled inline in both send
 * routes (PARTIAL/FAILED status + partial refund).
 *
 * A throw here (missing/expired MESAJ_API_TOKEN today; any other
 * synchronous failure before per-chunk retry logic runs, in the future)
 * happens AFTER funds were already reserved via the guarded wallet
 * decrement, and in the approve-flow AFTER the campaign was already
 * atomically claimed as APPROVED. Without this, the campaign is stuck in
 * APPROVED forever, the tenant's wallet stays short for messages that were
 * never sent, and nothing surfaces it besides a client support ticket.
 *
 * Since the send call threw before any batch result came back, we know
 * zero messages went out — so this always refunds the FULL reserved
 * amount (see campaignCost in lib/pricing.ts), not a partial one. Shared by
 * both send paths (client-approval and admin-initiated) so they recover
 * identically.
 */

import * as Sentry from "@sentry/nextjs";
import { prisma } from "./prisma";
import { campaignCost, smsUnits } from "./pricing";

export async function handleCampaignSendFailure(params: {
  campaignId: string;
  tenantId: string;
  recipientCount: number;
  /** Parts per message, so the refund matches what was actually charged. */
  segmentCount: number;
  error: unknown;
}): Promise<void> {
  const { campaignId, tenantId, recipientCount, segmentCount, error } = params;
  const fullRefund = campaignCost(recipientCount, segmentCount);

  // Best-effort visibility first — if the DB writes below also fail, we
  // still want this on record rather than losing it entirely.
  Sentry.captureException(error, {
    level: "error",
    tags: { area: "campaign-send-failure" },
    extra: { campaignId, tenantId, recipientCount, fullRefund },
  });

  await prisma.$transaction([
    prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "FAILED" },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: { walletBalance: { increment: fullRefund } },
    }),
    prisma.walletTransaction.create({
      data: {
        tenantId,
        type: "REFUND",
        amount: fullRefund,
        units: smsUnits(recipientCount, segmentCount),
      },
    }),
  ]);
}
