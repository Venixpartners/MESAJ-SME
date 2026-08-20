/**
 * Server-side input length limits.
 *
 * Why this exists: businessName, cacNumber, sector, requestedName, and
 * contactPhone were all unbounded `String` columns in Postgres, validated
 * (if at all) only via client-side `maxLength` — trivially bypassed by
 * calling the API directly. These schemas are the actual enforcement point;
 * every route that accepts these fields should parse through here.
 *
 * Limits are generous relative to realistic values (a CAC registration
 * number or business name is never actually this long) — the goal is
 * blocking abuse/mistakes, not being a tight domain-accurate validator.
 */

import { z } from "zod";
import { MAX_CONTACT_LIST_NAME_CHARS, MAX_MESSAGE_CHARS } from "./limits";
import { normalizeNumber } from "./numbers";

export const businessNameSchema = z.string().trim().min(1, "Business name is required").max(200);
export const cacNumberSchema = z.string().trim().min(1, "CAC number is required").max(32);
export const sectorSchema = z.string().trim().min(1, "Sector is required").max(100);
// Previously only checked non-empty + max length — accepted any string,
// including non-numeric text. That let garbage into Tenant.contactPhone,
// which is a real problem now that it's also used to send a welcome SMS
// right after onboarding (see lib/notifications.ts sendWelcomeSms) — a
// bad number there would just fail silently at send time instead of being
// caught here, where the person can actually correct it.
//
// Reuses normalizeNumber() — the same Nigerian-number validation every
// other phone number in this app goes through (campaign recipients,
// contact lists) — so this accepts the same range of input formats
// (leading 0, +234, 234, or bare 10-digit) rather than inventing a
// second, possibly-inconsistent phone rule.
export const contactPhoneSchema = z
  .string()
  .trim()
  .min(1, "Contact phone is required")
  .max(20)
  .refine((value) => normalizeNumber(value).valid, {
    message: "Enter a valid Nigerian phone number (e.g. 08031234567)",
  });

// Carrier-approved Sender IDs are conventionally capped at 11 alphanumeric
// characters by the telcos themselves — this isn't just a generous sanity
// ceiling, it's the actual constraint, so we enforce it here rather than
// letting a longer name reach the admin queue only to be rejected by the
// carrier later.
export const requestedNameSchema = z.string().trim().min(1, "Sender ID name is required").max(11);

export const onboardingSchema = z.object({
  businessName: businessNameSchema,
  cacNumber: cacNumberSchema,
  sector: sectorSchema,
  contactPhone: contactPhoneSchema,
});

export const senderIdRequestSchema = z.object({
  requestedName: requestedNameSchema,
  businessName: businessNameSchema,
  cacNumber: cacNumberSchema,
  sector: sectorSchema,
});

export const contactListNameSchema = z
  .string()
  .trim()
  .min(1, "List name is required")
  .max(MAX_CONTACT_LIST_NAME_CHARS, `List name is too long (max ${MAX_CONTACT_LIST_NAME_CHARS} characters)`);

export const createContactListSchema = z.object({
  name: contactListNameSchema,
  numbers: z.array(z.string()).min(1, "Add at least one number"),
});

export const savedMessageBodySchema = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(MAX_MESSAGE_CHARS, `Message is too long (max ${MAX_MESSAGE_CHARS} characters)`);

export const createSavedMessageSchema = z.object({
  body: savedMessageBodySchema,
});

/**
 * Runs a zod schema and returns either the parsed data or a flat error
 * message suitable for a 400 response — routes don't need to know about
 * zod's error shape.
 */
export function parseOrError<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  return { success: false, error: firstIssue?.message ?? "Invalid input" };
}
