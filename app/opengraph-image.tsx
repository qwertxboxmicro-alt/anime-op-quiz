import { ImageResponse } from "next/og";

export const alt = "OPspot: guess the anime opening in 0.1 seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#070a08", color: "#eaf2ec" }}>
        <div style={{ display: "flex", fontSize: 180, fontWeight: 800, fontStyle: "italic" }}>
          OP<span style={{ color: "#22e06b" }}>spot</span>
        </div>
        <div style={{ fontSize: 44, color: "#8a9a90" }}>Guess the anime opening in 0.1 seconds</div>
      </div>
    ),
    size,
  );
}
