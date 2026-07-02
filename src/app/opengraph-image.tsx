import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// On-brand share card: white editorial canvas, near-black ink, single scarce mint accent —
// matches the live site (see src/app/page.tsx) instead of the old FlowGen blue gradient.
const MINT = "#5fe6c4"
const INK = "#171717"
const GRAY = "#707070"
const BORDER = "#e6e6e6"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#ffffff",
          border: `1px solid ${BORDER}`,
          // faint line grid, echoing the hero — drawn with two repeating gradients
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      >
        {/* Top: wordmark with mint dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: INK, letterSpacing: "-1px" }}>
            Ombryth
          </span>
          <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: MINT }} />
        </div>

        {/* Centre: headline + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: "-3px",
              maxWidth: 900,
            }}
          >
            Turn any product into scroll-stopping content.
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 400, color: GRAY, maxWidth: 780 }}>
            AI lifestyle images + platform-ready captions. Bring your own keys.
          </div>
        </div>

        {/* Bottom: model pills + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {["DALL·E 3", "Claude", "Flux", "Seedream"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  color: INK,
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              background: MINT,
              color: "#0b3b30",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            ombryth.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
