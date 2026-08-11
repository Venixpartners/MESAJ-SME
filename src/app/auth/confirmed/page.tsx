"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Where Supabase actually lands someone after they click the confirmation
 * link in their signup email — set via `emailRedirectTo` on the
 * `signUp()` call in /signup (see src/app/signup/page.tsx). Without that,
 * Supabase falls back to the project's bare Site URL, which is the
 * marketing homepage — no acknowledgment that anything happened, no path
 * forward, and (until this existed) genuinely no session established in
 * the browser either.
 *
 * Supabase's link itself points at ITS OWN domain
 * (*.supabase.co/auth/v1/verify), verifies the token server-side, then
 * redirects here with a `?code=...` query param (PKCE flow) rather than
 * an already-logged-in session — the actual session only gets created
 * once THIS page exchanges that code, client-side, for real session
 * cookies on our own domain.
 */
export default function EmailConfirmedPage() {
  const [status, setStatus] = useState<"exchanging" | "success" | "error">("exchanging");
  const router = useRouter();

  useEffect(() => {
    async function exchange() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        // Landed here with no code at all — either a stale/reused link, or
        // someone navigated here directly. Not a crash-worthy state, just
        // nothing to confirm.
        setStatus("error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      setStatus(error ? "error" : "success");
    }
    exchange();
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    // Auto-advance after a moment — onboarding (business name, CAC
    // number, sector) is the actual next required step, not another
    // signup form. The brief pause is just so "Email confirmed" is
    // visible and registers before the page moves on, not a functional
    // delay.
    const timer = setTimeout(() => router.push("/onboarding"), 1500);
    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6 text-center">
      <div className="max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-md)]">
        {status === "exchanging" && (
          <>
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[var(--color-ink-900)]">Confirming your email…</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="size-5" aria-hidden />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[var(--color-ink-900)]">Email confirmed!</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
              Taking you to set up your business…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle className="size-5" aria-hidden />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[var(--color-ink-900)]">This link didn&apos;t work</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
              It may have already been used or expired. Try signing in — if your email&apos;s already confirmed,
              you&apos;ll go straight to your dashboard.
            </p>
            <Button className="mt-5" onClick={() => router.push("/login")}>
              Go to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
