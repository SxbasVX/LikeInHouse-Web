import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Like In House — Tours auténticos en Perú";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundImage:
            "linear-gradient(135deg, #3a5550 0%, #4e6e69 40%, #b8734a 100%)",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at top right, rgba(255,255,255,0.12), transparent 60%), radial-gradient(ellipse at bottom left, rgba(0,0,0,0.25), transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "rgba(255,255,255,0.75)",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 32,
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: 48,
              height: 2,
              background: "rgba(255,255,255,0.6)",
              display: "block",
            }}
          />
          Perú · Cusco · Machu Picchu
        </div>
        <div
          style={{
            color: "white",
            fontSize: 110,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -3,
            zIndex: 1,
          }}
        >
          Like In House
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 42,
            fontStyle: "italic",
            marginTop: 16,
            zIndex: 1,
          }}
        >
          Tours auténticos en Perú
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 12,
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 22,
            }}
          >
            Guías locales
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 22,
            }}
          >
            Turismo responsable
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 22,
            }}
          >
            Experiencias a medida
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
