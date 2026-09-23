"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTracked } from "@/components/MetaPixel";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  parseAttribution,
  serializeAttribution,
} from "@/lib/attribution";

/**
 * Parks the campaign tags from the current URL in a first party cookie, so
 * they are still around when the Tenant is finally created at onboarding
 * (see /api/onboarding). Runs on the public pages only, the same scope as
 * the pixel: a signed in page has no campaign tags to read anyway.
 *
 * First touch wins. If the cookie already exists it is left alone, so the
 * campaign that brought someone here the first time is the one credited,
 * not whatever they happened to click on the way back.
 */
export function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTracked(pathname)) return;
    if (document.cookie.split("; ").some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`))) return;

    const attribution = parseAttribution(new URLSearchParams(window.location.search));
    if (!attribution) return;

    const value = encodeURIComponent(serializeAttribution(attribution));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ATTRIBUTION_COOKIE}=${value}; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  }, [pathname]);

  return null;
}
