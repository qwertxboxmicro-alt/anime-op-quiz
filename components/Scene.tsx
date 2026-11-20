"use client";
// Background: pixel-art town at dusk, drawn in code at low resolution and scaled up (image-rendering: pixelated).
// ~15fps, pauses when the tab is hidden. prefers-reduced-motion keeps only slow ambient drift (clouds, stars, windows): no train, birds or petals.
import { useEffect, useRef } from "react";

const SKY = ["#0b1222", "#121a30", "#1c2038", "#2c2540", "#462b45", "#6a3346", "#93403f", "#bd5a3a", "#de7c3c"];
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

type Win = { x: number; y: number; k: number };
type Bldg = { x: number; w: number; h: number; step: number; ant: number };
type House = { x: number; w: number; h: number; roof: number };
type Cloud = { x: number; y: number; w: number; v: number; front: boolean };
type Petal = { x: number; y: number; vx: number; vy: number; p: number; c: string };

function makeWorld(W: number, H: number) {
  const r = rng(7);
  const hz = Math.round(H * 0.76);
  const stars = Array.from({ length: Math.round(W / 6) }, () => ({ x: r() * W, y: r() * hz * 0.5, p: r() * 6, b: r() }));
  const mount: number[] = [];
  for (let x = 0, h = 0.05; x < W; x++) {
    h += (r() - 0.5) * 0.012;
    h = Math.min(0.1, Math.max(0.02, h));
    mount.push(Math.round(h * H + Math.sin(x / 37) * 3));
  }
  const bldgs: Bldg[] = [];
  const wins: Win[] = [];
  for (let x = -4; x < W; ) {
    const w = 8 + Math.floor(r() * 14);
    const h = Math.round(H * (0.03 + r() * (r() < 0.15 ? 0.16 : 0.08)));
    bldgs.push({ x, w, h, step: r() < 0.35 ? Math.round(h * (0.15 + r() * 0.2)) : 0, ant: r() < 0.25 ? 3 + Math.floor(r() * 6) : 0 });
    for (let wy = hz - h + 3; wy < hz - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) wins.push({ x: wx, y: wy, k: r() });
    x += w + (r() < 0.3 ? 2 : 0);
  }
  const far = Array.from({ length: Math.ceil(W / 10) }, (_, i) => ({ x: i * 10 + Math.floor(r() * 4), w: 6 + Math.floor(r() * 9), h: Math.round(H * (0.05 + r() * 0.1)) }));
  const ground = Math.round(H * 0.92);
  const houses: House[] = [];
  for (let x = -10; x < W; ) {
    const w = 22 + Math.floor(r() * 26);
    houses.push({ x, w, h: Math.round(H * (0.05 + r() * 0.06)), roof: 4 + Math.floor(r() * 6) });
    x += w + Math.floor(r() * 6);
  }
  const hwins: Win[] = houses.flatMap((h) => (r() < 0.6 ? [{ x: h.x + 5 + Math.floor(r() * (h.w - 12)), y: ground - h.h + 4 + Math.floor(r() * (h.h - 10)), k: r() }] : []));
  const clouds: Cloud[] = Array.from({ length: 9 }, (_, i) => ({ x: r() * W * 1.4, y: hz * (0.12 + r() * 0.55), w: 26 + r() * 50, v: 2 + r() * 3.5, front: i % 3 === 0 }));
  const petals: Petal[] = Array.from({ length: Math.round(W / 9) }, () => ({ x: r() * W, y: r() * H, vx: -8 - r() * 10, vy: 7 + r() * 9, p: r() * 6, c: r() < 0.5 ? "#ffb7cf" : "#f48fb1" }));
  const trees = [0.3, 0.63, 0.97].map((f) => {
    const R = Math.round(H * 0.06 * (0.8 + r() * 0.5));
    // Canopy = cluster of puffs around the crown, each with dark/mid/light tone.
    const puffs = Array.from({ length: 9 }, () => ({ dx: (r() - 0.5) * R * 2.4, dy: (r() - 0.6) * R * 1.1, rx: R * (0.45 + r() * 0.35), ry: R * (0.35 + r() * 0.25) }));
    return { x: Math.round(W * f), R, puffs };
  });
  const poles = [0.12, 0.47, 0.86].map((f) => Math.round(W * f));
  return { hz, ground, rail: Math.round(H * 0.855), stars, mount, far, bldgs, wins, houses, hwins, clouds, petals, poles, trees };
}

export default function Scene() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, world = makeWorld(1, 1), raf = 0, last = 0;
    const t0 = performance.now();

    const resize = () => {
      W = innerWidth < 700 ? 240 : 480;
      H = Math.max(160, Math.round((W * innerHeight) / innerWidth));
      c.width = W;
      c.height = H;
      world = makeWorld(W, H);
    };

    const rect = (x: number, y: number, w: number, h: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };

    // Filled pixel ellipse, row by row (top half only when flat=true).
    const blob = (cx: number, cy: number, rx: number, ry: number, col: string, flat = false) => {
      for (let dy = -ry; dy <= (flat ? 0 : ry); dy++) {
        const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
        rect(cx - half, cy + dy, half * 2, 1, col);
      }
    };
    // Puffy cloud: lit underside, body, two puffs on top.
    const cloud = (cl: Cloud) => {
      const { x, y, w } = cl;
      const h = Math.max(3, Math.round(w / 9));
      const [body, top, lit] = cl.front ? ["#6a3447", "#7d3c4c", "#d8724a"] : ["#43293f", "#4f2d45", "#94464a"];
      blob(x + w * 0.5, y + 1, w * 0.5, h + 1, lit, true);
      blob(x + w * 0.5, y, w * 0.5, h, body, true);
      blob(x + w * 0.32, y - h * 0.6, w * 0.2, h, top, true);
      blob(x + w * 0.6, y - h * 0.9, w * 0.24, h * 1.4, top, true);
    };

    const draw = (t: number, dt: number) => {
      const { hz, ground, rail } = world;
      // Sky: stepped bands with a checker dither between them.
      const bh = hz / SKY.length;
      SKY.forEach((col, i) => rect(0, i * bh, W, bh + 1, col));
      for (let i = 1; i < SKY.length; i++) {
        g.fillStyle = SKY[i];
        const y = Math.round(i * bh) - 2;
        for (let x = 0; x < W; x += 2) {
          g.fillRect(x, y, 1, 1);
          g.fillRect(x + 1, y + 1, 1, 1);
        }
      }
      for (const s of world.stars) {
        g.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 0.6 + s.p)) * s.b;
        rect(s.x, s.y, 1, 1, "#fff3dc");
      }
      g.globalAlpha = 1;
      // Setting sun: soft stepped halo, then a disc with retro gaps in its lower half.
      const sx = W * 0.2, sr = Math.round(H * 0.075), sy = hz - Math.round(H * 0.1);
      g.globalAlpha = 0.1 + 0.04 * Math.sin(t * 0.9);
      blob(sx, sy, sr * 3.2, sr * 2.2, "#ff9a4a");
      g.globalAlpha = 0.18;
      blob(sx, sy, sr * 2, sr * 1.5, "#ffb060");
      g.globalAlpha = 1;
      for (let y = -sr; y <= sr; y++) {
        if (y > 0 && y % 4 < 1 + y / (sr / 3)) continue;
        const half = Math.round(Math.sqrt(sr * sr - y * y));
        rect(sx - half, sy + y, half * 2, 1, y < -sr * 0.4 ? "#ffe08a" : y < sr * 0.2 ? "#ffbb5e" : "#ff8a4c");
      }
      for (const cl of world.clouds) if (!cl.front) cloud(cl);
      // Far hills, then the skyline with flickering windows.
      for (let x = 0; x < W; x++) rect(x, hz - world.mount[x], 1, world.mount[x], "#2a2038");
      const fo = (t * 1.6) % W;
      for (const f of world.far) for (const o of [-fo, W - fo]) rect(f.x + o, hz - f.h, f.w, f.h, "#241e35");
      for (const b of world.bldgs) {
        const top = hz - b.h;
        rect(b.x, top + b.step, b.w, b.h - b.step + 1, "#191729");
        if (b.step) rect(b.x + Math.round(b.w * 0.25), top, Math.round(b.w * 0.5), b.step + 1, "#191729");
        if (b.ant) {
          rect(b.x + Math.round(b.w / 2), top - b.ant, 1, b.ant, "#191729");
          if (Math.floor(t * 1.2 + b.x) % 3 === 0) rect(b.x + Math.round(b.w / 2), top - b.ant - 1, 1, 1, "#ff5a5a");
        }
      }
      const slot = Math.floor(t / 2);
      for (const w of world.wins) {
        // Half the windows re-roll every 2s, so a few switch on/off at a time.
        const n = Math.sin(w.k * 9973 + (w.k > 0.5 ? slot * 13.1 : 0)) * 43758;
        const on = n - Math.floor(n) < 0.22 || w.k < 0.08;
        if (on) rect(w.x, w.y, 1, 2, w.k < 0.04 ? "#9fd3ff" : "#f2b860");
      }
      for (const cl of world.clouds) if (cl.front) cloud(cl);
      // A small flock crosses every 19s, wings flapping.
      const bp = (t + 9) % 19, bx = -20 + bp * (W / 10);
      if (!calm && bx < W + 20) for (let k = 0; k < 5; k++) {
        const x = bx - [0, 6, 6, 12, 12][k], y = hz * 0.42 + [0, -3, 3, -6, 6][k] + Math.sin(t * 2 + k) * 1.5;
        const up = Math.floor(t * 6 + k) % 2;
        rect(x - 2, y - up, 2, 1, "#1a1424");
        rect(x, y, 1, 1, "#1a1424");
        rect(x + 1, y - up, 2, 1, "#1a1424");
      }
      rect(0, hz, W, H - hz, "#121221");
      // Elevated rail + train every 14s.
      rect(0, rail, W, 3, "#0d0e1a");
      rect(0, rail + 3, W, 1, "#1b1c2c");
      for (let x = 6; x < W; x += 36) rect(x, rail + 3, 3, ground - rail, "#0d0e1a");
      const period = 14, speed = W / 5, phase = (t + 2) % period;
      const tx = W + 10 - phase * speed;
      if (!calm && tx > -200) {
        for (let k = 0; k < 4; k++) {
          const x = tx + k * 46;
          rect(x, rail - 9, 44, 9, "#1e2438");
          rect(x, rail - 9, 44, 1, "#39405a");
          for (let wx = 4; wx < 40; wx += 5) rect(x + wx, rail - 7, 3, 3, "#ffd690");
          rect(x, rail - 2, 44, 1, "#22e06b55");
        }
        rect(tx - 1, rail - 5, 2, 2, "#fff6d0");
      }
      // Near houses with pitched roofs.
      for (const h of world.houses) {
        rect(h.x - 2, ground - h.h - h.roof - 1, h.w + 4, 1, "#1d1a2a");
        rect(h.x, ground - h.h, h.w, h.h, "#0a0b14");
        for (let i = 0; i < h.roof; i++) rect(h.x - 2 + i, ground - h.h - h.roof + i, h.w + 4 - i * 2, 1, "#0a0b14");
      }
      for (const w of world.hwins) rect(w.x, w.y, 3, 3, w.k < 0.3 ? "#8f5a2e" : "#c98a3e");
      // Sakura trees: forked trunk, layered pink canopy, gentle sway.
      for (const tr of world.trees) {
        const { x, R } = tr, cy = ground - Math.round(R * 1.9), sw = Math.round(Math.sin(t * 0.7 + x) * 1.2);
        rect(x - 1, cy + R * 0.3, 3, ground - cy - R * 0.3, "#2b1a22");
        rect(x - R * 0.6, cy + R * 0.55, R * 0.6, 2, "#2b1a22");
        rect(x + 1, cy + R * 0.35, R * 0.5, 2, "#2b1a22");
        for (const p of tr.puffs) blob(x + p.dx + sw, cy + p.dy, p.rx, p.ry, "#5a2843");
        for (const p of tr.puffs) blob(x + p.dx + sw - 1, cy + p.dy - p.ry * 0.35, p.rx * 0.75, p.ry * 0.6, "#86395d", true);
        for (const p of tr.puffs.slice(0, 5)) blob(x + p.dx + sw - p.rx * 0.3, cy + p.dy - p.ry * 0.6, p.rx * 0.35, p.ry * 0.3, "#c0628a", true);
      }
      // Street: asphalt, curb, faint dashed lane that scrolls slowly.
      rect(0, ground, W, H - ground, "#0b0c13");
      rect(0, ground, W, 1, "#1b1c28");
      const ly = ground + Math.round((H - ground) * 0.55);
      for (let x = -((t * 6) % 16); x < W; x += 16) rect(x, ly, 7, 1, "#1d1e2b");
      for (let x = 0; x < W; x += 5) rect(x, ground - 4, 1, 4, "#0c0d16");
      rect(0, ground - 4, W, 1, "#0c0d16");
      for (const f of [0.42, 0.8]) {
        const lx = Math.round(W * f), ly = ground - Math.round(H * 0.07), on = Math.sin(t * 7 + f * 50) > -0.97;
        // Soft glow: stacked rings, faint at the edge, warmer at the centre.
        g.globalAlpha = on ? 0.06 : 0.02;
        for (const k of [1, 0.66, 0.36]) {
          blob(lx, ly + 1, Math.round(H * 0.03 * k), Math.round(H * 0.026 * k), "#ffc977");
          blob(lx, ground + 3, Math.round(H * 0.06 * k), Math.max(1, Math.round(4 * k)), "#ffd890");
        }
        g.globalAlpha = 1;
        rect(lx, ly, 1, ground - ly, "#191a26");
        rect(lx - 2, ly, 4, 2, on ? "#ffe2a0" : "#6b5a3a");
      }
      // Utility poles and sagging wires.
      const top = Math.round(H * 0.62);
      for (const p of world.poles) {
        rect(p, top, 2, ground - top, "#05060a");
        rect(p - 6, top + 4, 14, 1, "#05060a");
      }
      g.fillStyle = "#05060a";
      for (let i = 0; i < world.poles.length - 1; i++) {
        const a = world.poles[i], b = world.poles[i + 1];
        for (let x = a; x <= b; x++) {
          const f = (x - a) / (b - a), sag = Math.round(4 * f * (1 - f) * 10);
          g.fillRect(x, top + 4 + sag, 1, 1);
          g.fillRect(x, top + 8 + sag, 1, 1);
        }
      }
      // Clouds drift, petals fall.
      for (const cl of world.clouds) {
        cl.x -= cl.v * (cl.front ? 2.2 : 1) * dt;
        if (cl.x < -cl.w - 10) cl.x = W + 10;
      }
      if (!calm) for (const p of world.petals) {
        p.x += (p.vx + Math.sin(t * 1.3 + p.p) * 4) * dt;
        p.y += p.vy * dt;
        if (p.y > H) {
          p.y = -2;
          p.x = Math.random() * W * 1.3;
        }
        if (p.x < -2) p.x = W + 2;
        rect(p.x, p.y, (t * 2 + p.p) % 2 < 1 ? 2 : 1, 2, p.c);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 66) return;
      const dt = last ? Math.min(0.2, (now - last) / 1000) : 0;
      last = now;
      draw((now - t0) / 1000, dt);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      resize();
      draw(9, 0);
    };

    resize();
    draw(9, 0);
    raf = requestAnimationFrame(loop);
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <canvas ref={ref} className="scene" aria-hidden />;
}
