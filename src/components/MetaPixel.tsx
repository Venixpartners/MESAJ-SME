"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Meta (Facebook) Pixel.
 *
 * Loaded through next/script rather than a raw <script> tag so Next.js
 * controls when it runs: afterInteractive means it never blocks first
 * paint, and it is injected once for the whole app instead of re-running
 * on every client-side navigation.
 *
 * Only runs on the public marketing and signup pages. Everything under
 * /dashboard and /admin is deliberately excluded: those URLs carry
 * tenant, campaign and client IDs, and a PageView sends the full URL to
 * Meta. Pixel data is for acquisition, not for handing a client's
 * account activity to an ad platform.
 *
 * The ID can be overridden with NEXT_PUBLIC_META_PIXEL_ID without a code
 * change; the fallback is the current Mesaj pixel.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1108617625147529";

const EXCLUDED_PREFIXES = ["/dashboard", "/admin"];

export function isTracked(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const tracked = isTracked(pathname);
  // The inline snippet below already fires one PageView when it loads, so
  // this effect only reports the navigations that happen after that.
  // Without the ref, the first page would be counted twice.
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (tracked) {
      window.fbq?.("track", "PageView");
    }
  }, [pathname, tracked]);

  if (!tracked) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
