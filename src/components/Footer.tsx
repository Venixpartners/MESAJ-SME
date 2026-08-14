import Link from "next/link";

/**
 * Deliberately minimal — this is a self-serve B2B tool with one real
 * page, not a marketing site with a dozen sections to link to. A dense
 * multi-column footer here would be furniture, not information; every
 * link below is one a visitor could actually plausibly want.
 */
export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <span className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
          Mesaj <span className="text-[var(--color-brand-600)]">SME</span>
        </span>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--color-ink-500)]">
          <Link href="/terms" className="hover:text-[var(--color-ink-900)]">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[var(--color-ink-900)]">
            Privacy
          </Link>
          <a href="mailto:support@mail.mesaj.cloud" className="hover:text-[var(--color-ink-900)]">
            Contact
          </a>
        </nav>

        <p className="text-xs text-[var(--color-ink-400)]">© {new Date().getFullYear()} Mesaj SME. All rights reserved.</p>
      </div>
    </footer>
  );
}
