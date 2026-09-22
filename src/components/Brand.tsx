import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Official Mesaj artwork only. Never redraw the mark or rebuild the
 * wordmark from a typeface (brand guidelines, Logo section).
 *
 * Symbol: /logo.png. Used where the full lockup would fall under its
 * 120px screen minimum, per the guidelines.
 * Lockup: /mesaj-lockup.svg, the primary lockup for light backgrounds.
 */

const SYMBOL_RATIO = 464 / 500;
const LOCKUP_RATIO = 243 / 360;

export function BrandSymbol({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={Math.round(size * SYMBOL_RATIO)}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

export function BrandLockup({ width = 132, className }: { width?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mesaj-lockup.svg"
      alt="Mesaj"
      width={width}
      height={Math.round(width * LOCKUP_RATIO)}
      className={className}
    />
  );
}

/** Symbol plus product name. The name is a label beside the mark, not part of it. */
export function BrandName({
  tone = "light",
  accent,
  size = 32,
  className,
}: {
  tone?: "light" | "dark";
  accent?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandSymbol size={size} />
      <span
        className={cn(
          "text-[15px] font-semibold tracking-tight",
          tone === "dark" ? "text-white" : "text-[var(--color-ink-900)]"
        )}
      >
        Mesaj for SMEs
        {accent && (
          <span className={cn("ml-1.5", tone === "dark" ? "text-[var(--color-brand-500)]" : "text-[var(--color-brand-600)]")}>
            {accent}
          </span>
        )}
      </span>
    </span>
  );
}

export function BrandHomeLink({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Mesaj for SMEs home" className={cn("inline-flex rounded-md", className)}>
      <BrandName />
    </Link>
  );
}
