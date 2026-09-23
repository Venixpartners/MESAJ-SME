import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { BrandName } from "@/components/Brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] px-6 text-center">
      <BrandName />
      <h1 className="text-xl font-semibold text-[var(--color-ink-900)]">Page not found</h1>
      <p className="max-w-sm text-sm text-[var(--color-ink-500)]">
        The page you&apos;re looking for doesn&apos;t exist, or you may not have access to it.
      </p>
      <Link href="/" className={buttonClassName({ className: "mt-2" })}>
        Back to home
      </Link>
    </div>
  );
}
