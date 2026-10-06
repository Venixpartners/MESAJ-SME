import { describe, it, expect } from "vitest";
import { checkReviewFlags, describeReviewFlags } from "./reviewFlags";

describe("checkReviewFlags", () => {
  it.each([
    ["Promo ends Friday, 20% off", "promo"],
    ["Congratulations on your graduation!", "congratulations"],
    ["You have won a cash prize", "you have won"],
    ["Our staff strike ends Monday", "strike"],
    ["Join the protest at noon", "protest"],
    ["Learn crypto trading this weekend", "crypto"],
    ["Beware of fraudsters", "fraudsters"],
    ["Click the link below for details", "click the link"],
  ])("holds %s for review (term %s)", (message, term) => {
    expect(checkReviewFlags(message).map((f) => f.term)).toContain(term);
  });

  it.each([
    "Your order is ready for pickup today until 6pm. Ask for Tunde.",
    "Second term fees are due on 14 March. Log in to the parent portal.",
    "Reminder: your appointment is tomorrow at 10am.",
    "Fresh bread every morning at our Surulere branch.",
  ])("does not hold an ordinary message: %s", (message) => {
    expect(checkReviewFlags(message)).toEqual([]);
  });

  it("matches whole words only", () => {
    // "pinch" contains "pin", "strikes" is not "strike" as a word
    expect(checkReviewFlags("A pinch of salt")).toEqual([]);
  });

  it("describes flags for a client facing message", () => {
    expect(describeReviewFlags(checkReviewFlags("Promo winner"))).toBe('"winner", "promo"');
  });
});
