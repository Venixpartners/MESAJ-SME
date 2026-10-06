/**
 * Grey area words: not banned outright, but the kind Nigerian gateways and
 * networks watch for under the NCC Consumer Code of Practice. A client
 * campaign containing any of these is NOT auto approved. It waits in the
 * admin approval queue for a person to read it in context, approve it, or
 * reject it (a rejection refunds the client in full).
 *
 * The clear cut forms of these categories are hard blocks in
 * lib/campaignCompliance.ts (rules 11 to 15). This list is the softer
 * layer: "promo ends Friday" and "claim your prize" share a word, but only
 * a person can tell an honest promotion from a scam.
 *
 * To stop holding a word, delete it from its list below.
 */

export interface ReviewFlag {
  category: string;
  term: string;
}

const REVIEW_TERMS: Record<string, string[]> = {
  "Banking or security words": [
    "bvn",
    "nin",
    "otp",
    "pin",
    "password",
    "token",
    "cbn",
    "central bank",
    "atm card",
    "blocked",
    "deactivated",
    "reactivate",
    "update your account",
  ],
  "Prize or urgency wording": [
    "winner",
    "you won",
    "you have won",
    "claim your prize",
    "claim prize",
    "cash prize",
    "congratulations",
    "promo",
    "click the link",
    "click this link",
    "click link",
    "urgent",
  ],
  "Violence or unrest": [
    "kill",
    "murder",
    "weapon",
    "weapons",
    "gun",
    "guns",
    "bomb",
    "protest",
    "riot",
    "cult",
    "cultism",
    "strike",
    "attack",
    "fake news",
  ],
  "Adult content": ["sex", "escort", "escorts", "adult"],
  "Accusation": ["thief", "fraudster", "fraudsters", "cheat", "scammer", "scammers"],
  "Investment or crypto": ["bitcoin", "crypto", "forex", "high yield", "roi"],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const COMPILED = Object.entries(REVIEW_TERMS).flatMap(([category, terms]) =>
  terms.map((term) => ({
    category,
    term,
    pattern: new RegExp(`\\b${escapeRegExp(term).replace(/ /g, "\\s+")}\\b`, "i"),
  }))
);

/**
 * Every grey area term found in the message, one entry per term. An empty
 * array means the message can be auto approved as far as this layer is
 * concerned.
 */
export function checkReviewFlags(message: string): ReviewFlag[] {
  return COMPILED.filter((c) => c.pattern.test(message)).map(({ category, term }) => ({ category, term }));
}

/** Short human readable summary, e.g. `"promo", "winner"`. */
export function describeReviewFlags(flags: ReviewFlag[]): string {
  return flags.map((f) => `"${f.term}"`).join(", ");
}
