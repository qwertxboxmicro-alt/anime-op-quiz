// Read-only audit of data/openings.ts: iTunes lookup, preview URL, title/artist match, offset fits clip schedules,
// and RMS at the offset (silence check, ffmpeg). Writes docs/work-log/quiz-offsets.md. Does NOT edit openings.ts.
// Usage: node scripts/audit-offsets.mjs [tmpdir]   (needs ffmpeg on PATH)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const tmp = process.argv[2] ?? "audit-tmp"; mkdirSync(tmp, { recursive: true });
const src = readFileSync("data/openings.ts", "utf8");
const rows = [...src.matchAll(/anime: "([^"]+)".*?song: "([^"]+)", artist: "([^"]+)", itunesTrackId: (\d+), startOffset: ([\d.]+)/g)]
  .map((m) => ({ anime: m[1], song: m[2], artist: m[3], id: +m[4], off: +m[5] }));
const g = readFileSync("lib/game.ts", "utf8");
const DAILY = Math.max(...g.match(/CLIPS: readonly number\[\] = \[([^\]]+)\]/)[1].split(",").map(Number));
const ENDLESS = Math.max(...[...g.matchAll(/\[([\d., ]+)\]/g)].flatMap((m) => m[1].split(",").map(Number)));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SR = 8000, FR = 400;
const lookup = {};
for (let i = 0; i < rows.length; i += 50) {
  const j = await (await fetch(`https://itunes.apple.com/lookup?id=${rows.slice(i, i + 50).map((r) => r.id).join(",")}`)).json();
  for (const t of j.results) lookup[t.trackId] = t;
}
const rms = (e, a, b) => Math.sqrt(e.slice(a, b).reduce((x, y) => x + y * y, 0) / Math.max(b - a, 1));
const out = [];
for (const r of rows) {
  const t = lookup[r.id], issues = []; let sugg = "";
  if (!t) { out.push({ ...r, issues: ["id not found in iTunes lookup"], sugg }); continue; }
  const nm = norm(t.trackName), ar = norm(t.artistName);
  const first = (s) => norm(s).split(" ")[0];
  if (!nm.includes(first(r.song)) && !norm(r.song).includes(nm.split(" ")[0])) issues.push(`title mismatch: "${t.trackName}"`);
  if (!ar.includes(first(r.artist)) && !norm(r.artist).includes(ar.split(" ")[0])) issues.push(`artist mismatch: "${t.artistName}"`);
  let e = [], dur = 0;
  try {
    const raw = execFileSync("ffmpeg", ["-v", "quiet", "-i", t.previewUrl, "-ac", "1", "-ar", String(SR), "-f", "s16le", "-"], { maxBuffer: 1 << 26 });
    dur = raw.length / 2 / SR;
    for (let f = 0; f + FR <= raw.length / 2; f += FR) { let s = 0; for (let i = f; i < f + FR; i++) { const v = raw.readInt16LE(i * 2) / 32768; s += v * v; } e.push(Math.sqrt(s / FR)); }
  } catch { issues.push("preview URL failed to decode"); out.push({ ...r, issues, sugg }); continue; }
  if (r.off + DAILY > dur) issues.push(`offset+${DAILY}s daily clip exceeds preview (${dur.toFixed(1)}s)`);
  const endlessOver = r.off + ENDLESS > dur;
  const a = Math.round(r.off * 20), med = rms(e, 0, e.length);
  const r1 = rms(e, a, a + 2), r5 = rms(e, a, a + 10); // first 0.1s, first 0.5s
  if (r1 < 0.25 * med) issues.push(`quiet at offset (first 0.1s RMS ${(r1 / med * 100).toFixed(0)}% of track avg)`);
  else if (r5 < 0.4 * med) issues.push(`quiet start (first 0.5s RMS ${(r5 / med * 100).toFixed(0)}% of avg)`);
  if (issues.length) { // suggestion: loudest sharp attack that still fits the daily clip
    let best = 0, bs = -1;
    for (let i = 4; i < Math.floor((dur - DAILY) * 20); i++) { const b = rms(e, i - 4, i), af = rms(e, i, i + 20); const s = af * Math.min(af / (b + 0.005), 4); if (s > bs) { bs = s; best = i; } }
    sugg = (best * 0.05).toFixed(2);
  }
  out.push({ ...r, issues, sugg, endlessOver, dur });
}
const bad = out.filter((o) => o.issues.length), endl = out.filter((o) => o.endlessOver);
const md = `# Quiz offset audit

Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/audit-offsets.mjs\` (read-only; \`data/openings.ts\` untouched).

**Caveat: this is automated. It cannot judge by ear.** It checks that the preview resolves, track/artist roughly match, the offset leaves room for the longest daily clip (${DAILY}s), and that audio isn't near-silent at the offset (RMS vs track average). A passing row can still start on a boring spot; a suggested offset is just the loudest attack that fits, not a verified "recognisable" spot. Owner should listen.

- Openings checked: ${out.length}; flagged: ${bad.length}
- Daily longest clip: ${DAILY}s. Longest endless clip: ${ENDLESS}s (the "2s" start mode, schedule 2..20).

## Flagged
${bad.length ? `| Anime | Song | Offset | Issues | Suggested |\n|---|---|---|---|---|\n${bad.map((o) => `| ${o.anime} | ${o.song} | ${o.off} | ${o.issues.join("; ")} | ${o.sugg || "-"} |`).join("\n")}` : "None."}

## Endless 20s clip would run past preview end
Not a bug (clip just plays to end of preview, shorter than labelled); informational. ${endl.length} entries: ${endl.map((o) => `${o.anime} (${o.off}s)`).join(", ") || "none"}.
`;
writeFileSync("docs/work-log/quiz-offsets.md", md);
console.log(`checked ${out.length}, flagged ${bad.length}`);
