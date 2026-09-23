import Link from "next/link";
import { BrandHomeLink } from "@/components/Brand";

export function LegalPageHeader() {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
      <BrandHomeLink />
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/login" className="font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]">
          Sign in
        </Link>
      </nav>
    </header>
  );
}
