import { describe, it, expect } from "vitest";
import { PRICE_PER_SMS, campaignCost, smsUnits } from "@/lib/pricing";

describe("PRICE_PER_SMS", () => {
  it("is a positive number", () => {
    expect(PRICE_PER_SMS).toBeGreaterThan(0);
  });

  it("is the single value used across submit/approve/reject/admin-send", () => {
    // This test exists mainly as a tripwire: if PRICE_PER_SMS ever changes,
    // anyone touching this file should notice and go verify wallet math
    // elsewhere (refunds, cost estimates) still makes sense — see the doc
    // comment in lib/pricing.ts for why this was pulled out of 4 files.
    expect(PRICE_PER_SMS).toBe(9);
  });
});

describe("campaignCost", () => {
  it("charges once per recipient for a single part message", () => {
    expect(campaignCost(1000, 1)).toBe(9000);
  });

  it("charges per part, so a two part message to the same list costs double", () => {
    expect(campaignCost(1000, 2)).toBe(18000);
    expect(campaignCost(1000, 3)).toBe(27000);
  });

  it("costs nothing when there is nobody to send to", () => {
    expect(campaignCost(0, 3)).toBe(0);
  });

  it("falls back to one part when the count is missing or nonsense, rather than producing NaN", () => {
    // Campaigns created before per-part billing have no stored part count.
    // They were charged once per recipient, which is what this returns.
    expect(campaignCost(100, undefined as unknown as number)).toBe(900);
    expect(campaignCost(100, 0)).toBe(900);
    expect(campaignCost(100, -5)).toBe(900);
    expect(campaignCost(100, NaN)).toBe(900);
  });

  it("keeps units and naira in step, so a refund can't disagree with the charge", () => {
    expect(smsUnits(250, 2)).toBe(500);
    expect(campaignCost(250, 2)).toBe(smsUnits(250, 2) * PRICE_PER_SMS);
  });
});
