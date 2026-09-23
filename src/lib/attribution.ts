/**
 * Signup attribution.
 *
 * The problem this solves: someone clicks a Facebook ad, lands on the
 * marketing page with utm tags on the URL, signs up, confirms their email
 * (which sends them out to Supabase and back), and only then completes
 * onboarding. By the time a Tenant row is created, the original URL is
 * long gone. Meta can tell you a click happened; only this can tell you
 * which paying client it became.
 *
 * So the tags are parked in a first party cookie on arrival and read back
 * server side when the Tenant is created. First touch wins: the campaign
 * that introduced someone to Mesaj is more interesting than whatever they
 * clicked on their way back a week later.
 */

export const ATTRIBUTION_COOKIE = "mesaj_attribution";

/** Long enough to cover a slow decision, short enough to stay honest. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Anything longer than this is noise or an attack, not a campaign name. */
const MAX_VALUE_LENGTH = 200;

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  /** Whichever ad platform click ID came along: fbclid, gclid or ttclid. */
  adClickId?: string;
}

const UTM_FIELDS: [keyof Attribution, string][] = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmContent", "utm_content"],
  ["utmTerm", "utm_term"],
];

const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid"];

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_VALUE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Pulls attribution out of a query string. Returns null when there is
 * nothing worth recording, so callers can tell "arrived from a campaign"
 * apart from "typed the address in".
 */
export function parseAttribution(params: URLSearchParams): Attribution | null {
  const result: Attribution = {};

  for (const [field, param] of UTM_FIELDS) {
    const value = clean(params.get(param));
    if (value) result[field] = value;
  }

  for (const param of CLICK_ID_PARAMS) {
    const value = clean(params.get(param));
    if (value) {
      result.adClickId = value;
      break;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function serializeAttribution(attribution: Attribution): string {
  return JSON.stringify(attribution);
}

/**
 * Reads back what was parked in the cookie. The cookie is user writable,
 * like every cookie, so nothing here trusts its shape: unknown keys are
 * dropped, non string values are dropped, and everything is length capped
 * before it can reach the database.
 */
export function deserializeAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;

  // The browser writes this cookie percent encoded, and different readers
  // hand it back in different states, so try it both ways rather than
  // depending on who decoded what.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const source = parsed as Record<string, unknown>;
  const allowed: (keyof Attribution)[] = [...UTM_FIELDS.map(([field]) => field), "adClickId"];
  const result: Attribution = {};

  for (const key of allowed) {
    const value = source[key];
    if (typeof value === "string") {
      const cleaned = clean(value);
      if (cleaned) result[key] = cleaned;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
