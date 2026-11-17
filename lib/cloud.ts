// Supabase auth + synced stats. Everything here is a no-op when env vars are missing,
// so the game still works signed out / unconfigured. Only the public anon key is used client-side;
// row access is enforced by RLS (supabase/migrations/0001_results.sql).
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Stats } from "@/lib/stats";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudEnabled = !!(url && key);

let client: SupabaseClient | null = null;
export const sb = () => (client ??= cloudEnabled ? createClient(url!, key!) : null);

export type Row = { day: number; won: boolean; tries: number };

export async function getUser(): Promise<User | null> {
  return (await sb()?.auth.getUser())?.data.user ?? null;
}

export function onUser(cb: (u: User | null) => void) {
  const c = sb();
  if (!c) return () => {};
  c.auth.getSession().then(({ data }) => cb(data.session?.user ?? null));
  const { data } = c.auth.onAuthStateChange((_e, s) => cb(s?.user ?? null));
  return () => data.subscription.unsubscribe();
}

export async function sendLink(email: string) {
  const { error } = await sb()!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  return error?.message ?? null;
}

export const signOut = async () => { await sb()?.auth.signOut(); };

// Duplicate (already recorded) is fine: ignore the conflict.
export async function pushResult(r: Row) {
  const c = sb();
  if (!c || !(await c.auth.getSession()).data.session) return; // signed out: local stats only
  await c.from("results").upsert(r, { onConflict: "user_id,day", ignoreDuplicates: true });
}

export async function fetchRows(): Promise<Row[]> {
  const { data } = (await sb()?.from("results").select("day,won,tries").order("day")) ?? { data: null };
  return (data as Row[] | null) ?? [];
}

export function statsFromRows(rows: Row[], today: number): Stats {
  const s: Stats = { played: rows.length, wins: 0, streak: 0, best: 0, last: 0, dist: [0, 0, 0, 0, 0, 0] };
  let run = 0;
  let prev = -1;
  for (const r of [...rows].sort((a, b) => a.day - b.day)) {
    if (r.won) { s.wins++; s.dist[r.tries - 1]++; }
    run = r.won ? (prev === r.day - 1 && run > 0 ? run + 1 : 1) : 0;
    s.best = Math.max(s.best, run);
    prev = r.day;
    s.last = r.day;
  }
  s.streak = s.last >= today - 1 ? run : 0; // streak lapses if you skip a whole day
  return s;
}
