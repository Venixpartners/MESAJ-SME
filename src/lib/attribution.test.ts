import { describe, it, expect } from "vitest";
import { parseAttribution, serializeAttribution, deserializeAttribution } from "./attribution";

function params(query: string) {
  return new URLSearchParams(query);
}

describe("parseAttribution", () => {
  it("picks up utm tags", () => {
    expect(parseAttribution(params("utm_source=facebook&utm_medium=cpc&utm_campaign=lagos_smes"))).toEqual({
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "lagos_smes",
    });
  });

  it("records a Facebook click ID", () => {
    expect(parseAttribution(params("fbclid=ABC123"))).toEqual({ adClickId: "ABC123" });
  });

  it("keeps only the first click ID when several arrive", () => {
    expect(parseAttribution(params("fbclid=FB&gclid=GOOGLE"))).toEqual({ adClickId: "FB" });
  });

  it("returns null for a visitor who arrived with no campaign", () => {
    expect(parseAttribution(params(""))).toBeNull();
    expect(parseAttribution(params("ref=somewhere&page=2"))).toBeNull();
  });

  it("ignores empty and whitespace-only values", () => {
    expect(parseAttribution(params("utm_source=&utm_medium=%20%20"))).toBeNull();
  });

  it("caps a value that is too long to be a real campaign name", () => {
    const parsed = parseAttribution(params(`utm_campaign=${"x".repeat(500)}`));
    expect(parsed?.utmCampaign).toHaveLength(200);
  });
});

describe("deserializeAttribution", () => {
  it("round-trips what was stored", () => {
    const original = { utmSource: "instagram", adClickId: "XYZ" };
    expect(deserializeAttribution(serializeAttribution(original))).toEqual(original);
  });

  it("reads the cookie whether or not it arrives percent encoded", () => {
    const stored = serializeAttribution({ utmSource: "facebook", utmCampaign: "lagos smes" });
    expect(deserializeAttribution(encodeURIComponent(stored))).toEqual({
      utmSource: "facebook",
      utmCampaign: "lagos smes",
    });
  });

  it("returns null for junk rather than throwing", () => {
    expect(deserializeAttribution(undefined)).toBeNull();
    expect(deserializeAttribution("not json")).toBeNull();
    expect(deserializeAttribution("[]")).toBeNull();
    expect(deserializeAttribution("null")).toBeNull();
    expect(deserializeAttribution("{}")).toBeNull();
  });

  it("drops keys nobody asked for, since the cookie is user writable", () => {
    const hostile = JSON.stringify({ utmSource: "facebook", isAdmin: true, walletBalance: 999999 });
    expect(deserializeAttribution(hostile)).toEqual({ utmSource: "facebook" });
  });

  it("drops values that are not strings", () => {
    expect(deserializeAttribution(JSON.stringify({ utmSource: 42, utmMedium: "cpc" }))).toEqual({ utmMedium: "cpc" });
  });
});
