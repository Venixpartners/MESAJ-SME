import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRICE_PER_SMS } from "@/lib/pricing";
import { SITE_NAME } from "@/lib/site";

/**
 * The card people see when a Mesaj link is pasted into WhatsApp, Facebook,
 * Instagram, LinkedIn, X or Slack. Generated rather than shipped as a flat
 * file so the price on it can never drift from pricing.ts.
 *
 * The mark is the official artwork read off disk at build time, not a
 * redrawn copy (brand guidelines: never rebuild the logo).
 *
 * The price is written as the word Naira rather than the sign: image
 * generation uses a system font that has no glyph for it, and a missing
 * glyph renders as an empty box on the card people actually see.
 */
export const alt = `${SITE_NAME}: bulk SMS for Nigerian businesses`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function symbolDataUri(): string | null {
  try {
    const file = readFileSync(join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    // A missing file must degrade to a text only card, never a broken build.
    return null;
  }
}

export default async function OpengraphImage() {
  const symbol = symbolDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#141618",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {symbol ? (
             
            <img src={symbol} width={64} height={69} alt="" />
          ) : null}
          <span style={{ color: "white", fontSize: 34, fontWeight: 600 }}>{SITE_NAME}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "white", fontSize: 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
            Text every customer you have,
          </span>
          <span style={{ color: "#be9ff8", fontSize: 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
            for {PRICE_PER_SMS} Naira each.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 28 }}>
            MTN, Airtel, Glo and 9mobile. No developer, no contract.
          </span>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 24 }}>sms.mesaj.cloud</span>
        </div>
      </div>
    ),
    size
  );
}
