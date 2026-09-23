import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookUser,
  Bookmark,
  FileCheck,
  MessageSquareText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { BrandHomeLink } from "@/components/Brand";
import { Footer } from "@/components/Footer";
import { CostCalculator } from "@/components/marketing/CostCalculator";
import { SignupLink } from "@/components/marketing/SignupLink";
import { PRICE_PER_SMS } from "@/lib/pricing";
import {
  LEGAL_ENTITY,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/site";

/**
 * Public landing page. Every claim here has to be traceable to something
 * the product actually does (see the brand guidelines: if a claim doesn't
 * trace back to a pillar, it comes out). No delivery guarantees, no
 * invented customer counts, no testimonials we don't have.
 */

const STEPS = [
  {
    title: "Open your account",
    body: "Sign up with your business email, then send us your business name and CAC certificate so we can register your Sender ID.",
  },
  {
    title: "Fund your wallet",
    body: "Pay with a card or transfer through Paystack. Your balance appears straight away and every credit and debit is listed in one ledger.",
  },
  {
    title: "Send your first campaign",
    body: "Paste your numbers or upload a CSV, write your message, and submit. We check the list and show you what it costs before anything goes out.",
  },
];

const FEATURES = [
  {
    icon: BadgeCheck,
    title: "Your name on the message",
    body: "We submit your Sender ID to MTN, Airtel, Glo and 9mobile, and show you the status on each network as it changes.",
  },
  {
    icon: Wallet,
    title: "A wallet you can audit",
    body: "Every top up, every campaign and every refund sits in one ledger you can read down the page.",
  },
  {
    icon: BookUser,
    title: "Contact lists that stay put",
    body: "Save a list once, reuse it whenever. Invalid numbers and duplicates are stripped out as you go.",
  },
  {
    icon: Bookmark,
    title: "Messages you send often",
    body: "Keep the ones that work, load them into a new campaign in a click, and edit before sending.",
  },
  {
    icon: FileCheck,
    title: "A report per number",
    body: "See what happened to each phone number and which network it sat on. Download the whole thing as a CSV.",
  },
  {
    icon: ShieldCheck,
    title: "Checked before it sends",
    body: "We screen your message against the NCC advertising rules and tell you exactly what to fix, before you are charged.",
  },
];

const EXAMPLES = [
  {
    who: "A shop in Surulere",
    message: "Hi Amaka, your order is ready for pickup today until 6pm. Ask for Tunde at the counter.",
  },
  {
    who: "A clinic in Ikeja",
    message: "Reminder: your appointment with Dr Bello is tomorrow at 10am. Reply to this number to move it.",
  },
  {
    who: "A school in Yaba",
    message: "Second term fees are due on 14 March. Log in to the parent portal or come to the bursary.",
  },
];

const FAQS = [
  {
    q: "What does it cost?",
    a: `\u20a6${PRICE_PER_SMS} per message part, per customer. A part is 160 characters, and most messages are one part, so reaching 1,000 customers costs \u20a6${(1000 * PRICE_PER_SMS).toLocaleString("en-NG")}. A longer message is sent as two or more parts and costs that many times more, because that is how the networks charge us. The calculator above shows the exact figure before you spend anything. There is no monthly fee, no setup fee and no minimum order, and top ups are not refundable to cash: your balance stays in your wallet until you use it.`,
  },
  {
    q: "Will my message reach numbers on DND?",
    a: "Not always. The networks block promotional traffic to numbers registered on Do Not Disturb, and no provider in Nigeria can promise otherwise. Transactional messages such as receipts, reminders and one time passwords are the ones that travel best. Your delivery report shows you exactly which numbers took the message and which did not.",
  },
  {
    q: "How long does Sender ID approval take?",
    a: "That sits with the networks, not with us, and each one answers on its own schedule. We submit the request with your CAC document and show you the live status for MTN, Airtel, Glo and 9mobile as each one responds.",
  },
  {
    q: "What happens if a message does not go out?",
    a: "You are charged for the messages that reach the network. If a send fails before that, the money goes back to your wallet automatically and the campaign is marked as failed. Invalid and duplicate numbers are removed before you are charged at all.",
  },
  {
    q: "Do I need a developer?",
    a: "No. Everything here runs from the dashboard in your browser. If your team wants to send from your own software instead, that is our API product and we can set that up separately.",
  },
  {
    q: "Who do I talk to when something goes wrong?",
    a: `Message us on WhatsApp at ${WHATSAPP_DISPLAY} or email ${SUPPORT_EMAIL}, and a person in Lagos answers. Mesaj is a ${LEGAL_ENTITY} company, so you are dealing with a registered Nigerian business, not a reseller in another time zone.`,
  },
];

/**
 * Structured data. Built from the same arrays the page renders, so the
 * answers Google shows can never say something different from the answers
 * on screen.
 */
function structuredData() {
  const organisation = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organisation`,
    name: SITE_NAME,
    legalName: LEGAL_ENTITY,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: SUPPORT_EMAIL,
    telephone: WHATSAPP_DISPLAY,
    areaServed: "NG",
    address: { "@type": "PostalAddress", addressCountry: "NG", addressLocality: "Lagos" },
    sameAs: SOCIAL_PROFILES,
  };

  const service = {
    "@type": "Service",
    name: SITE_NAME,
    serviceType: "Bulk SMS",
    provider: { "@id": `${SITE_URL}/#organisation` },
    areaServed: "NG",
    offers: {
      "@type": "Offer",
      price: PRICE_PER_SMS,
      priceCurrency: "NGN",
      description: `${PRICE_PER_SMS} Naira per message part, per recipient`,
      url: `${SITE_URL}/signup`,
    },
  };

  const faq = {
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return { "@context": "https://schema.org", "@graph": [organisation, service, faq] };
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-canvas)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5">
          <BrandHomeLink />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]"
            >
              Sign in
            </Link>
            <SignupLink className={buttonClassName({ variant: "admin", className: "min-h-11" })}>
              Get started
            </SignupLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-14 pt-12 sm:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-semibold text-[var(--color-brand-700)]">Bulk SMS for Nigerian businesses</p>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-ink-900)] sm:text-5xl">
                Text every customer you have, from {`\u20a6${PRICE_PER_SMS}`} each.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-ink-600)]">
                Mesaj for SMEs puts your business name on every message, on MTN, Airtel, Glo and 9mobile. Top up a
                wallet, upload your numbers and send from your browser. No developer and no contract.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <SignupLink className={buttonClassName({ variant: "admin", className: "min-h-12 gap-1.5 px-6 text-base" })}>
                  Create your free account <ArrowRight className="size-4" aria-hidden />
                </SignupLink>
                <a href="#pricing" className={buttonClassName({ variant: "secondary", className: "min-h-12 px-6 text-base" })}>
                  See what a campaign costs
                </a>
              </div>
              <p className="mt-4 text-sm text-[var(--color-ink-500)]">Free to open. You only spend when you send.</p>
            </div>

            {/* A message as the customer sees it, which is the whole product in
                one picture: your name at the top, not an unknown number. */}
            <div className="mx-auto w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <span className="text-sm font-semibold text-[var(--color-ink-900)]">YourBrand</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-100)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-success-700)]">
                  <span className="size-1.5 rounded-full bg-[var(--color-success-600)]" aria-hidden />
                  Delivered
                </span>
              </div>
              <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-ink-50)] p-3.5 text-sm leading-relaxed text-[var(--color-ink-700)]">
                Hi Amaka, your order is ready for pickup today until 6pm. Ask for Tunde at the counter.
              </p>
              <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-ink-50)] p-3.5 text-sm leading-relaxed text-[var(--color-ink-700)]">
                Second term fees are due on 14 March. Log in to the parent portal or come to the bursary.
              </p>
              <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-400)]">
                One part each, sent to 1,000 customers for{" "}
                {`\u20a6${(1000 * PRICE_PER_SMS).toLocaleString("en-NG")}`}
              </p>
            </div>
          </div>

          <dl className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
            {[
              { k: "4 networks", v: "MTN, Airtel, Glo and 9mobile from one dashboard" },
              { k: `\u20a6${PRICE_PER_SMS} a part`, v: "Per message part, per customer, priced in Naira" },
              { k: "Lagos support", v: `A ${LEGAL_ENTITY} company` },
            ].map((item) => (
              <div key={item.k} className="bg-[var(--color-surface)] p-5">
                <dt className="text-lg font-semibold tracking-tight text-[var(--color-ink-900)]">{item.k}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-[var(--color-ink-500)]">{item.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Pricing and calculator */}
        <section id="pricing" className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
              Work out what your next campaign costs
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-ink-600)]">
              Move the numbers around until it fits your budget. This is the same price your wallet charges when you
              press send.
            </p>
            <div className="mt-8">
              <CostCalculator />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
            Three steps to your first send
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-brand-50)] font-mono text-sm font-semibold text-[var(--color-brand-700)]">
                  {i + 1}
                </span>
                <p className="mt-4 font-semibold text-[var(--color-ink-900)]">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-600)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* What you get */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
              Everything the send needs, nothing you have to learn
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
                    <f.icon className="size-4" aria-hidden />
                  </div>
                  <p className="mt-3 font-semibold text-[var(--color-ink-900)]">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-600)]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
            What a Mesaj message looks like
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-ink-600)]">
            Your business name sits at the top instead of a random number, so people know who is writing before they
            open it.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {EXAMPLES.map((e) => (
              <div key={e.who}>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-400)]">YourBrand</p>
                  <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-ink-50)] p-3 text-sm leading-relaxed text-[var(--color-ink-700)]">
                    {e.message}
                  </p>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-500)]">{e.who}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
              Straight answers
            </h2>
            <div className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {FAQS.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-base font-semibold text-[var(--color-ink-900)]">
                    {item.q}
                    <span className="shrink-0 text-[var(--color-ink-400)] transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-600)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-ink-900)] p-8 text-center sm:p-14">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your customers are one message away
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70">
              Open an account today, send your first campaign as soon as your Sender ID clears.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <SignupLink
                className={buttonClassName({ variant: "admin", className: "min-h-12 w-full gap-1.5 px-6 text-base sm:w-auto" })}
              >
                Create your free account <ArrowRight className="size-4" aria-hidden />
              </SignupLink>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-white/25 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                <MessageSquareText className="size-4" aria-hidden />
                Ask a question on WhatsApp
              </a>
            </div>
            <p className="mt-6 text-sm text-white/60">
              WhatsApp {WHATSAPP_DISPLAY} or email {SUPPORT_EMAIL}
            </p>
            <p className="mt-8 text-sm text-white/50">Powering the Nigerian Pulse</p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Sticky action bar, phones only. Sits above the footer so the last
          thing on a small screen is always a way to start. */}
      <div className="sticky bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur sm:hidden">
        <SignupLink className={buttonClassName({ variant: "admin", className: "min-h-12 w-full gap-1.5 text-base" })}>
          Create your free account <ArrowRight className="size-4" aria-hidden />
        </SignupLink>
      </div>
    </div>
  );
}
