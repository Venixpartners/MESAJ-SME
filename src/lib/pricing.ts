/**
 * Single source of truth for SMS pricing.
 *
 * Why this exists: PRICE_PER_SMS was previously hardcoded and duplicated
 * across submit/approve/reject/send routes. A price change meant hunting
 * down every copy — miss one and estimated costs, actual charges, and
 * refunds would silently drift out of sync. Import PRICE_PER_SMS from
 * here everywhere cost is calculated or refunded.
 */

export const PRICE_PER_SMS = 9;

/**
 * What a campaign costs, in naira.
 *
 * A message longer than one part is sent as several SMS units, and the
 * carrier charges us for each one, so the client is charged for each one
 * too: 2 parts to 1,000 people is 2,000 units. Anything that reserves,
 * charges or refunds money must go through here, so a refund can never
 * disagree with the charge it is reversing.
 */
export function campaignCost(recipientCount: number, segmentCount: number): number {
  return smsUnits(recipientCount, segmentCount) * PRICE_PER_SMS;
}

/**
 * Billable SMS units: one per part, per recipient.
 *
 * A missing or nonsensical part count falls back to 1 rather than
 * poisoning the arithmetic with NaN. That is also the honest answer for
 * any campaign created before per-part billing existed: those were
 * charged once per recipient, which is exactly what one part costs.
 */
export function smsUnits(recipientCount: number, segmentCount: number): number {
  const parts = Number.isFinite(segmentCount) && segmentCount >= 1 ? Math.floor(segmentCount) : 1;
  return recipientCount * parts;
}
