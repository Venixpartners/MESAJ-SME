"use client";

import { useState } from "react";
import { PRICE_PER_SMS, campaignCost } from "@/lib/pricing";
import { getSegmentInfo } from "@/lib/smsSegments";

/**
 * Live cost estimate for the landing page.
 *
 * Deliberately imports PRICE_PER_SMS and getSegmentInfo rather than
 * repeating either: the number a visitor sees here is the same number the
 * wallet charges them later (see /api/campaigns/submit), and it moves the
 * day pricing.ts moves. A marketing page quoting a stale price is worse
 * than no price at all.
 *
 * Billing is per part per recipient, so the message box is part of the
 * sum: a message that runs to two parts doubles the total, exactly as it
 * does at send time.
 */
const PRESETS = [250, 1000, 5000];

const SAMPLE_MESSAGE = "Hi Amaka, your order is ready for pickup at our Surulere store today until 6pm. Thank you for shopping with us.";

function naira(amount: number): string {
  return `\u20a6${amount.toLocaleString("en-NG")}`;
}

export function CostCalculator() {
  const [recipients, setRecipients] = useState(1000);
  const [message, setMessage] = useState(SAMPLE_MESSAGE);

  const safeRecipients = Number.isFinite(recipients) && recipients > 0 ? Math.floor(recipients) : 0;
  const segmentInfo = getSegmentInfo(message);
  const total = campaignCost(safeRecipients, segmentInfo.segments);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="calc-recipients" className="text-sm font-semibold text-[var(--color-ink-900)]">
            How many customers?
          </label>
          <input
            id="calc-recipients"
            type="number"
            min={1}
            max={50000}
            value={recipients}
            onChange={(e) => setRecipients(Number(e.target.value))}
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white px-3 py-2.5 font-mono text-base tabular-nums text-[var(--color-ink-900)] outline-none focus:border-[var(--color-ink-900)] focus:ring-2 focus:ring-[var(--color-ink-900)]/10"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRecipients(n)}
                className="min-h-11 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-600)] transition-colors hover:border-[var(--color-ink-900)] hover:text-[var(--color-ink-900)]"
              >
                {n.toLocaleString("en-NG")}
              </button>
            ))}
          </div>

          <label htmlFor="calc-message" className="mt-5 block text-sm font-semibold text-[var(--color-ink-900)]">
            Your message
          </label>
          <textarea
            id="calc-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 918))}
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white px-3 py-2.5 text-sm leading-relaxed text-[var(--color-ink-700)] outline-none focus:border-[var(--color-ink-900)] focus:ring-2 focus:ring-[var(--color-ink-900)]/10"
          />
          <p className="mt-2 text-xs text-[var(--color-ink-500)]">
            {segmentInfo.length} characters, {segmentInfo.segments === 1 ? "1 part" : `${segmentInfo.segments} parts`}.
            A part is 160 characters{segmentInfo.encoding === "UCS2" ? ", or 70 once you use emoji or curly quotes." : "."}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-[var(--radius-sm)] bg-[var(--color-ink-50)] p-5">
          <div>
            <p className="text-sm text-[var(--color-ink-500)]">This campaign costs</p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums tracking-tight text-[var(--color-ink-900)]">
              {naira(total)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-600)]">
              {naira(PRICE_PER_SMS)} per message part, per customer. This message is{" "}
              {segmentInfo.segments === 1 ? "one part" : `${segmentInfo.segments} parts`}. No monthly fee, no setup
              fee and no minimum order.
            </p>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-[var(--color-ink-600)]">
            <li>Invalid and duplicate numbers are removed before you pay.</li>
            <li>Anything that never reaches the network goes back to your wallet.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
