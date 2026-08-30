import { ImageResponse } from "next/og";

export const alt = "Automutiny legal operations agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f4f3ef",
        color: "#171718",
        padding: "70px 78px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28 }}>
        <div
          style={{
            width: 42,
            height: 42,
            border: "3px solid #171718",
            borderRadius: 999,
          }}
        />
        <b>automutiny</b>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ color: "#7d2634", fontSize: 20, letterSpacing: 5 }}>
          HUMAN-CONTROLLED AGENTS
        </div>
        <div style={{ maxWidth: 920, fontSize: 72, lineHeight: 1.04, letterSpacing: -3 }}>
          Three legal agents. Real work. Human authority.
        </div>
      </div>
      <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#626267" }}>
        <span>Intake brief</span>
        <span>•</span>
        <span>Document routing</span>
        <span>•</span>
        <span>Stalled work</span>
      </div>
    </div>,
    size,
  );
}
