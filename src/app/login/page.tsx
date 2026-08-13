"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

type WhoamiResponse = { role: string | null; onboarded: boolean };

/**
 * Fetches /api/whoami with a short retry-on-401 loop.
 *
 * Right after supabase.auth.signInWithPassword() resolves on the client,
 * the auth cookie can take a brief moment to actually be written and
 * ready to send on the very next same-origin fetch. Calling /api/whoami
 * immediately can hit that window and get back {role: null, onboarded:
 * false} even for an already-onboarded user — which then incorrectly
 * routes them to /onboarding. Retrying a couple of times with a short
 * delay avoids trusting that first, possibly-too-early call.
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Route based on role: admins go straight to /admin, clients go to
    // /onboarding if they haven't completed it yet, otherwise /dashboard.
    const who = await fetchWhoamiWithRetry();
    setLoading(false);
    if (who.role === "ADMIN") {
      router.push("/admin");
    } else if (!who.onboarded) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-md)]"
      >
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
          Mesaj <span className="text-[var(--color-brand-600)]">SME</span>
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-[var(--color-ink-900)]">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">Welcome back — enter your details below.</p>

        <div className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]">
              Forgot password?
            </Link>
          </p>
        </div>

        {error && (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        )}

        <Button type="submit" loading={loading} className="mt-5 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="mt-4 text-center text-sm text-[var(--color-ink-500)]">
          No account?{" "}
          <Link href="/signup" className="font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
