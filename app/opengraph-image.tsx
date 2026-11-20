import { ImageResponse } from "next/og";

export const alt = "Hibidle: daily games in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Flat pixel-style card: sky bands, a hill line and the title. No external fonts or images.
export default function Image() {
  const sky = ["#4f9fd8", "#69b2e2", "#8cc6ea", "#b3daef", "#d7ecf1"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", background: "#0b1420" }}>
        {sky.map((c) => <div key={c} style={{ display: "flex", height: 72, background: c, width: "100%" }} />)}
        <div style={{ display: "flex", flex: 1, background: "#6fb352", borderTop: "16px solid #8acb62" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 170, fontWeight: 800, color: "#fff8ef", letterSpacing: 6, textShadow: "10px 10px 0 #ff4f7b" }}>HIBIDLE</div>
          <div style={{ display: "flex", fontSize: 40, color: "#eef4fb", background: "#0b1420cc", padding: "10px 28px" }}>Daily games · one account</div>
        </div>
      </div>
    ),
    size,
  );
}
