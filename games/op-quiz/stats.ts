// Daily-mode stats in localStorage. dist[i] = wins on try i+1; losses counted separately.
export type Stats = { played: number; wins: number; streak: number; best: number; last: number; dist: number[] };
const KEY = "opq-stats";
const EMPTY: Stats = { played: 0, wins: 0, streak: 0, best: 0, last: 0, dist: [0, 0, 0, 0, 0, 0] };

export function readStats(): Stats {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return EMPTY;
  }
}

// Per-day log of finished daily games (key: day number), so sign-in can back-fill history.
// opq-v1 only holds the current day, so this is the only local per-day record.
export type DayLog = Record<string, { won: boolean; tries: number }>;
const DAYS_KEY = "opq-days";

export function readDays(): DayLog {
  try {
    const o = JSON.parse(localStorage.getItem(DAYS_KEY) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

export function logDay(day: number, tries: number, won: boolean) {
  const days = readDays();
  if (days[day]) return; // first result for a day wins
  days[day] = { won, tries };
  try { localStorage.setItem(DAYS_KEY, JSON.stringify(days)); } catch {}
}

// Idempotent per day: a reload after finishing doesn't double count.
export function recordResult(day: number, tries: number, won: boolean) {
  logDay(day, tries, won);
  const s = readStats();
  if (s.last === day) return;
  s.played++;
  s.streak = won ? (s.last === day - 1 && s.streak > 0 ? s.streak + 1 : 1) : 0;
  if (won) { s.wins++; s.dist[tries - 1]++; }
  s.best = Math.max(s.best, s.streak);
  s.last = day;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
