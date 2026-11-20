// Pure streak maths for signed-in stats (no imports, so scripts/streak-check.mjs can load it directly).
// Frozen days (Supporter streak freeze) bridge exactly one missed day. Signed-out and non-supporter callers pass no frozen days.
export type StreakRow = { day: number; won: boolean; tries: number };
export type StreakStats = { played: number; wins: number; streak: number; best: number; last: number; dist: number[] };

const DAY_MS = 86_400_000;
export const monthKey = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 7); // "YYYY-MM", UTC

export function statsFromRows(rows: readonly StreakRow[], today: number, frozen: readonly number[] = []): StreakStats {
  const fz = new Set(frozen);
  const s: StreakStats = { played: rows.length, wins: 0, streak: 0, best: 0, last: 0, dist: [0, 0, 0, 0, 0, 0] };
  const sorted = [...rows].sort((a, b) => a.day - b.day);
  let run = 0;
  let prev = -1;
  for (const r of sorted) {
    if (r.won) { s.wins++; s.dist[r.tries - 1]++; }
    const joined = prev !== -1 && (r.day === prev + 1 || (r.day === prev + 2 && fz.has(prev + 1)));
    run = r.won ? (joined && run > 0 ? run + 1 : 1) : 0;
    s.best = Math.max(s.best, run);
    prev = r.day;
    s.last = r.day;
  }
  // Streak lapses if a whole day was skipped, unless that one day is frozen.
  const alive = s.last >= today - 1 || (s.last === today - 2 && fz.has(today - 1));
  s.streak = alive ? run : 0;
  return s;
}

// Missed days a supporter's freeze should cover now: a single missed day right after a win (between wins, or the day before today),
// at most one per calendar month, and none in a month that already has a freeze. Earliest candidate per month wins.
export function freezeCandidates(rows: readonly StreakRow[], today: number, frozen: readonly number[] = []): number[] {
  const fz = new Set(frozen);
  const sorted = [...rows].sort((a, b) => a.day - b.day);
  const cands: number[] = [];
  let prev: StreakRow | null = null;
  for (const r of sorted) {
    if (prev?.won && r.day === prev.day + 2 && !fz.has(prev.day + 1)) cands.push(prev.day + 1);
    prev = r;
  }
  const last = sorted[sorted.length - 1];
  if (last?.won && last.day === today - 2 && !fz.has(today - 1)) cands.push(today - 1);

  const used = new Set(frozen.map(monthKey));
  const plan: number[] = [];
  for (const d of cands) {
    const m = monthKey(d);
    if (!used.has(m)) { used.add(m); plan.push(d); }
  }
  return plan;
}
