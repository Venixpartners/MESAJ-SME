/**
 * NCC hard-fail message checks — the mechanical, rule-checkable subset of
 * the NCC Advertisement/Promotion Guidelines that a single SMS body can
 * actually be validated against (rules 1, 2, 5, 7, 10 of the internal
 * NCC guideline doc, plus rules 11 to 15 for threats, phishing, adult
 * content, blackmail and investment scams). A message that fails
 * any of these is rejected
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

// === Rule 11 — threats of violence or intimidation ===
// Not one of the numbered rules in the internal NCC guideline doc, so it
// takes the next free number. Added after "i want to kill you" went out on
// 10 Aug 2026. Matches a violent verb aimed at a person ("kill you", "shoot
// your wife"), plus a short list of stock threat phrases. Aimed at people,
// not things, so marketing lines like "kill your hunger" or "shoot your
// wedding" still pass.
const VIOLENT_VERBS =
  "kill(?:s|ed|ing)?|murder(?:s|ed|ing)?|shoot(?:s|ing)?|shot|stab(?:s|bed|bing)?|kidnap(?:s|ped|ping)?|" +
  "rape(?:s|d)?|raping|behead(?:s|ed|ing)?|slaughter(?:s|ed|ing)?|strangle(?:s|d)?|strangling|butcher(?:s|ed|ing)?|" +
  "poison(?:s|ed|ing)?|assassinate(?:s|d)?|assassinating";
const THREAT_TARGETS =
  "you|u|ya|yourself|him|her|them|" +
  "(?:your|ur|his|their) (?:family|wife|husband|child|children|kids?|son|daughter|mother|father|mum|mom|dad|people|brother|sister)";
const VIOLENT_THREAT_PATTERN = new RegExp(`\\b(?:${VIOLENT_VERBS})\\s+(?:${THREAT_TARGETS})\\b`, "i");
const THREAT_PHRASE_PATTERN = new RegExp(
  [
    "you(?:'re| are| r)? (?:going to|gonna|will) die",
    "you(?:'re| are|r| r) (?:a )?dead(?: man| woman| meat)?",
    "your days are numbered",
    "watch your back",
    "i(?: will| go|'ll| don| dey) (?:find|deal with|end) (?:you|u)",
    "(?:blow|burn) (?:you|u|your (?:house|shop|car|family))(?: up| down)?",
    "set (?:you|u|your \\w+) on fire",
  ]
    .map((p) => `\\b${p}\\b`)
    .join("|"),
  "i"
);

function checkThreats(message: string): ComplianceFailure | null {
  if (VIOLENT_THREAT_PATTERN.test(message) || THREAT_PHRASE_PATTERN.test(message)) {
    return {
      rule: 11,
      ruleName: "No threats of violence or intimidation",
      reason: "Message reads as a threat of violence against someone. It can't be sent.",
    };
  }
  return null;
}

// === Rules 12 to 15 — categories networks refuse outright ===
// Based on what Nigerian gateways and networks filter under the NCC
// Consumer Code of Practice. NCC publishes categories, not a word list, so
// these patterns target the clear cut form of each category. Words that
// are only sometimes a problem ("promo", "winner", "strike") are not here;
// they hold a campaign for admin review instead (see lib/reviewFlags.ts).

// Rule 12 — phishing: asking the recipient to hand over or "update"
// banking or identity details, or scaring them that an account is blocked.
// A negation shortly before the request ("never share your PIN", "we will
// never ask you to send your BVN") makes it a safety tip, not phishing, so
// it passes.
const SENSITIVE_DETAILS =
  "bvn|nin|otp|pin|password|passcode|token|atm card|card details|card number|cvv|account details|login details|bank details";
const PHISHING_VERBS =
  "send|share|update|verify|validate|revalidate|confirm|provide|submit|enter|reply with|text|link|reactivate|re-activate|unblock";
const DETAILS_REQUEST_PATTERN = new RegExp(
  `\\b(?:${PHISHING_VERBS})\\s+(?:us\\s+|me\\s+)?(?:your|ur|the)\\s+(?:${SENSITIVE_DETAILS})\\b`,
  "gi"
);
const NEGATION_BEFORE_PATTERN = /\b(?:never|not|don't|don’t|dont|no one|nobody|no staff)\b[^.!?]*$/i;
const PHISHING_PATTERNS = [
  /\byour\s+(?:bank\s+)?(?:account|card|atm card|bvn|nin|sim|line|wallet)\s+(?:has been|have been|is|will be|was)\s+(?:blocked|deactivated|suspended|restricted|frozen|closed|disabled|barred)\b/i,
  /\bclick\s+(?:on\s+)?(?:the|this|below)?\s*link\s+(?:to|and)\s+(?:update|verify|validate|reactivate|unblock|claim|confirm|restore)\b/i,
];

function asksForDetails(message: string): boolean {
  for (const match of message.matchAll(DETAILS_REQUEST_PATTERN)) {
    // Only the same sentence counts, and only the 40 characters before it.
    const before = message.slice(Math.max(0, (match.index ?? 0) - 40), match.index);
    if (!NEGATION_BEFORE_PATTERN.test(before)) return true;
  }
  return false;
}

function checkPhishing(message: string): ComplianceFailure | null {
  if (asksForDetails(message) || PHISHING_PATTERNS.some((p) => p.test(message))) {
    return {
      rule: 12,
      ruleName: "No phishing or requests for banking and identity details",
      reason:
        "Message asks the recipient to share or update banking or identity details (BVN, NIN, PIN, OTP, card or password), or says their account is blocked. Networks treat this as fraud.",
    };
  }
  return null;
}

// Rule 13 — sexually explicit or adult content. Ambiguous words ("sex" in
// a health clinic message, "escort" for security) are review flags instead.
const ADULT_PATTERN =
  /\b(?:xxx|porn|porno|pornography|nudes?|naked (?:pics?|photos?|videos?)|sugar (?:mummy|mommy|mummies|daddy|daddies)|hookups?|adult club|strip club|onlyfans|sex (?:chat|videos?|tapes?|toys?|workers?))\b/i;

function checkAdultContent(message: string): ComplianceFailure | null {
  if (ADULT_PATTERN.test(message)) {
    return {
      rule: 13,
      ruleName: "No sexually explicit or adult content",
      reason: "Message contains adult or sexually explicit content, which can't be sent to a general audience.",
    };
  }
  return null;
}

// Rule 14 — blackmail and calling a recipient a criminal. Naming fraud in
// general ("beware of fraudsters") is a review flag, not a block.
const BLACKMAIL_PATTERNS = [
  /\bpay\s+(?:me|us|up)\s+or\s+else\b/i,
  /\bor\s+else\s+(?:i|we)\s+(?:will|go|'ll)\b/i,
  /\b(?:i|we)(?:\s+will|\s+go|'ll)\s+(?:expose|disgrace|shame|report)\s+(?:you|u)\b/i,
  /\byou(?:'re|\s+are|\s+r)\s+(?:a\s+|an\s+)?(?:thief|fraudster|cheat|scammer|criminal|liar|idiot|fool|bastard|ole|ode|mumu)\b/i,
];

function checkBlackmailOrDefamation(message: string): ComplianceFailure | null {
  if (BLACKMAIL_PATTERNS.some((p) => p.test(message))) {
    return {
      rule: 14,
      ruleName: "No blackmail, insults or accusations against a person",
      reason: "Message insults or accuses the recipient, or demands payment with a threat. It can't be sent.",
    };
  }
  return null;
}

// Rule 15 — unregulated investment schemes.
const INVESTMENT_SCAM_PATTERN = new RegExp(
  [
    "ponzi",
    "forex signals?",
    "crypto boom",
    "bitcoin matrix",
    "double your (?:money|investment|cash|naira)",
    "free (?:bitcoin|btc|crypto|usdt)",
    "guaranteed (?:returns?|profits?|income|roi)",
    "\\d+\\s?%\\s*(?:daily|weekly)\\s*(?:returns?|profits?|roi|interest)",
  ]
    .map((p) => `\\b${p}\\b`)
    .join("|"),
  "i"
);

function checkInvestmentScam(message: string): ComplianceFailure | null {
  if (INVESTMENT_SCAM_PATTERN.test(message)) {
    return {
      rule: 15,
      ruleName: "No unregulated investment or get rich quick schemes",
      reason: "Message promotes a Ponzi style or unregulated investment scheme (guaranteed returns, doubling money, free crypto).",
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
      ruleName: "Promos with a limited quantity must state that quantity clearly (Part 4(xi))",
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
 * The content safety subset: profanity, slurs, threats, phishing, adult
 * content, blackmail and investment scams. Runs on every
 * send path, including the admin "send on behalf" and "test message"
 * paths that skip the full NCC advertising checks. Nobody sends these.
 */
export function checkContentSafety(message: string): ComplianceCheckResult {
  const failures = [
    checkProfanity(message),
    checkPrejudicialContent(message),
    checkThreats(message),
    checkPhishing(message),
    checkAdultContent(message),
    checkBlackmailOrDefamation(message),
    checkInvestmentScam(message),
  ].filter((f): f is ComplianceFailure => f !== null);
  return { passed: failures.length === 0, failures };
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
    checkThreats(message),
    checkPhishing(message),
    checkAdultContent(message),
    checkBlackmailOrDefamation(message),
    checkInvestmentScam(message),
    checkPromoHasDate(message),
    checkThresholdStated(message),
    checkTermsReferenced(message),
  ].filter((f): f is ComplianceFailure => f !== null);

  return { passed: failures.length === 0, failures };
}