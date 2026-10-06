import { describe, it, expect } from "vitest";
import { checkHardFailRules, checkContentSafety } from "./campaignCompliance";

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

describe("checkHardFailRules — rule 11: threats", () => {
  it.each([
    "i want to kill you",
    "I WILL KILL YOU",
    "we go shoot u if you no pay",
    "They will kidnap your children",
    "You are going to die",
    "You're a dead man",
    "Your days are numbered",
    "Watch your back",
    "I will find you",
    "We will burn your shop down",
    "I'll stab him tonight",
    "You're dead.",
    "I'll find you",
    "We go burn you",
  ])("blocks %s", (message) => {
    const result = checkHardFailRules(message);
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain(11);
  });

  it.each([
    "Kill your hunger with our new jollof combo, valid until 30 Oct.",
    "We shoot your wedding in 4K. Call 08031234567.",
    "Killer prices on all phones this weekend only, till Sunday.",
    "Your order has shipped and arrives Thursday.",
    "Hi Amaka, your appointment is at 10am. Do not miss it.",
    "Pest control: we kill rats and cockroaches for good.",
  ])("does not block ordinary business message: %s", (message) => {
    const result = checkHardFailRules(message);
    expect(result.failures.map((f) => f.rule)).not.toContain(11);
  });
});

describe("checkContentSafety", () => {
  it("blocks threats, profanity and slurs", () => {
    expect(checkContentSafety("i want to kill you").passed).toBe(false);
    expect(checkContentSafety("This shit is on sale now").passed).toBe(false);
  });

  it("does not apply the promo date rules (admin paths skip those)", () => {
    expect(checkContentSafety("Get 50% discount on all shoes").passed).toBe(true);
  });
});

describe("checkHardFailRules — rules 12 to 15: categories networks refuse", () => {
  it.each([
    ["Dear customer, update your BVN now to avoid restriction", 12],
    ["Kindly send us your OTP to complete the upgrade", 12],
    ["Share your PIN with our agent to unlock your account", 12],
    ["Your account has been blocked. Call 08031234567", 12],
    ["Your ATM card will be deactivated today", 12],
    ["Click the link to verify your details: bit.ly/x", 12],
    ["Hot sugar mummy available, call now", 13],
    ["Free porn videos here", 13],
    ["Send nudes", 13],
    ["Pay me or else you will regret it", 14],
    ["You are a thief and everyone will know", 14],
    ["I will expose you tomorrow", 14],
    ["Join our forex signals group", 15],
    ["Double your money in 7 days", 15],
    ["Guaranteed returns of 30% weekly returns", 15],
    ["Get free bitcoin now", 15],
    ["Invest today, ponzi proof plan", 15],
  ])("blocks %s (rule %i)", (message, rule) => {
    const result = checkHardFailRules(message);
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain(rule);
  });

  it.each([
    "Never share your PIN or OTP with anyone, including our staff.",
    "Do not share your password with anyone.",
    "We will never ask you to send your BVN.",
    "Your order is ready for pickup today until 6pm.",
    "Beware of fraudsters using our name. We never call for your PIN.",
    "Reminder: your appointment with Dr Bello is tomorrow at 10am.",
  ])("lets an ordinary or safety message through the hard rules: %s", (message) => {
    const rules = checkHardFailRules(message).failures.map((f) => f.rule);
    for (const r of [12, 13, 14, 15]) expect(rules).not.toContain(r);
  });

  it("also applies on admin paths through checkContentSafety", () => {
    expect(checkContentSafety("Update your BVN now").passed).toBe(false);
    expect(checkContentSafety("Double your money").passed).toBe(false);
  });
});
