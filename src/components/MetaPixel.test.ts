import { describe, it, expect } from "vitest";
import { isTracked } from "./MetaPixel";

/**
 * The pixel must never load on a signed-in page. Those URLs carry tenant,
 * client and campaign IDs, and a PageView sends the whole URL to Meta.
 */
describe("Meta Pixel page scope", () => {
  it("tracks the public marketing and signup pages", () => {
    for (const path of ["/", "/login", "/signup", "/terms", "/privacy", "/forgot-password", "/auth/confirmed", "/onboarding"]) {
      expect(isTracked(path)).toBe(true);
    }
  });

  it("never tracks a client dashboard page", () => {
    for (const path of ["/dashboard", "/dashboard/wallet", "/dashboard/campaigns/abc123/report"]) {
      expect(isTracked(path)).toBe(false);
    }
  });

  it("never tracks an admin page", () => {
    for (const path of ["/admin", "/admin/clients", "/admin/clients/tenant_42"]) {
      expect(isTracked(path)).toBe(false);
    }
  });

  it("does not exclude an unrelated path that merely starts with the same letters", () => {
    expect(isTracked("/administrator-guide")).toBe(true);
    expect(isTracked("/dashboards-explained")).toBe(true);
  });
});
