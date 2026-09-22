"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * A link to signup that carries campaign parameters across with it.
 *
 * Someone arriving from a Facebook or Instagram ad lands with utm tags and
 * an fbclid on the URL. A plain <Link href="/signup"> throws all of that
 * away at the first click, so the sign up page has no idea which ad paid
 * for the visit. This keeps the ones that identify the campaign and drops
 * everything else, so nothing unexpected rides along.
 *
 * useSearchParams needs a Suspense boundary in the app router. The
 * fallback is the same link without parameters, so the page still renders
 * statically and the button works even before hydration.
 */
const CARRIED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
];

function PlainLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function CampaignAwareLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const keep = new URLSearchParams();
  for (const key of CARRIED_PARAMS) {
    const value = searchParams.get(key);
    if (value) keep.set(key, value);
  }
  const query = keep.toString();
  return (
    <PlainLink href={query ? `${href}?${query}` : href} className={className}>
      {children}
    </PlainLink>
  );
}

export function SignupLink({
  className,
  children,
  href = "/signup",
}: {
  className?: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <Suspense
      fallback={
        <PlainLink href={href} className={className}>
          {children}
        </PlainLink>
      }
    >
      <CampaignAwareLink href={href} className={className}>
        {children}
      </CampaignAwareLink>
    </Suspense>
  );
}
