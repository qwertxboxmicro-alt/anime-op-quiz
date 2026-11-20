// Scenes for the hub, drawn with components/hub/pixel.ts. Each scene returns a static base plus a per-frame `draw(t)`.
import { Buf, bands, c, dither, drawCloud, makeCloud, noise1, rng, type Cloud } from "./pixel";

export type Scene = { w: number; h: number; frame: (t: number) => Uint32Array; animated: boolean };

// ---------- Hero: hill country morning, windmill on the ridge ----------
export function meadow(w: number, h: number, seed = 11, mood: "day" | "dusk" = "day"): Scene {
  const r = rng(seed);
  const hz = Math.round(h * 0.6);
  const back = new Buf(w, h);
  bands(back, 0, 0, w, hz + 4, ["#4f9fd8", "#69b2e2", "#8cc6ea", "#b3daef", "#d7ecf1", "#eef6ec"]);
  // Sun with a dithered halo.
  const sx = Math.round(w * 0.8), sy = Math.round(h * 0.2), sr = Math.max(3, Math.round(h * 0.06));
  for (let y = -sr * 3; y <= sr * 3; y++) for (let x = -sr * 3; x <= sr * 3; x++) {
    const d = Math.sqrt(x * x + y * y) / sr;
    const px = sx + x, py = sy + y;
    if (py < 0 || py >= hz) continue;
    if (d <= 1) back.set(px, py, c("#fff9e3"));
    else if (d <= 1.3) back.set(px, py, c("#fff0bf"));
    else if (d <= 1.9) back.set(px, py, (1.9 - d) / 0.6 > dither(px, py) ? c("#f4f6df") : c("#cfe8f0"));
    else if (d < 3 && ((3 - d) / 1.1) * 0.5 > dither(px, py)) back.set(px, py, c("#cfe8f0"));
  }
  // Far range: blue, snow on the peaks.
  const n1 = noise1(seed + 1), n2 = noise1(seed + 2), n3 = noise1(seed + 3);
  const far = new Buf(w, h);
  for (let x = 0; x < w; x++) {
    const m = (xx: number) => n1(xx / 70) * 0.75 + Math.abs(Math.sin(xx / 23)) * 0.25;
    const top = Math.round(hz - h * (0.06 + m(x) * 0.28));
    for (let y = top; y < hz + 4; y++) {
      const snow = y < top + Math.max(1, Math.round((hz - top) * 0.25)) && hz - top > h * 0.17;
      const slope = m(x + 1) - m(x - 1);
      far.set(x, y, snow ? c(slope > 0 ? "#dfe9f2" : "#f5f9fc") : c(slope > 0 ? "#94b1cc" : "#a9c2d8"));
    }
  }
  back.over(far);
  // Morning haze over the foot of the range: dithered pale band so the far layer sits back.
  for (let y = hz - Math.round(h * 0.08); y < hz + 4; y++) {
    const k = (y - (hz - h * 0.08)) / (h * 0.08 + 4);
    for (let x = 0; x < w; x++) if (k * 0.7 > dither(x, y)) back.set(x, y, c("#d4e6ee"));
  }
  // Mid ridge (blue-green) and hills (green) with tree clusters.
  const land = new Buf(w, h);
  const ridge: number[] = [];
  for (let x = 0; x < w; x++) {
    const top = Math.round(hz - h * (0.02 + n2(x / 40) * 0.1));
    ridge.push(top);
    for (let y = top; y < h; y++) land.set(x, y, c(y < top + 2 ? "#7fae8f" : "#6a9f80"));
  }
  const hill: number[] = [];
  for (let x = 0; x < w; x++) {
    const top = Math.round(hz + h * 0.04 - h * (n3(x / 55) * 0.14) + Math.sin(x / 31) * h * 0.02);
    hill.push(top);
  }
  for (let x = 0; x < w; x++) {
    const top = hill[x];
    // Slope over a wide window, dithered, so shaded sides read as soft slopes instead of stripes.
    const slope = (hill[Math.min(w - 1, x + 4)] - hill[Math.max(0, x - 4)]) / 8;
    const shade = Math.max(0, Math.min(1, 0.5 + slope * 1.5));
    for (let y = top; y < h; y++) {
      const k = (y - top) / (h - top);
      const d = dither(x, y);
      land.set(x, y, y === top ? c("#8acb62") : k * 1.2 > d + 0.5 ? c("#58983f") : shade > d + 0.25 ? c("#62a54a") : c("#6fb352"));
    }
  }
  // Tree clumps on the hills: round canopies, light from the upper right (the sun).
  const trees = Math.round(w / 9);
  for (let i = 0; i < trees; i++) {
    const tx = Math.floor(r() * w);
    const ty = hill[tx] + 1 + Math.floor(r() * 3);
    const tr = 2 + Math.floor(r() * 3);
    for (let y = -tr; y <= tr; y++) for (let x = -tr; x <= tr; x++) {
      if (x * x + y * y > tr * tr + 1) continue;
      const lit = x * 0.6 - y * 0.8;
      land.set(tx + x, ty + y - tr, c(lit > tr * 0.5 ? "#7cc05a" : lit > -tr * 0.3 ? "#4b8f3d" : "#36722f"));
    }
    land.set(tx, ty + 1, c("#5b3f2a"));
  }
  // Near meadow: brighter band in front, flowers and tufts, winding path to the windmill.
  const meadowTop = Math.round(h * 0.78);
  const n4 = noise1(seed + 4);
  for (let x = 0; x < w; x++) {
    const top = Math.round(meadowTop + (n4(x / 30) - 0.5) * h * 0.06);
    for (let y = top; y < h; y++) {
      const k = (y - top) / (h - top);
      land.set(x, y, y === top ? c("#a3dc6e") : k > dither(x, y) + 0.35 ? c("#6eb64c") : c("#86cb5c"));
    }
  }
  // Path: from bottom centre-left up to the windmill hill.
  const mx = Math.round(w * (w < 160 ? 0.86 : 0.74)); // phones: keep the windmill clear of the title
  for (let y = h - 1; y > hill[mx] + 2; y--) {
    const k = (h - y) / (h - hill[mx]);
    const cx = Math.round(w * 0.42 + (mx - w * 0.42) * k + Math.sin(k * 5) * w * 0.03);
    const half = Math.max(0, Math.round((1 - k) * w * 0.03));
    for (let x = -half - 1; x <= half + 1; x++) land.set(cx + x, y, c(Math.abs(x) > half ? "#b8915a" : (x + y) % 7 === 0 ? "#c9a46a" : "#dcbc83"));
  }
  const fl = ["#ff8fb3", "#ffe27a", "#ffffff", "#ffb35c"].map((s) => c(s));
  for (let i = 0; i < w * 0.9; i++) {
    const x = Math.floor(r() * w), y = meadowTop + Math.floor(r() * (h - meadowTop));
    if (land.get(x, y) === c("#dcbc83")) continue;
    if (r() < 0.55) { land.set(x, y, c("#4f9a3a")); land.set(x, y - 1, c("#4f9a3a")); }
    else land.set(x, y, fl[Math.floor(r() * fl.length)]);
  }
  // Big oak on the far left, framing.
  const ox = Math.round(w * 0.05), og = h - 2, ocr = Math.round(h * 0.2);
  for (let y = og - Math.round(h * 0.42); y < og; y++) for (let x = -2; x <= 2; x++) land.set(ox + x, y, c(x === 2 ? "#4a2f1d" : x < 0 ? "#7a5233" : "#62412a"));
  // Canopy: many small leaf clumps around a big mass, each lit from the upper right, so it reads as foliage not a polygon.
  const crown = { x: ox + Math.round(ocr * 0.15), y: og - Math.round(h * 0.52), rx: ocr * 1.15, ry: h * 0.27 };
  const clumps: [number, number, number][] = [];
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    clumps.push([crown.x + Math.cos(a) * crown.rx * d, crown.y + Math.sin(a) * crown.ry * d, Math.max(2, Math.round(ocr * (0.18 + r() * 0.2)))]);
  }
  clumps.sort((p, q) => p[1] - q[1] || p[0] - q[0]);
  // Back to front by height: lower clumps are shadowed, top ones catch the light.
  for (const [cx0, cy0, rr] of clumps) {
    const cx = Math.round(cx0), cy = Math.round(cy0);
    const depth = (cy - (crown.y - crown.ry)) / (crown.ry * 2);
    for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) {
      if (x * x + y * y > rr * rr + rr * 0.5) continue;
      const lit = (x * 0.7 - y * 0.7) / rr - depth * 0.9;
      land.set(cx + x, cy + y, c(lit > 0.35 ? "#8fcf5f" : lit > -0.15 ? "#5aa443" : lit > -0.65 ? "#3f8538" : "#2c6229"));
    }
  }
  // Branches peeking out under the crown.
  for (let k = 0; k < 6; k++) land.set(ox + 3 + k, og - Math.round(h * 0.3) - Math.round(k * 0.6), c("#62412a"));
  back.over(land);
  // Windmill body (blades are animated).
  const wy = hill[mx] - 1;
  const wh = Math.max(8, Math.round(h * 0.16));
  for (let y = 0; y < wh; y++) {
    const half = Math.round(2 + (y / wh) * 2);
    for (let x = -half; x <= half; x++) back.set(mx + x, wy - wh + y, c(x > half - 2 ? "#c7b9a6" : "#efe6d6"));
  }
  for (let x = -3; x <= 3; x++) for (let y = 0; y < 3; y++) back.set(mx + x, wy - wh - 2 + y, c(y === 0 ? "#d9584d" : "#b8463d"));
  back.set(mx, wy - 3, c("#6b4a2c")); back.set(mx, wy - 2, c("#6b4a2c")); back.set(mx, wy - 1, c("#6b4a2c"));
  const hub = { x: mx, y: wy - wh + 1 };

  // Moving bits.
  const clouds: Cloud[] = Array.from({ length: Math.max(3, Math.round(w / 70)) }, (_, i) =>
    makeCloud(r, (i / 3.2) * w + r() * 40, Math.round(h * (0.08 + r() * 0.28)), Math.round(h * (0.03 + r() * 0.035)), 0.4 + r() * 0.6),
  );
  const cloudLayer = new Buf(w, h);
  const out = new Buf(w, h);
  const blade = c("#f7f1e6"), bladeS = c("#a58f74");
  const birds = Array.from({ length: 3 }, () => ({ x: r() * w, y: h * (0.12 + r() * 0.2), v: 2 + r() * 2 }));
  // Post pass, precomputed: per-pixel multipliers for a corner vignette and (dusk) a sky-to-ground colour grade.
  const mul = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.45) * 2;
    const v = Math.max(0, Math.hypot(dx * 0.85, dy * 0.7) - 0.75) * 0.9;
    const dark = v > dither(x, y) * 0.5 ? 0.78 : 1;
    let r = dark, g = dark, b = dark;
    if (mood === "dusk") {
      const k = y / h;
      r *= 0.7 + k * 0.22; g *= 0.5 + k * 0.14; b *= 0.82 + k * 0.05;
      if (y < hz) { r += 0.12; b += 0.08; }
    }
    mul[i] = r; mul[i + 1] = g; mul[i + 2] = b;
  }
  const grade = (d: Uint32Array) => {
    for (let i = 0; i < d.length; i++) {
      const v = d[i], j = i * 3;
      const R = Math.min(255, (v & 255) * mul[j]), G = Math.min(255, ((v >> 8) & 255) * mul[j + 1]), B = Math.min(255, ((v >> 16) & 255) * mul[j + 2]);
      d[i] = 0xff000000 | (B << 16) | (G << 8) | R;
    }
  };
  const tufts = Array.from({ length: Math.round(w / 3) }, (_, i) => ({ x: i * 3 + Math.floor(r() * 3), h: 2 + Math.floor(r() * 3), p: r() * 6 }));

  return {
    w, h, animated: true,
    frame(t) {
      cloudLayer.d.fill(0);
      for (const cl of clouds) drawCloud(cloudLayer, { ...cl, x: cl.x + t * cl.v }, w);
      out.d.set(back.d);
      // Clouds sit in the sky only (behind mountains): paint where the base is still sky.
      const sky = Math.round(h * 0.6);
      for (let i = 0; i < w * sky; i++) if (cloudLayer.d[i] >>> 24 && far.d[i] >>> 24 === 0 && land.d[i] >>> 24 === 0) out.d[i] = cloudLayer.d[i];
      // Windmill blades: 4 arms, ~1 turn per 8s.
      const a = t * 0.8;
      const L = Math.round(wh * 0.75);
      // Each arm: a dark spar plus a lattice sail two pixels wide on its trailing side.
      for (let k = 0; k < 4; k++) {
        const ang = a + (k * Math.PI) / 2;
        const px = Math.cos(ang + 1.57), py = Math.sin(ang + 1.57);
        for (let s = 1; s <= L; s++) {
          const x = hub.x + Math.cos(ang) * s, y = hub.y + Math.sin(ang) * s;
          if (s > 2) for (let q = 1; q <= 3; q++) out.set(x + px * q, y + py * q, (s + q) % 3 === 0 ? bladeS : blade);
          out.set(x, y, bladeS);
        }
      }
      out.set(hub.x, hub.y, c("#5a3b25"));
      // Birds: two-pixel wings that flap.
      for (const b of birds) {
        const x = ((b.x + t * b.v) % (w + 20)) - 10, y = b.y + Math.sin(t * 0.7 + b.x) * 2;
        const up = Math.sin(t * 9 + b.x) > 0;
        const v = c("#2f4a63");
        out.set(x, y, v);
        out.set(x - 1, y + (up ? -1 : 0), v); out.set(x + 1, y + (up ? -1 : 0), v);
        out.set(x - 2, y + (up ? -1 : 1), v); out.set(x + 2, y + (up ? -1 : 1), v);
      }
      // Foreground grass blades swaying along the bottom edge.
      const g1 = c("#4f9a3a"), g2 = c("#79c04f");
      for (const g of tufts) {
        const sway = Math.round(Math.sin(t * 1.6 + g.p + g.x * 0.15) * 0.8);
        for (let k = 0; k < g.h; k++) out.set(g.x + (k === g.h - 1 ? sway : 0), h - 1 - k, k === g.h - 1 ? g2 : g1);
      }
      grade(out.d);
      return out.d;
    },
  };
}

// ---------- Thumbnails (static) ----------

function skyline(b: Buf, r: () => number, base: number, color: number, win: number[], minH: number, maxH: number) {
  for (let x = 0; x < b.w; ) {
    const bw = 4 + Math.floor(r() * 7), bh = minH + Math.floor(r() * (maxH - minH));
    b.rect(x, base - bh, bw, bh, color);
    if (win.length) for (let y = base - bh + 2; y < base - 1; y += 3) for (let wx = x + 1; wx < x + bw - 1; wx += 2) if (r() < 0.35) b.set(wx, y, win[Math.floor(r() * win.length)]);
    x += bw + (r() < 0.3 ? 1 : 0);
  }
}

// OP Quiz (kikoe): dusk city, a giant cassette tape floating over the skyline.
// Variants: 0 daily (dusk), 1 endless (night), 2 90s (amber), 3 00s (teal), 4 10s (rose), 5 20s (violet), 6 endings (deep blue).
const OPQ_SKY = [
  ["#1b1f4a", "#3b2a63", "#6e3a72", "#b4506e", "#f08a5d", "#ffc27a"],
  ["#060a1c", "#0d1533", "#15214a", "#1e2f5e", "#2b4272", "#3d5a86"],
  ["#2a1608", "#4a2510", "#7a3c14", "#b8621c", "#e59a3a", "#ffd27a"],
  ["#062226", "#0b3a40", "#12575c", "#1d7d78", "#3aa894", "#8fe0c0"],
  ["#2a0c22", "#4a1638", "#7a2552", "#b4416e", "#e47a96", "#ffc2cf"],
  ["#120a2e", "#22124e", "#3a1c78", "#5a2aa0", "#8a52d0", "#c8a0ff"],
  ["#03081a", "#081433", "#0f2252", "#183474", "#25509a", "#4a7cc4"],
];
const OPQ_LABEL = ["#ff4f7b", "#4fe3f0", "#ffb000", "#3ad6b0", "#ff7aa8", "#b98cf0", "#7fb2ff"];
export function thumbOpQuiz(w: number, h: number, variant = 0): Scene {
  const r = rng(5 + variant * 7);
  const b = new Buf(w, h);
  bands(b, 0, 0, w, h, OPQ_SKY[variant % OPQ_SKY.length]);
  for (let i = 0; i < w / 3; i++) b.set(r() * w, r() * h * 0.4, c(r() < 0.5 ? "#ffffff" : "#c9c4ff"));
  skyline(b, r, Math.round(h * 0.86), c("#4a2b55"), [], Math.round(h * 0.18), Math.round(h * 0.4));
  skyline(b, r, h, c("#24183a"), ["#ffd27a", "#ff9fb8", "#8fe8ff"].map((s) => c(s)), Math.round(h * 0.12), Math.round(h * 0.34));
  // Cassette.
  const cw = Math.round(w * 0.44), ch = Math.round(cw * 0.62), cx = Math.round(w * 0.5 - cw / 2), cy = Math.round(h * 0.18);
  b.rect(cx + 1, cy + ch, cw, 2, c("#1a1030"));
  b.rect(cx, cy, cw, ch, c("#f2ead8"));
  b.rect(cx, cy, cw, 1, c("#ffffff"));
  b.rect(cx + cw - 1, cy, 1, ch, c("#c9bea6"));
  b.rect(cx, cy + ch - 1, cw, 1, c("#c9bea6"));
  b.rect(cx + 3, cy + 3, cw - 6, Math.round(ch * 0.22), c(OPQ_LABEL[variant % OPQ_LABEL.length]));
  b.rect(cx + 3, cy + 3 + Math.round(ch * 0.22), cw - 6, 2, c("#ffb000"));
  const wy = cy + Math.round(ch * 0.4), ww = cw - 14;
  b.rect(cx + 7, wy, ww, Math.round(ch * 0.32), c("#2a2140"));
  const rr = Math.max(2, Math.round(ch * 0.12));
  for (const fx of [0.3, 0.7]) {
    const rx = cx + Math.round(cw * fx), ry = wy + Math.round(ch * 0.16);
    b.disc(rx, ry, rr, c("#f2ead8"));
    b.disc(rx, ry, Math.max(1, rr - 2), c("#6b5a8a"));
    b.set(rx, ry, c("#f2ead8"));
  }
  b.rect(cx + Math.round(cw * 0.3) + rr, wy + Math.round(ch * 0.16), Math.round(cw * 0.4) - rr * 2 + 1, 1, c("#8a6a4a"));
  b.rect(cx + Math.round(cw * 0.25), cy + ch - Math.round(ch * 0.14), Math.round(cw * 0.5), Math.round(ch * 0.14), c("#d9cfb8"));
  // Music notes.
  const note = (x: number, y: number, col: number) => { b.rect(x, y, 2, 2, col); b.rect(x + 1, y - 5, 1, 5, col); b.rect(x + 2, y - 5, 2, 1, col); };
  note(cx - 8, cy + 8, c("#8fe8ff"));
  note(cx + cw + 5, cy + 4, c("#ffd27a"));
  note(cx + cw + 9, cy + ch - 2, c("#ff9fb8"));
  return { w, h, animated: false, frame: () => b.d };
}

// Skidmark: desert highway at sunset, tyre marks swerving off into the sand.
export function thumbSkidmark(w: number, h: number): Scene {
  const r = rng(9);
  const b = new Buf(w, h);
  const hz = Math.round(h * 0.45);
  bands(b, 0, 0, w, hz, ["#ff7a59", "#ff9a5c", "#ffc06b", "#ffe0a0"]);
  b.disc(Math.round(w * 0.22), Math.round(hz * 0.42), Math.round(h * 0.1), c("#fff2c4"));
  b.disc(Math.round(w * 0.22), Math.round(hz * 0.42), Math.round(h * 0.1) - 2, c("#fffbe6"));
  // Mesas.
  const n = noise1(4);
  for (let x = 0; x < w; x++) {
    const flat = n(x / 18) > 0.52;
    const top = hz - (flat ? Math.round(h * 0.16) : Math.round(h * 0.04 * n(x / 7)));
    for (let y = top; y < hz; y++) b.set(x, y, c(y < top + 2 ? "#c8573f" : "#9b3f36"));
  }
  bands(b, 0, hz, w, h - hz, ["#f0b06a", "#e39a55", "#d4884a"]);
  // Road in perspective.
  for (let y = hz; y < h; y++) {
    const k = (y - hz) / (h - hz);
    const half = Math.round(2 + k * w * 0.36), cx = Math.round(w * 0.55 - k * w * 0.08);
    for (let x = -half; x <= half; x++) b.set(cx + x, y, c(Math.abs(x) >= half - 1 ? "#e9e0cf" : "#3a3440"));
    if (Math.floor(k * 14) % 2 === 0) b.set(cx, y, c("#ffd24a"));
  }
  // Skid marks: two curving lines leaving the road.
  for (let s = 0; s < 2; s++) for (let i = 0; i < 70; i++) {
    const k = i / 70;
    const x = Math.round(w * 0.45 + s * 5 - Math.sin(k * 3.1) * w * 0.3 - k * w * 0.1);
    const y = Math.round(h * 0.98 - k * h * 0.4);
    b.rect(x, y, 3, 2, c("#1c1820")); b.set(x + 3, y, c("#5a4a52"));
  }
  for (let i = 0; i < w / 2; i++) b.set(r() * w, hz + 2 + r() * (h - hz), c("#c27a40"));
  // Cactus.
  const kx = Math.round(w * 0.86), ky = Math.round(h * 0.82);
  b.rect(kx, ky - 12, 3, 12, c("#3f8a4a")); b.rect(kx - 3, ky - 8, 3, 2, c("#3f8a4a")); b.rect(kx - 3, ky - 11, 2, 3, c("#3f8a4a"));
  b.rect(kx + 3, ky - 6, 3, 2, c("#3f8a4a")); b.rect(kx + 4, ky - 9, 2, 3, c("#3f8a4a")); b.rect(kx + 2, ky - 12, 1, 12, c("#2d6a38"));
  return { w, h, animated: false, frame: () => b.d };
}

// Racer (working title): top-down circuit on grass, chequered start line, three tiny cars.
export function thumbRacer(w: number, h: number): Scene {
  const r = rng(21);
  const b = new Buf(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b.set(x, y, c(((x >> 3) + (y >> 3)) % 2 ? "#5fae48" : "#67b84f"));
  const cx = w / 2, cy = h / 2, ax = w * 0.38, ay = h * 0.32;
  const onTrack = (x: number, y: number, pad: number) => {
    const d = Math.hypot((x - cx) / (ax + pad), (y - cy) / (ay + pad));
    const d2 = Math.hypot((x - cx) / (ax - 9 - pad), (y - cy) / (ay - 9 - pad));
    return d <= 1 && d2 >= 1;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (onTrack(x, y, 2) && !onTrack(x, y, 0)) b.set(x, y, c(((Math.atan2(y - cy, x - cx) * 12) | 0) % 2 ? "#ffffff" : "#e8433c"));
    else if (onTrack(x, y, 0)) b.set(x, y, c("#4a4a55"));
  }
  for (let y = Math.round(cy + ay - 9); y < cy + ay + 1; y++) for (let x = Math.round(cx - 3); x < cx + 3; x++) b.set(x, y, c(((x + y) & 1) ? "#111111" : "#ffffff"));
  const car = (x: number, y: number, col: string) => {
    b.rect(x + 1, y - 1, 2, 1, c("#111111")); b.rect(x + 6, y - 1, 2, 1, c("#111111")); b.rect(x + 1, y + 4, 2, 1, c("#111111")); b.rect(x + 6, y + 4, 2, 1, c("#111111"));
    b.rect(x, y, 9, 4, c(col)); b.rect(x + 5, y + 1, 2, 2, c("#cfe8ff")); b.rect(x + 8, y + 1, 1, 2, c("#fff3b0"));
  };
  car(Math.round(cx + 8), Math.round(cy + ay - 7), "#ff4f7b");
  car(Math.round(cx - 24), Math.round(cy + ay - 5), "#4fe3f0");
  car(Math.round(cx - ax * 0.6), Math.round(cy - ay + 1), "#ffd24a");
  // Trees and a grandstand.
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h;
    if (onTrack(x, y, 4)) continue;
    b.disc(x, y, 2, c("#2f7a33")); b.set(x - 1, y - 1, c("#58a64a"));
  }
  // Grandstand above the back straight, pit building in the infield.
  const gy = Math.round(cy - ay - 9);
  b.rect(Math.round(cx - 24), gy, 48, 6, c("#d9d2c2"));
  b.rect(Math.round(cx - 24), gy, 48, 1, c("#8a8478"));
  for (let x = 0; x < 46; x++) for (let y = 1; y < 5; y++) if ((x + y) % 2 === 0) b.set(Math.round(cx - 23 + x), gy + y, c(["#ff8fb3", "#8fd3ff", "#ffd24a", "#ffffff"][Math.floor(r() * 4)]));
  b.rect(Math.round(cx - 14), Math.round(cy - 3), 28, 6, c("#e9e4d8"));
  b.rect(Math.round(cx - 14), Math.round(cy + 3), 28, 1, c("#9a9384"));
  for (let x = 0; x < 6; x++) b.rect(Math.round(cx - 12 + x * 4), Math.round(cy - 1), 2, 2, c("#3b4a63"));
  return { w, h, animated: false, frame: () => b.d };
}

export const SCENES = {
  meadow: (w: number, h: number) => meadow(w, h),
  dusk: (w: number, h: number) => meadow(w, h, 23, "dusk"),
  "op-quiz": thumbOpQuiz,
  skidmark: (w: number, h: number) => thumbSkidmark(w, h),
  racer: (w: number, h: number) => thumbRacer(w, h),
} satisfies Record<string, (w: number, h: number, variant?: number) => Scene>;
export type SceneId = keyof typeof SCENES;
