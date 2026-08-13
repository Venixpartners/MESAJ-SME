"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type WhoamiResponse = { role: string | null; onboarded: boolean };

/**
 * Same retry-on-401 shape as /login (see fetchWhoamiWithRetry there) — the
 * session cookie from exchangeCodeForSession() below can take a brief
 * moment to be ready for the very next same-origin fetch.
 */
async function fetchWhoamiWithRetry(maxAttempts = 3): Promise<WhoamiResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch("/api/whoami", { cache: "no-store" });
    if (res.status !== 401) {
      return res.json();
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return { role: null, onboarded: false };
}

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

      if (error) {
        // PKCE codes are single-use, and the exchange only succeeds in the
        // same browser that started signup (it reads a locally-stored
        // verifier). If this effect ever runs a second time for the same
        // code — a page refresh, the link opened twice, React re-running
        // the effect — the SECOND attempt fails even though the first one
        // may have already succeeded and logged the person in. Before
        // treating this as a real failure, check whether a session
        // actually exists already; if it does, the confirmation already
        // worked and this is just a harmless re-run, not a broken link.
        const { data } = await supabase.auth.getSession();
        setStatus(data.session ? "success" : "error");
        return;
      }

      setStatus("success");
    }
    exchange();
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    // Auto-advance after a moment — route based on actual account state
    // rather than assuming onboarding is always next. Covers the edge
    // case of someone clicking an old/stale confirmation link after
    // they've already completed onboarding (or an admin account, in
    // principle) — same routing logic as /login.
    const timer = setTimeout(async () => {
      const who = await fetchWhoamiWithRetry();
      if (who.role === "ADMIN") {
        router.push("/admin");
      } else if (!who.onboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }, 1500);
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
              Taking you to your account…
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
