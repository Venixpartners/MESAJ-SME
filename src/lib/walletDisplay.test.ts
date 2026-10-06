import { describe, it, expect } from "vitest";
import { formatSignedNaira, isDebit } from "./walletDisplay";

describe("wallet transaction display", () => {
  it("shows a SPEND (stored positive) as a debit", () => {
    expect(formatSignedNaira({ type: "SPEND", amount: 18 })).toBe("-₦18");
  });
  it("shows a negative manual adjustment as a debit", () => {
    expect(isDebit({ type: "MANUAL_ADJUST", amount: -100 })).toBe(true);
    expect(formatSignedNaira({ type: "MANUAL_ADJUST", amount: -100 })).toBe("-₦100");
  });
  it("shows top ups, refunds and manual credits as credits", () => {
    expect(formatSignedNaira({ type: "TOPUP", amount: 2000 })).toBe("+₦2,000");
    expect(formatSignedNaira({ type: "REFUND", amount: 9 })).toBe("+₦9");
    expect(formatSignedNaira({ type: "MANUAL_ADJUST", amount: 50 })).toBe("+₦50");
  });
});
