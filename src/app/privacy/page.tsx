import { LegalPageHeader } from "@/components/LegalPageHeader";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Privacy Policy — Mesaj SME" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)]">
      <LegalPageHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">Last updated: August 2026</p>

        <div className="prose-legal mt-8 space-y-8 text-[15px] leading-relaxed text-[var(--color-ink-700)]">
          <section>
            <p>
              This policy explains what Mesaj SME collects, why, and how it&apos;s handled. It applies to
              business account holders using the Service, and — separately, in the last section below — to
              the recipients of campaigns sent through it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">What we collect from you</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Account details: email address, and a hashed password (we never see or store it in plain text)</li>
              <li>Business details: business name, CAC registration number, sector, contact phone number</li>
              <li>Your CAC certificate (image or PDF), used specifically to support Sender ID approval with telecom carriers</li>
              <li>Payment activity via Paystack — we see transaction references and amounts, never your full card details</li>
              <li>
                Contact lists and phone numbers you upload for campaigns — this is data you provide about
                your own customers, which we process on your behalf (see below)
              </li>
              <li>Basic technical data if something goes wrong — error reports, browser/device type — used only for fixing bugs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Why we collect it</h2>
            <p className="mt-2">We use this information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Create and run your account</li>
              <li>Submit and track Sender ID requests with telecom carriers</li>
              <li>Process wallet top-ups and campaign billing</li>
              <li>Send the SMS campaigns you compose to the numbers you provide</li>
              <li>Notify you by email about account activity — Sender ID status, campaign outcomes</li>
              <li>Investigate and fix technical problems</li>
              <li>Meet our own legal and regulatory obligations, including NCC compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Who we share it with</h2>
            <p className="mt-2">We share data with a small number of service providers who help us run the Service, each only for the specific purpose below:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Supabase</strong> — hosts our database, authentication, and file storage (EU region)</li>
              <li><strong>Paystack</strong> — processes wallet top-up payments</li>
              <li><strong>Resend</strong> — delivers transactional emails (account and campaign notifications)</li>
              <li><strong>Sentry</strong> — error monitoring, so we find and fix bugs quickly</li>
              <li><strong>Our SMS gateway partner and the telecom carriers</strong> (MTN, Airtel, Glo, 9mobile) — necessary to actually deliver your campaigns and process Sender ID approval</li>
            </ul>
            <p className="mt-2">
              We don&apos;t sell your data, or your customers&apos; phone numbers, to anyone — including for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Your customers&apos; phone numbers</h2>
            <p className="mt-2">
              When you upload a contact list, you remain the data controller for those numbers under the
              Nigeria Data Protection Act — you&apos;re responsible for having a lawful basis to hold and
              message them (see our Terms of Service). We act only as a processor: we use those numbers
              solely to send the campaign you submit, and don&apos;t use them for any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">How long we keep it</h2>
            <p className="mt-2">
              We keep account and campaign data for as long as your account is active, and for a reasonable
              period after closure to meet legal, accounting, or regulatory retention requirements. You can
              request deletion of your data at any time, subject to records we&apos;re legally required to
              retain (e.g. financial transaction records).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Your rights</h2>
            <p className="mt-2">
              Under the Nigeria Data Protection Act, you have the right to access the personal data we hold
              about you, request correction of inaccurate data, request deletion, and object to certain
              processing. To exercise any of these, contact us below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Security</h2>
            <p className="mt-2">
              Your CAC documents are stored in a private file store that only our admin systems can access —
              never a public link. Database access is restricted by row-level security so that one
              business&apos;s data is never visible to another&apos;s. Passwords are hashed, never stored in
              plain text.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be communicated by email or
              an in-app notice before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Contact</h2>
            <p className="mt-2">
              Questions about this policy, or to exercise your data rights:{" "}
              <a href="mailto:support@mail.mesaj.cloud" className="text-[var(--color-brand-600)] hover:underline">
                support@mail.mesaj.cloud
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
