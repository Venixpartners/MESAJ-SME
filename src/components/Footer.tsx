import Link from "next/link";
import { BrandLockup } from "@/components/Brand";
import { FACEBOOK_URL, INSTAGRAM_URL, LEGAL_ENTITY, SUPPORT_EMAIL, WHATSAPP_URL } from "@/lib/site";

/**
 * Deliberately minimal. Every link below is one a visitor could plausibly
 * want. Mesaj is a trading name; Venix Partners Limited is the legal
 * entity, and the footer must always say so.
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Mesaj home" className="rounded-md">
          <BrandLockup width={132} />
        </Link>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--color-ink-500)]"
        >
          <Link href="/terms" className="py-2 hover:text-[var(--color-ink-900)]">
            Terms
          </Link>
          <Link href="/privacy" className="py-2 hover:text-[var(--color-ink-900)]">
            Privacy
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="py-2 hover:text-[var(--color-ink-900)]">
            Email
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 hover:text-[var(--color-ink-900)]"
          >
            WhatsApp
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-2 hover:text-[var(--color-ink-900)]"
          >
            <InstagramIcon />
            Instagram
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-2 hover:text-[var(--color-ink-900)]"
          >
            <FacebookIcon />
            Facebook
          </a>
        </nav>

        <div className="text-center text-xs leading-relaxed text-[var(--color-ink-400)] sm:text-right">
          <p>Mesaj is a {LEGAL_ENTITY} company.</p>
          <p>© {new Date().getFullYear()} {LEGAL_ENTITY}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M14 8.5V7a1 1 0 0 1 1-1h1.5V3.5h-2.2A3.8 3.8 0 0 0 10.5 7.3V8.5H8V11h2.5v9.5H14V11h2.3l.4-2.5H14Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
