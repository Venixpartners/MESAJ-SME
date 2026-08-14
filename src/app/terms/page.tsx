import { LegalPageHeader } from "@/components/LegalPageHeader";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Terms of Service — Mesaj SME" };

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)]">
      <LegalPageHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">Last updated: August 2026</p>

        <div className="prose-legal mt-8 space-y-8 text-[15px] leading-relaxed text-[var(--color-ink-700)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">1. Who these terms apply to</h2>
            <p className="mt-2">
              We (&quot;we,&quot; &quot;us,&quot; &quot;the Service&quot;) are Mesaj SME, a bulk SMS platform for Nigerian small and medium
              businesses. By creating an account, you agree to these terms on behalf of the business you
              represent. You must be authorized to act for that business and to accept these terms on its
              behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">2. Your account and business information</h2>
            <p className="mt-2">
              To use the Service you provide business information — including your business name, CAC
              registration number, sector, and a photo or scan of your CAC certificate — which we forward to
              telecom carriers as part of getting your Sender ID approved. You&apos;re responsible for making
              sure this information is accurate and that you&apos;re authorized to submit it. Submitting false
              or misleading business information is grounds for suspending your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">3. Sender IDs and message content</h2>
            <p className="mt-2">
              Sender ID requests are reviewed and forwarded to MTN, Airtel, Glo, and 9mobile individually —
              approval timing and outcome are ultimately up to each carrier, not us. Once approved, you may
              send campaigns under that Sender ID.
            </p>
            <p className="mt-2">
              All campaign content is checked against Nigerian Communications Commission (NCC) advertising
              guidelines before sending — messages that fail these checks are rejected automatically and
              never sent. Passing these checks is not a guarantee of full regulatory compliance in every
              respect; you remain responsible for the content of messages sent from your account, including
              compliance with NCC rules, other applicable Nigerian law, and any sector-specific regulations
              that apply to your business.
            </p>
            <p className="mt-2">You may not use the Service to send content that is:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Obscene, or unsuitable for a general audience</li>
              <li>Discriminatory on the basis of race, religion, sex, gender, age, or national origin</li>
              <li>Fraudulent, deceptive, or intended to scam recipients</li>
              <li>Sent without the consent of the people you&apos;re messaging</li>
              <li>In violation of any Nigerian law or NCC regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">4. Recipient consent is your responsibility</h2>
            <p className="mt-2">
              When you upload a contact list or send a campaign, you&apos;re confirming that you have the
              right to message every number on that list — whether through their consent, an existing
              customer relationship, or another lawful basis. We don&apos;t verify this on your behalf. You
              agree to indemnify us against any claim, fine, or complaint arising from messages sent to
              people who did not consent to receive them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">5. Wallet, billing, and refunds</h2>
            <p className="mt-2">
              You fund your wallet in advance via Paystack; campaign costs are deducted from this balance
              when you submit a campaign. Refund policy for a campaign send:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                If a carrier rejects a message outright (it&apos;s never actually dispatched), that portion
                is refunded to your wallet automatically.
              </li>
              <li>
                If a carrier accepts and dispatches a message but it ultimately fails to reach the recipient&apos;s
                phone (e.g. the phone is off, the number is inactive), that message is <strong>not</strong> refunded
                — the carrier charges for the attempt regardless of final delivery, consistent with standard
                SMS industry billing.
              </li>
            </ul>
            <p className="mt-2">
              Wallet funds have no cash value outside the Service and are non-transferable between accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">6. Suspension and termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account for violating these terms, sending prohibited content,
              providing false business information, or fraudulent payment activity. You may stop using the
              Service at any time; unused wallet balance handling on account closure will be addressed on a
              case-by-case basis — contact us if you close your account with a remaining balance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">7. Service availability</h2>
            <p className="mt-2">
              We aim to keep the Service available and reliable but don&apos;t guarantee uninterrupted access.
              Message delivery ultimately depends on third parties — telecom carriers and our SMS gateway
              provider — whose performance is outside our direct control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">8. Limitation of liability</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, we&apos;re not liable for indirect, incidental, or
              consequential damages arising from your use of the Service, including lost business or revenue
              resulting from delayed or undelivered messages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">9. Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes will be communicated by email or
              an in-app notice before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">10. Governing law</h2>
            <p className="mt-2">These terms are governed by the laws of the Federal Republic of Nigeria.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">11. Contact</h2>
            <p className="mt-2">
              Questions about these terms:{" "}
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
