import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  // Run the after() callback immediately (and await it) so tests can
  // assert on its side effects without a separate flush step. Real
  // Next.js defers it until after the response is sent — that ordering
  // doesn't matter for what these tests check (that the right work was
  // scheduled with the right arguments).
  return { ...actual, after: vi.fn((cb: () => unknown) => cb()) };
});
vi.mock("@/lib/adminAuth", () => ({
  requireAdminApi: vi.fn(),
}));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
  rateLimitResponse: vi.fn(() => new Response(JSON.stringify({ error: "rate limited" }), { status: 429 })),
  RATE_LIMITS: { ADMIN_SEND: { limit: 30, windowMs: 60_000 } },
}));
vi.mock("@/lib/campaignSendProcessor", () => ({
  claimCampaignForSending: vi.fn(),
  processNextCampaignBatch: vi.fn(),
}));

import { POST } from "./route";
import { after } from "next/server";
import { requireAdminApi } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/rateLimit";
import { claimCampaignForSending, processNextCampaignBatch } from "@/lib/campaignSendProcessor";

const mockedRequireAdminApi = vi.mocked(requireAdminApi);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);
const mockedClaim = vi.mocked(claimCampaignForSending);
const mockedProcessNext = vi.mocked(processNextCampaignBatch);
const mockedAfter = vi.mocked(after);

const ADMIN = { id: "admin-1", role: "ADMIN" };

function mockAdminOk() {
  mockedRequireAdminApi.mockResolvedValue({ ok: true, admin: ADMIN } as never);
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.test/api/admin/campaigns/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedCheckRateLimit.mockResolvedValue({ allowed: true, limit: 30, remaining: 29, resetAt: new Date() });
  mockedClaim.mockResolvedValue({ ok: true, carrierBatchesQueued: 1 });
});

describe("POST /api/admin/campaigns/approve — access control", () => {
  it("returns the auth response for a non-admin/unauthenticated caller", async () => {
    mockedRequireAdminApi.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    } as never);

    const res = await POST(postRequest({ campaignId: "campaign-1" }));
    expect(res.status).toBe(403);
    expect(mockedClaim).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited, before touching the campaign", async () => {
    mockAdminOk();
    mockedCheckRateLimit.mockResolvedValue({ allowed: false, limit: 30, remaining: 0, resetAt: new Date() });

    const res = await POST(postRequest({ campaignId: "campaign-1" }));

    expect(res.status).toBe(429);
    expect(mockedClaim).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/campaigns/approve — delegates to claimCampaignForSending as a human reviewer", () => {
  it("calls claimCampaignForSending with the admin as both reviewer and audit actor", async () => {
    mockAdminOk();

    await POST(postRequest({ campaignId: "campaign-1" }));

    expect(mockedClaim).toHaveBeenCalledWith({
      campaignId: "campaign-1",
      reviewedByAdminId: "admin-1",
      auditActorId: "admin-1",
      auditNotesPrefix: "Approved",
    });
  });

  it("maps a claim failure straight through to the response, without scheduling a send", async () => {
    mockAdminOk();
    mockedClaim.mockResolvedValue({ ok: false, status: 409, error: "Campaign is not pending approval (status: SENT)" });

    const res = await POST(postRequest({ campaignId: "campaign-1" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/not pending approval/);
    expect(mockedAfter).not.toHaveBeenCalled();
    expect(mockedProcessNext).not.toHaveBeenCalled();
  });

  it("on success: schedules the send chain via after() and returns 202 without waiting for it", async () => {
    mockAdminOk();
    mockedClaim.mockResolvedValue({ ok: true, carrierBatchesQueued: 2 });

    const res = await POST(postRequest({ campaignId: "campaign-1" }));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body.status).toBe("APPROVED");
    expect(body.sending).toBe(true);
    expect(body.carrierBatchesQueued).toBe(2);
    expect(mockedAfter).toHaveBeenCalledWith(expect.any(Function));
    expect(mockedProcessNext).toHaveBeenCalledWith("campaign-1");
  });
});
