/**
 * Client-facing transactional notifications.
 *
 * Email triggers: Sender ID per-carrier status changes, and campaign
 * rejection reasons. Both are things a client currently has to notice by
 * checking their dashboard; this emails them the moment it happens instead.
 *
 * SMS trigger: a welcome SMS sent once, right after onboarding completes
 * (see sendWelcomeSms below and /api/onboarding). This uses Mesaj SME's own
 * carrier-approved shortCode (MESAJ_WELCOME_SENDER_ID) — a client's own
 * Sender ID doesn't exist yet at this point in the flow, so this can't
 * reuse the per-tenant sending path campaigns use.
 */

import { sendEmail } from "./email";
import { sendCarrierBatch } from "./mesajClient";
import { normalizeNumber } from "./numbers";
import type { Carrier, SenderIdStatus } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

const APP_NAME = "Mesaj SME";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapHtml(bodyHtml: string): string {
  return `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b; line-height: 1.5;">
    <p style="font-weight: 600; font-size: 16px; margin-bottom: 16px;">${APP_NAME}</p>
    ${bodyHtml}
    <p style="margin-top: 24px; font-size: 12px; color: #71717a;">This is an automated notification from ${APP_NAME}.</p>
  </div>`;
}

/**
 * Sent when admin updates a Sender ID's per-carrier status (see
 * /api/admin/sender-id/update-status). Fires on every status value,
 * including a carrier being set back to PENDING (e.g. correcting a mistake).
 */
export async function notifySenderIdStatusChange(params: {
  to: string;
  businessName: string;
  requestedName: string;
  carrier: Carrier;
  status: SenderIdStatus;
  approvedShortcode?: string | null;
}) {
  const { to, businessName, requestedName, carrier, status, approvedShortcode } = params;

  const statusHtml =
    status === "APPROVED"
      ? `approved${approvedShortcode ? ` — the approved shortCode is <strong>${escapeHtml(approvedShortcode)}</strong>` : ""}`
      : status === "REJECTED"
        ? "rejected"
        : "set back to pending review";

  return sendEmail({
    to,
    subject: `Sender ID "${requestedName}" — ${carrier} update`,
    html: wrapHtml(`
      <p>Hi ${escapeHtml(businessName)},</p>
      <p>Your Sender ID request "<strong>${escapeHtml(requestedName)}</strong>" was ${statusHtml} on <strong>${carrier}</strong>.</p>
      ${
        status === "APPROVED"
          ? `<p>You can now send campaigns to ${carrier} numbers using this Sender ID.</p>`
          : status === "REJECTED"
            ? `<p>Contact support if you'd like to know why, or submit a new request with an adjusted name.</p>`
            : ""
      }
    `),
  });
}

/**
 * Sent when admin rejects a pending campaign (see
 * /api/admin/campaigns/reject). The reserved wallet balance for this
 * campaign is already refunded by that route before this fires — the email
 * just tells the client both things happened.
 */
export async function notifyCampaignRejected(params: {
  to: string;
  businessName: string;
  messageBody: string;
  reason: string;
}) {
  const { to, businessName, messageBody, reason } = params;
  const preview = messageBody.length > 100 ? `${messageBody.slice(0, 100)}…` : messageBody;

  return sendEmail({
    to,
    subject: "Your campaign was not approved",
    html: wrapHtml(`
      <p>Hi ${escapeHtml(businessName)},</p>
      <p>Your campaign "${escapeHtml(preview)}" was not approved.</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      <p>The wallet balance reserved for this campaign has been refunded to your account.</p>
    `),
  });
}

/**
 * Sent when admin approves a campaign's delivery report for client
 * visibility (see /api/admin/campaigns/[id]/approve-report). The report
 * itself (MSISDN, telco, status per recipient) isn't included in the
 * email — it just tells the client it's ready and links back to the
 * dashboard, same pattern as the other notifications here.
 */
export async function notifyReportReady(params: {
  to: string;
  businessName: string;
  messageBody: string;
  recipientCount: number;
  deliveredCount: number;
  campaignId: string;
  appUrl: string;
}) {
  const { to, businessName, messageBody, recipientCount, deliveredCount, campaignId, appUrl } = params;
  const preview = messageBody.length > 100 ? `${messageBody.slice(0, 100)}…` : messageBody;

  return sendEmail({
    to,
    subject: "Your campaign's delivery report is ready",
    html: wrapHtml(`
      <p>Hi ${escapeHtml(businessName)},</p>
      <p>The delivery report for your campaign "${escapeHtml(preview)}" is ready — <strong>${deliveredCount}</strong> of ${recipientCount} recipients confirmed delivered.</p>
      <p><a href="${escapeHtml(appUrl)}/dashboard/campaigns/${campaignId}/report" style="color: #16a34a;">View the full report</a>, including per-number status and telco.</p>
    `),
  });
}

export async function notifyCampaignSent(params: {
  to: string;
  businessName: string;
  messageBody: string;
  recipientCount: number;
  totalSent: number;
  refundedAmount: number;
}) {
  const { to, businessName, messageBody, recipientCount, totalSent, refundedAmount } = params;
  const preview = messageBody.length > 100 ? `${messageBody.slice(0, 100)}…` : messageBody;

  const fullyFailed = totalSent === 0;
  const partiallyFailed = !fullyFailed && totalSent < recipientCount;

  const subject = fullyFailed
    ? "Your campaign failed to send"
    : partiallyFailed
      ? "Your campaign was partially sent"
      : "Your campaign has been sent";

  const statusParagraph = fullyFailed
    ? `<p>Your campaign "${escapeHtml(preview)}" was approved, but every carrier it was submitted to failed to deliver it. No messages went out.</p>`
    : partiallyFailed
      ? `<p>Your campaign "${escapeHtml(preview)}" was approved and sent — <strong>${totalSent}</strong> of ${recipientCount} recipients received it. The rest failed at the carrier level.</p>`
      : `<p>Your campaign "${escapeHtml(preview)}" was approved and sent to all <strong>${recipientCount}</strong> recipients.</p>`;

  const refundParagraph =
    refundedAmount > 0
      ? `<p>You were only charged for the messages that actually sent — ₦${refundedAmount.toLocaleString("en-NG")} for the rest has already been refunded to your wallet.</p>`
      : "";

  return sendEmail({
    to,
    subject,
    html: wrapHtml(`
      <p>Hi ${escapeHtml(businessName)},</p>
      ${statusParagraph}
      ${refundParagraph}
    `),
  });
}

/**
 * Internal, admin-facing notifications — the other direction from
 * everything above this line. Both trigger points (new signup, new Sender
 * ID request) previously required admin to notice by checking the
 * dashboard; these email admin the moment either happens instead, with a
 * real link to act on it immediately rather than just "go check the
 * dashboard."
 *
 * Recipients come from ADMIN_NOTIFICATION_EMAILS (comma-separated), not
 * hardcoded, so who gets these can change without a code deploy. If it's
 * unset, both functions no-op — a misconfigured notification should never
 * be the thing that fails a signup or a Sender ID request. Sent as
 * individual emails per recipient (not relying on sendEmail supporting a
 * multi-address `to`) so this stays correct regardless of what shape
 * sendEmail's `to` parameter currently accepts.
 */
function adminRecipients(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Sent when a new tenant completes onboarding (see POST /api/onboarding). */
export async function notifyAdminNewSignup(params: {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  sector: string;
  appUrl: string;
}) {
  const recipients = adminRecipients();
  if (recipients.length === 0) return { success: false, error: "ADMIN_NOTIFICATION_EMAILS not configured" };

  const { businessName, contactEmail, contactPhone, sector, appUrl } = params;

  return Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `New signup: ${businessName}`,
        html: wrapHtml(`
          <p>A new business just completed onboarding.</p>
          <p>
            <strong>Business:</strong> ${escapeHtml(businessName)}<br />
            <strong>Sector:</strong> ${escapeHtml(sector)}<br />
            <strong>Contact email:</strong> ${escapeHtml(contactEmail)}<br />
            <strong>Contact phone:</strong> ${escapeHtml(contactPhone)}
          </p>
          <p><a href="${escapeHtml(appUrl)}/admin" style="color: #16a34a;">Log in to view their account</a></p>
        `),
      })
    )
  );
}

/**
 * Sent when a client submits a Sender ID request with its CAC document
 * (see POST /api/sender-id/request). Includes two links: one to the
 * admin Sender ID review queue (login required), and one that goes
 * straight to the CAC document itself via the existing admin-only
 * signed-URL route (see lib/cacDocument.ts) — clicking it either opens
 * the file directly (if already logged in) or prompts login first, so
 * "review, then download, then start processing" is one or two clicks
 * from the email, not a hunt through the dashboard.
 */
export async function notifyAdminNewSenderIdRequest(params: {
  businessName: string;
  requestedName: string;
  cacNumber: string;
  sector: string;
  senderIdId: string;
  appUrl: string;
}) {
  const recipients = adminRecipients();
  if (recipients.length === 0) return { success: false, error: "ADMIN_NOTIFICATION_EMAILS not configured" };

  const { businessName, requestedName, cacNumber, sector, senderIdId, appUrl } = params;

  return Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `New Sender ID request: ${requestedName}`,
        html: wrapHtml(`
          <p>A new Sender ID request came in, with a CAC document attached for review.</p>
          <p>
            <strong>Business:</strong> ${escapeHtml(businessName)}<br />
            <strong>Requested Sender ID:</strong> ${escapeHtml(requestedName)}<br />
            <strong>CAC number:</strong> ${escapeHtml(cacNumber)}<br />
            <strong>Sector:</strong> ${escapeHtml(sector)}
          </p>
          <p><a href="${escapeHtml(appUrl)}/admin/sender-ids" style="color: #16a34a;">Log in to review the request</a></p>
          <p><a href="${escapeHtml(appUrl)}/api/admin/sender-id/${escapeHtml(senderIdId)}/cac-document" style="color: #16a34a;">Download the CAC document</a></p>
        `),
      })
    )
  );
}

/**
 * Mesaj SME's OWN carrier-approved shortCodes (not a client's) — like
 * client Sender IDs, each carrier can approve a different exact string
 * for the same brand (see SenderIdCarrierStatus in schema.prisma: "MTN/
 * Airtel/Glo/9mobile approve independently and may assign slightly
 * different shortCode strings"). Confirmed in practice: MTN approved
 * "MESAJS", the other three approved "MESAJ".
 *
 * MESAJ_WELCOME_SENDER_ID_MTN is optional — if unset, falls back to
 * MESAJ_WELCOME_SENDER_ID (the common one) so a single-shortCode setup
 * still works during initial rollout; set the MTN-specific one once
 * that approval is in hand, since sending to MTN with the wrong
 * shortCode will simply be rejected by MTN.
 */
function shortCodeForCarrier(carrier: Carrier): string | undefined {
  if (carrier === "MTN") {
    return process.env.MESAJ_WELCOME_SENDER_ID_MTN ?? process.env.MESAJ_WELCOME_SENDER_ID;
  }
  return process.env.MESAJ_WELCOME_SENDER_ID;
}

/**
 * Sent once, right after a client completes onboarding (see
 * /api/onboarding). Uses Mesaj SME's OWN carrier-approved shortCode
 * (NOT the client's — the client's Sender ID doesn't exist yet at this
 * point in the flow, that's a separate request they submit afterward),
 * picked per-carrier via shortCodeForCarrier above since MTN's approved
 * shortCode differs from the other three carriers'.
 *
 * Best-effort like every other notification here: a failure must never
 * fail onboarding, which already succeeded by the time this is called.
 * Swallows its own errors (network failure, missing config, invalid phone
 * number, Mesaj API error) and reports to Sentry instead of throwing.
 */
export async function sendWelcomeSms(params: {
  contactPhone: string;
  businessName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { contactPhone, businessName } = params;

  try {
    const { normalized, carrier, valid, reason } = normalizeNumber(contactPhone);
    if (!valid || !normalized || !carrier) {
      const error = `Invalid contactPhone for welcome SMS: ${reason ?? "unknown"}`;
      Sentry.captureMessage("Welcome SMS skipped — invalid phone number", {
        level: "warning",
        extra: { businessName, reason },
      });
      return { success: false, error };
    }

    const shortCode = shortCodeForCarrier(carrier);
    if (!shortCode) {
      // Not treated as an error — env.ts already warns at boot if the
      // common var is unset, so this would be a duplicate signal for
      // that case. Just skip quietly.
      return { success: false, error: `No welcome-SMS shortCode configured for carrier ${carrier}` };
    }

    const message = `Welcome to ${APP_NAME}, your No.1 bulk SMS service! Your account is ready — log in to request your Sender ID and start sending. Need help? support@mail.mesaj.cloud`;

    const result = await sendCarrierBatch({ message, shortCode, recipients: [normalized] });
    if (!result.success) {
      Sentry.captureMessage("Welcome SMS failed to send", {
        level: "error",
        extra: { businessName, carrier, shortCode, error: result.error },
      });
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error sending welcome SMS";
    console.error(`[welcome-sms] ${error}`);
    Sentry.captureMessage("Welcome SMS failed to send", {
      level: "error",
      extra: { businessName, error },
    });
    return { success: false, error };
  }
}
