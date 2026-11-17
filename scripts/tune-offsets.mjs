// Heuristic start offsets: strongest loud onset in the first 20s of each iTunes preview.
// Prints a TS snippet of { itunesTrackId: offset }. Needs ffmpeg on PATH. Always spot-check by ear.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ids = [...readFileSync("data/openings.ts", "utf8").matchAll(/itunesTrackId: (\d+)/g)].map((m) => +m[1]);
const SR = 8000, FR = 400; // 50ms frames
const found = {};
for (const id of ids) {
  const t = (await (await fetch(`https://itunes.apple.com/lookup?id=${id}`)).json()).results[0];
  const raw = execFileSync("ffmpeg", ["-v", "quiet", "-i", t.previewUrl, "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], { maxBuffer: 1 << 26 });
  const n = raw.length / 2, e = [];
  for (let f = 0; f + FR <= n; f += FR) {
    let s = 0;
    for (let i = f; i < f + FR; i++) { const v = raw.readInt16LE(i * 2) / 32768; s += v * v; }
    e.push(Math.sqrt(s / FR));
  }
  const mean = (a, b) => e.slice(a, b).reduce((x, y) => x + y, 0) / Math.max(b - a, 1);
  let best = 0, bestScore = -1;
  for (let i = 4; i < 20 * 20; i++) { // frames of 50ms
    const before = mean(i - 4, i), after = mean(i, i + 20); // 0.2s before vs 1s after
    const jump = after / (before + 0.005);
    const score = after * Math.min(jump, 4); // loud AND an attack
    if (score > bestScore) { bestScore = score; best = i; }
  }
  found[id] = (best * 0.05).toFixed(2);
  console.log(id, (best * 0.05).toFixed(2), t.trackName);
}

// --write: store offsets into data/openings.ts. Only touches entries still at 0 unless --all.
if (process.argv.includes("--write")) {
  const all = process.argv.includes("--all");
  const src = readFileSync("data/openings.ts", "utf8").replace(/itunesTrackId: (\d+), startOffset: ([\d.]+)/g, (m, id, off) =>
    found[id] && (all || +off === 0) ? `itunesTrackId: ${id}, startOffset: ${+found[id]}` : m);
  writeFileSync("data/openings.ts", src);
}
