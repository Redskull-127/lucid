import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "lucid: one shared dream for every Claude";

// The icon doesn't depend on the request, so read it once.
const iconSrc = `data:image/png;base64,${await readFile(join(process.cwd(), "public/icon.png"), "base64")}`;

/** The social card: the icon on the night sky, with the name and tagline. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          color: "#ece9ff",
          backgroundColor: "#0e0a28",
          backgroundImage:
            "radial-gradient(circle at 80% 0%, rgba(143,107,255,0.45), transparent 55%), radial-gradient(circle at 0% 100%, rgba(59,29,147,0.7), transparent 55%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
        <img src={iconSrc} width={300} height={300} alt="" style={{ borderRadius: 64 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>lucid</div>
          <div style={{ marginTop: 28, fontSize: 48, lineHeight: 1.15, letterSpacing: -1 }}>
            One shared dream for every Claude
          </div>
          <div
            style={{
              marginTop: 32,
              height: 6,
              width: 220,
              borderRadius: 3,
              backgroundImage: "linear-gradient(90deg, #6ff3ff, #a98bff, #ff6fc4)",
            }}
          />
          <div style={{ marginTop: 32, fontSize: 28, color: "#aaa4d6" }}>A plugin for Claude Code</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
