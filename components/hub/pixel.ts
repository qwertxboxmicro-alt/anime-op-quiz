// Tiny pixel-art engine: scenes drawn per pixel into a Uint32 buffer at low resolution, scaled up with image-rendering: pixelated.
// Everything is code-made and seeded, so the same seed gives the same picture on every device.

export const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dither = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// "#rrggbb" -> little-endian ABGR for Uint32Array views over ImageData.
export const c = (hex: string, a = 255) => {
  const n = parseInt(hex.slice(1), 16);
  return ((a << 24) | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
};

export class Buf {
  d: Uint32Array;
  constructor(public w: number, public h: number) {
    this.d = new Uint32Array(w * h);
  }
  set(x: number, y: number, v: number) {
    x |= 0; y |= 0;
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = v;
  }
  get(x: number, y: number) {
    return this.d[(y | 0) * this.w + (x | 0)];
  }
  rect(x: number, y: number, w: number, h: number, v: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v);
  }
  disc(cx: number, cy: number, r: number, v: number) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) this.set(cx + x, cy + y, v);
  }
  // Copies non-transparent pixels of `o` over this buffer.
  over(o: Buf) {
    const a = this.d, b = o.d;
    for (let i = 0; i < b.length; i++) if (b[i] >>> 24) a[i] = b[i];
  }
}

// Vertical gradient through colour stops, banded with ordered dither (the classic pixel-art sky).
export function bands(b: Buf, x0: number, y0: number, w: number, h: number, stops: string[]) {
  const cs = stops.map((s) => c(s));
  for (let y = 0; y < h; y++) {
    const t = (y / Math.max(1, h - 1)) * (cs.length - 1);
    const i = Math.min(cs.length - 2, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < w; x++) b.set(x0 + x, y0 + y, f > dither(x0 + x, y0 + y) ? cs[i + 1] : cs[i]);
  }
}

// 1D value noise with octaves, 0..1.
export function noise1(seed: number) {
  const r = rng(seed);
  const p = Array.from({ length: 512 }, () => r());
  const v = (x: number) => {
    const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
    return p[i & 511] * (1 - s) + p[(i + 1) & 511] * s;
  };
  return (x: number) => v(x) * 0.55 + v(x * 2.1 + 17) * 0.28 + v(x * 4.3 + 41) * 0.17;
}

// Puffy cloud: overlapping discs, light on top, cool shade underneath, flat pixel base.
export type Cloud = { x: number; y: number; puffs: [number, number, number][]; v: number };
export function makeCloud(r: () => number, x: number, y: number, size: number, v: number): Cloud {
  const n = 3 + Math.floor(r() * 4);
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const rr = Math.max(2, Math.round(size * (0.45 + r() * 0.55) * (i === Math.floor(n / 2) ? 1.25 : 1)));
    puffs.push([Math.round((i - (n - 1) / 2) * size * 0.8 + (r() - 0.5) * size * 0.4), -Math.round(rr * 0.35 + r() * 2), rr]);
  }
  return { x, y, puffs, v };
}
export function drawCloud(b: Buf, cl: Cloud, wrapW: number, light = "#ffffff", mid = "#e6eff6", shade = "#c4d7e6") {
  const L = c(light), M = c(mid), S = c(shade);
  const span = cl.puffs.reduce((m, p) => Math.max(m, Math.abs(p[0]) + p[2]), 0);
  const cx = (((cl.x + span) % (wrapW + span * 2)) + wrapW + span * 2) % (wrapW + span * 2) - span;
  for (const [px, py, pr] of cl.puffs) {
    for (let y = -pr; y <= 0; y++) for (let x = -pr; x <= pr; x++) {
      if (x * x + y * y > pr * pr + pr * 0.6) continue;
      const lit = x * -0.5 + y * -0.9;
      b.set(cx + px + x, cl.y + py + y, lit > pr * 0.35 ? L : lit > -pr * 0.25 ? M : S);
    }
  }
  // Flat underside.
  for (let x = -span + 2; x < span - 2; x++) b.set(cx + x, cl.y + 1, S);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
