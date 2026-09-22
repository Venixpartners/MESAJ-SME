import Link from "next/link";
import { BrandLockup } from "@/components/Brand";

/**
 * Deliberately minimal. Every link below is one a visitor could plausibly
 * want. Mesaj is a trading name; Venix Partners Limited is the legal
 * entity, and the footer must always say so.
 */
const INSTAGRAM_URL = "https://www.instagram.com/mesajsms";

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
          <a href="mailto:support@mail.mesaj.cloud" className="py-2 hover:text-[var(--color-ink-900)]">
            Contact
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
        </nav>

        <div className="text-center text-xs leading-relaxed text-[var(--color-ink-400)] sm:text-right">
          <p>Mesaj is a Venix Partners Limited company.</p>
          <p>© {new Date().getFullYear()} Venix Partners Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
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
