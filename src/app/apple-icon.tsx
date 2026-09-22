import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Home screen icon for iPhone and iPad. iOS does not round or pad for you,
 * so the mark sits on white with its own clear space, matching the light
 * square avatar lockup in the brand guidelines. The mark is Mesaj Violet,
 * so it needs a light background to be visible at all.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  let symbol: string | null = null;
  try {
    symbol = `data:image/png;base64,${readFileSync(join(process.cwd(), "public", "logo.png")).toString("base64")}`;
  } catch {
    symbol = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {symbol ? (
           
          <img src={symbol} width={104} height={112} alt="" />
        ) : (
          <span style={{ color: "#5d10ed", fontSize: 76, fontWeight: 700, fontFamily: "sans-serif" }}>M</span>
        )}
      </div>
    ),
    size
  );
}
