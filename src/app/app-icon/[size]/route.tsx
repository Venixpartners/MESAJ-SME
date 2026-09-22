import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Square icons for the web app manifest, at the two sizes Android asks for.
 *
 * public/logo.png is the symbol on its own and is taller than it is wide,
 * so it can't be handed to the manifest directly: Android would letterbox
 * it. This centres the official mark on white, the same as the light
 * avatar lockup in the brand guidelines. The mark is Mesaj Violet, so a
 * violet background would hide it completely.
 */
const ALLOWED = new Set(["192", "512"]);

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  if (!ALLOWED.has(raw)) {
    return new Response("Not found", { status: 404 });
  }
  const size = Number(raw);
  const markHeight = Math.round(size * 0.62);
  const markWidth = Math.round(markHeight * (464 / 500));

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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={symbol} width={markWidth} height={markHeight} alt="" />
        ) : (
          <span style={{ color: "#5d10ed", fontSize: size * 0.5, fontWeight: 700, fontFamily: "sans-serif" }}>M</span>
        )}
      </div>
    ),
    { width: size, height: size }
  );
}
