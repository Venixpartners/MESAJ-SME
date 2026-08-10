/**
 * NCC hard-fail message checks — the mechanical, rule-checkable subset of
 * the NCC Advertisement/Promotion Guidelines that a single SMS body can
 * actually be validated against (rules 1, 2, 5, 7, 10 of the internal
 * NCC guideline doc). A message that fails any of these is rejected
 * outright at submit time — never created as a campaign, never charged
 * against the wallet, never seen by an admin — the client gets the
 * reason immediately and can fix and resubmit.
 *
 * Deliberately NOT covered here (soft-flag territory — "unfair
 * disparagement," "exaggerated value," "misrepresenting stock," and
 * similar judgment calls): those still require a human, and are simply
 * not automated yet. A message that clears every check in this file is
 * NOT guaranteed NCC-compliant in every respect — it's cleared of the
 * specific mechanical checks below, which is what makes it safe to
 * auto-approve without a person looking at it. See
 * lib/campaignSendProcessor.ts claimCampaignForSending() for what
 * "auto-approve" actually does downstream.
 *
 * Each rule is its own small function, deliberately, so a compliance
 * failure can name exactly which NCC clause fired — useful both for the
 * client-facing error message and for any later audit of what's being
 * rejected and why.
 */

export interface ComplianceFailure {
  rule: number;
  ruleName: string;
  reason: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  failures: ComplianceFailure[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordBoundaryPattern(words: string[]): RegExp {
  return new RegExp(`\\b(${words.map(escapeRegExp).join("|")})\\b`, "i");
}

// === Rule 1 (Part 3(c)) — obscenity/profanity, content unsuitable for children ===
// Intentionally a modest, clearly-extensible list rather than an attempt
// at exhaustive coverage — profanity filtering is inherently a losing
// arms race against creative spelling, and a short high-precision list
// that's easy to review and extend beats a huge one nobody maintains.
// Word-boundary matched to avoid flagging innocent words that merely
// contain a banned substring (the classic "Scunthorpe problem").
const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt",
  "whore", "slut", "nigga", "nigger", "faggot", "retard",
];
const PROFANITY_PATTERN = wordBoundaryPattern(PROFANITY_WORDS);

function checkProfanity(message: string): ComplianceFailure | null {
  if (PROFANITY_PATTERN.test(message)) {
    return {
      rule: 1,
      ruleName: "No obscenities or content unsuitable for children (Part 3(c))",
      reason: "Message contains language that isn't suitable for a general audience.",
    };
  }
  return null;
}

// === Rule 2 (Part 3(c)) — racial/prejudicial content ===
// Deliberately narrow: catches overt slurs only, NOT subtler
// discriminatory phrasing — the NCC doc itself flags this as a soft-flag
// concern for anything beyond clear-cut terms, since keyword matching
// alone gets subjective bias wrong in both directions. A short, narrow
// list here is intentional, not an oversight.
const PREJUDICE_WORDS = [
  "nigger", "nigga", "chink", "spic", "kike", "wetback", "towelhead", "raghead",
];
const PREJUDICE_PATTERN = wordBoundaryPattern(PREJUDICE_WORDS);

function checkPrejudicialContent(message: string): ComplianceFailure | null {
  if (PREJUDICE_PATTERN.test(message)) {
    return {
      rule: 2,
      ruleName: "No racial or prejudicial content (Part 3(c))",
      reason: "Message contains language that targets a group by race, origin, religion, sex, gender, or age.",
    };
  }
  return null;
}

// === Rule 5 (Part 4(viii), (x)) — promos must state a duration/redemption date ===
const PROMO_TRIGGER_WORDS = ["win", "offer", "promo", "free", "discount", "bonus"];
const PROMO_TRIGGER_PATTERN = wordBoundaryPattern(PROMO_TRIGGER_WORDS);
// Covers both explicit date-ish phrasing ("till", "valid until", "expires")
// and an actual date token (12/08, 12-08-2026, "12 August"), so a message
// that spells the date out in full still passes even without one of the
// trigger phrases.
const DATE_PATTERN =
  /\b(till|until|expires?|ends?|valid|deadline)\b|\d{1,2}[/\-.]\d{1,2}(?:[/\-.]\d{2,4})?|\b\d{1,2}\s?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

function checkPromoHasDate(message: string): ComplianceFailure | null {
  if (PROMO_TRIGGER_PATTERN.test(message) && !DATE_PATTERN.test(message)) {
    return {
      rule: 5,
      ruleName: "Promos must state a duration or redemption date (Part 4(viii),(x))",
      reason:
        'Message reads as a promotion but doesn\'t state a duration or end date (e.g. "till 20 Aug", "valid until...").',
    };
  }
  return null;
}

// === Rule 7 (Part 4(xi)) — threshold-based promos need a clear number ===
// "first" without a nearby number ("first come first served" has no
// number and is fine on its own — it's "first 5000 customers" style
// claims that need the number). Checked as: does the message contain
// "first" or "while stocks/supplies last" at all, and if so, does it also
// contain a number anywhere?
//
// "First come, first served" (and the no-comma variant) is explicitly
// exempted — it's an ordering phrase, not a claim about a limited
// countable quantity, so it shouldn't need a number attached to it.
const FIRST_COME_FIRST_SERVED_PATTERN = /\bfirst\s+come,?\s+first\s+served\b/i;
const THRESHOLD_TRIGGER_PATTERN = /\bfirst\b|\bwhile\s+(stocks?|supplies)\s+last\b/i;
const HAS_NUMBER_PATTERN = /\d/;

function checkThresholdStated(message: string): ComplianceFailure | null {
  const withoutExemptPhrase = message.replace(FIRST_COME_FIRST_SERVED_PATTERN, "");
  if (THRESHOLD_TRIGGER_PATTERN.test(withoutExemptPhrase) && !HAS_NUMBER_PATTERN.test(message)) {
    return {
      rule: 7,
      ruleName: "Threshold-based promos must state the threshold clearly (Part 4(xi))",
      reason: 'Message references a limited quantity (e.g. "first...", "while stocks last") without stating a number.',
    };
  }
  return null;
}

// === Rule 10 (Part 4(xv)) — "T&Cs apply" needs an actual reference ===
const TERMS_MENTION_PATTERN = /\bt(?:&|and\s)?c'?s?\b.{0,20}\bappl(?:y|ies)\b|\bterms\s+(?:and\s+conditions\s+)?appl(?:y|ies)\b/i;
const LINK_PATTERN = /https?:\/\/\S+|\bwww\.\S+|\b[a-z0-9-]+\.(?:com|ng|co|link|ly)\b/i;

function checkTermsReferenced(message: string): ComplianceFailure | null {
  if (TERMS_MENTION_PATTERN.test(message) && !LINK_PATTERN.test(message)) {
    return {
      rule: 10,
      ruleName: "T&Cs must be clearly communicated, not just referenced (Part 4(xv))",
      reason: '"T&Cs apply" is stated but no link or reference to where those terms actually are.',
    };
  }
  return null;
}

/**
 * Runs every hard-fail rule against a message body. Collects ALL
 * failures rather than stopping at the first, so a client fixing their
 * message sees every problem in one pass instead of playing whack-a-mole
 * resubmitting once per rule.
 */
export function checkHardFailRules(message: string): ComplianceCheckResult {
  const failures = [
    checkProfanity(message),
    checkPrejudicialContent(message),
    checkPromoHasDate(message),
    checkThresholdStated(message),
    checkTermsReferenced(message),
  ].filter((f): f is ComplianceFailure => f !== null);

  return { passed: failures.length === 0, failures };
}
