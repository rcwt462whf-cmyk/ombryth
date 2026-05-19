import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
          padding: "56px 64px",
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
        }}
      >
        {/* Top row: logo + spacer */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#93c5fd", letterSpacing: "-0.5px" }}>
            Ombryth
          </span>
        </div>

        {/* Centre: headline + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            Ombryth
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: "#93c5fd",
              lineHeight: 1.3,
              maxWidth: 720,
            }}
          >
            Lifestyle images + affiliate captions. One click.
          </div>
        </div>

        {/* Bottom row: pills + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Model pills */}
          <div style={{ display: "flex", gap: 12 }}>
            {["DALL-E 3", "Claude", "Flux", "Gemini"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Domain */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            ombryth.io
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
