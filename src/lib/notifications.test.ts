import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

import { notifyAdminNewSignup, notifyAdminNewSenderIdRequest } from "./notifications";
import { sendEmail } from "@/lib/email";

const mockedSendEmail = vi.mocked(sendEmail);

const ORIGINAL_ENV = process.env.ADMIN_NOTIFICATION_EMAILS;

beforeEach(() => {
  vi.clearAllMocks();
  mockedSendEmail.mockResolvedValue({ success: true });
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.ADMIN_NOTIFICATION_EMAILS;
  else process.env.ADMIN_NOTIFICATION_EMAILS = ORIGINAL_ENV;
});

describe("notifyAdminNewSignup", () => {
  it("no-ops without calling sendEmail when ADMIN_NOTIFICATION_EMAILS is unset", async () => {
    delete process.env.ADMIN_NOTIFICATION_EMAILS;

    const result = await notifyAdminNewSignup({
      businessName: "Venix",
      contactEmail: "biz@example.test",
      contactPhone: "08031234567",
      sector: "Retail",
      appUrl: "https://sms.mesaj.cloud",
    });

    expect(result).toEqual({ success: false, error: "ADMIN_NOTIFICATION_EMAILS not configured" });
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("sends one email per recipient, trimming whitespace around commas", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "femi@venixpartners.com, adewale@venixpartners.com ,  ";

    await notifyAdminNewSignup({
      businessName: "Venix",
      contactEmail: "biz@example.test",
      contactPhone: "08031234567",
      sector: "Retail",
      appUrl: "https://sms.mesaj.cloud",
    });

    expect(mockedSendEmail).toHaveBeenCalledTimes(2);
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "femi@venixpartners.com" }));
    expect(mockedSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "adewale@venixpartners.com" }));
  });

  it("includes a real login link built from appUrl, not just a generic 'check the dashboard' mention", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "admin@example.test";

    await notifyAdminNewSignup({
      businessName: "Venix",
      contactEmail: "biz@example.test",
      contactPhone: "08031234567",
      sector: "Retail",
      appUrl: "https://sms.mesaj.cloud",
    });

    const call = mockedSendEmail.mock.calls[0][0];
    expect(call.html).toContain('href="https://sms.mesaj.cloud/admin"');
  });

  it("HTML-escapes business name in the body to prevent injection via a malicious signup", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "admin@example.test";

    await notifyAdminNewSignup({
      businessName: "<img src=x onerror=alert(1)>",
      contactEmail: "biz@example.test",
      contactPhone: "08031234567",
      sector: "Retail",
      appUrl: "https://sms.mesaj.cloud",
    });

    const call = mockedSendEmail.mock.calls[0][0];
    expect(call.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(call.html).toContain("&lt;img");
  });
});

describe("notifyAdminNewSenderIdRequest", () => {
  it("no-ops without ADMIN_NOTIFICATION_EMAILS configured", async () => {
    delete process.env.ADMIN_NOTIFICATION_EMAILS;

    const result = await notifyAdminNewSenderIdRequest({
      businessName: "Venix",
      requestedName: "VENIX",
      cacNumber: "RC1234567",
      sector: "Retail",
      senderIdId: "sender-1",
      appUrl: "https://sms.mesaj.cloud",
    });

    expect(result).toEqual({ success: false, error: "ADMIN_NOTIFICATION_EMAILS not configured" });
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("includes both the review-queue link and the direct CAC document download link", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "admin@example.test";

    await notifyAdminNewSenderIdRequest({
      businessName: "Venix",
      requestedName: "VENIX",
      cacNumber: "RC1234567",
      sector: "Retail",
      senderIdId: "sender-1",
      appUrl: "https://sms.mesaj.cloud",
    });

    const call = mockedSendEmail.mock.calls[0][0];
    expect(call.html).toContain('href="https://sms.mesaj.cloud/admin/sender-ids"');
    expect(call.html).toContain('href="https://sms.mesaj.cloud/api/admin/sender-id/sender-1/cac-document"');
  });

  it("includes the requested Sender ID in the subject and the CAC number in the body", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "admin@example.test";

    await notifyAdminNewSenderIdRequest({
      businessName: "Venix",
      requestedName: "VENIX",
      cacNumber: "RC1234567",
      sector: "Retail",
      senderIdId: "sender-1",
      appUrl: "https://sms.mesaj.cloud",
    });

    const call = mockedSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("VENIX");
    expect(call.html).toContain("RC1234567");
  });

  it("sends one email per configured recipient", async () => {
    process.env.ADMIN_NOTIFICATION_EMAILS = "femi@venixpartners.com,adewale@venixpartners.com";

    await notifyAdminNewSenderIdRequest({
      businessName: "Venix",
      requestedName: "VENIX",
      cacNumber: "RC1234567",
      sector: "Retail",
      senderIdId: "sender-1",
      appUrl: "https://sms.mesaj.cloud",
    });

    expect(mockedSendEmail).toHaveBeenCalledTimes(2);
  });
});
