import { describe, it, expect } from "vitest";
import { checkHardFailRules } from "./campaignCompliance";

describe("checkHardFailRules — clean messages", () => {
  it("passes an ordinary, non-promotional message", () => {
    const result = checkHardFailRules("Hi Femi, your order #4521 has shipped and will arrive Thursday.");
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("passes a promo that states both a date and doesn't trip any other rule", () => {
    const result = checkHardFailRules("Get 20% off all items! Offer valid until 20 Aug.");
    expect(result.passed).toBe(true);
  });

  it("passes a threshold promo that states the number", () => {
    const result = checkHardFailRules("First 500 customers get a free gift, till 15 Sept.");
    expect(result.passed).toBe(true);
  });

  it("passes a message mentioning T&Cs alongside a link", () => {
    const result = checkHardFailRules("Thanks for shopping with us! T&Cs apply, see venix.ng/terms");
    expect(result.passed).toBe(true);
  });

  it("passes 'first come first served' with no promo trigger words and no number needed", () => {
    const result = checkHardFailRules("Walk-in appointments are first come first served.");
    expect(result.passed).toBe(true);
  });
});

describe("checkHardFailRules — rule 1: profanity", () => {
  it("flags a profane word", () => {
    const result = checkHardFailRules("This shit is on sale now!");
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain(1);
  });

  it("does not false-positive on innocent words containing a substring match risk", () => {
    // Classic "Scunthorpe problem" check — word-boundary matching should
    // prevent this from ever tripping rule 1.
    const result = checkHardFailRules("Our Scunthorpe branch is now open, come classify your needs.");
    expect(result.passed).toBe(true);
  });
});

describe("checkHardFailRules — rule 2: prejudicial content", () => {
  it("flags an overt slur", () => {
    const result = checkHardFailRules("No chink jokes in our messaging, please.");
    expect(result.failures.map((f) => f.rule)).toContain(2);
  });
});

describe("checkHardFailRules — rule 5: promo needs a date", () => {
  it("flags a promo trigger word with no date anywhere", () => {
    const result = checkHardFailRules("Win a free trip to Dubai! Just reply YES.");
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain(5);
  });

  it("does not flag a plain message with no promo language at all", () => {
    const result = checkHardFailRules("Reminder: your appointment is tomorrow at 10am.");
    expect(result.failures.map((f) => f.rule)).not.toContain(5);
  });

  it("accepts a numeric date pattern as satisfying the date requirement", () => {
    const result = checkHardFailRules("Get a discount on all shoes, promo ends 20/08/2026.");
    expect(result.failures.map((f) => f.rule)).not.toContain(5);
  });
});

describe("checkHardFailRules — rule 7: threshold must be numeric", () => {
  it("flags 'first' with no number", () => {
    const result = checkHardFailRules("First customers to visit today get a free sample!");
    expect(result.failures.map((f) => f.rule)).toContain(7);
  });

  it("flags 'while stocks last' with no number anywhere", () => {
    const result = checkHardFailRules("Grab yours while stocks last!");
    expect(result.failures.map((f) => f.rule)).toContain(7);
  });

  it("does not flag when a number is present alongside 'first'", () => {
    const result = checkHardFailRules("First 100 customers get a discount.");
    expect(result.failures.map((f) => f.rule)).not.toContain(7);
  });
});

describe("checkHardFailRules — rule 10: T&Cs needs a reference", () => {
  it("flags 'T&Cs apply' with no link anywhere in the message", () => {
    const result = checkHardFailRules("Buy one get one free this weekend. T&Cs apply.");
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain(10);
  });

  it("flags 'terms and conditions apply' phrasing too, not just the T&Cs abbreviation", () => {
    const result = checkHardFailRules("Special weekend rate. Terms and conditions apply.");
    expect(result.failures.map((f) => f.rule)).toContain(10);
  });

  it("does not flag when a message never mentions terms at all", () => {
    const result = checkHardFailRules("Thanks for shopping with us!");
    expect(result.failures.map((f) => f.rule)).not.toContain(10);
  });
});

describe("checkHardFailRules — multiple failures collected in one pass", () => {
  it("returns every rule that fails, not just the first", () => {
    const result = checkHardFailRules("Win free shit! First customers only, T&Cs apply.");
    const rules = result.failures.map((f) => f.rule).sort((a, b) => a - b);
    expect(rules).toEqual([1, 5, 7, 10]);
  });
});
