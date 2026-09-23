/**
 * Public identity of the site, in one place.
 *
 * Share images, the sitemap, robots.txt and the structured data all need
 * an absolute URL, and they must agree with each other. NEXT_PUBLIC_APP_URL
 * is already required at boot (see lib/env.ts), so this only falls back to
 * the live domain for local runs where it isn't set.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sms.mesaj.cloud";

export const SITE_NAME = "Mesaj for SMEs";
export const LEGAL_ENTITY = "Venix Partners Limited";

export const SUPPORT_EMAIL = "support@venixpartners.com";

/** Display form for humans, and the wa.me form for the link. */
export const WHATSAPP_DISPLAY = "+234 805 288 0962";
export const WHATSAPP_URL = "https://wa.me/2348052880962";

export const INSTAGRAM_URL = "https://www.instagram.com/mesajsms";
export const FACEBOOK_URL = "https://www.facebook.com/mesajsms";

/**
 * Every profile that is genuinely ours. Search engines read this as the
 * sameAs list in our structured data, which is how they tie the site and
 * the social accounts together as one business.
 */
export const SOCIAL_PROFILES = [INSTAGRAM_URL, FACEBOOK_URL];

export const SITE_DESCRIPTION =
  "Bulk SMS for Nigerian businesses. Get your Sender ID approved, top up your wallet and send campaigns to your customers from your own account.";
