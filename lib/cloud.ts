// Supabase auth + synced stats. Everything here is a no-op when env vars are missing,
// so the game still works signed out / unconfigured. Only the public anon key is used client-side;
// row access is enforced by RLS (supabase/migrations/0001_results.sql).
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

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

export async function sendLink(email: string, captchaToken?: string) {
  const { error } = await sb()!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, captchaToken } });
  return error?.message ?? null;
}

export const signOut = async () => { await sb()?.auth.signOut(); };

// Calls the server route, which deletes the user named by our own access token. Returns an error message or null.
export async function deleteAccount(): Promise<string | null> {
  const token = (await sb()?.auth.getSession())?.data.session?.access_token;
  if (!token) return "Not signed in.";
  try {
    const r = await fetch("/api/delete-account", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return ((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not delete account.";
  } catch {
    return "Could not delete account.";
  }
  await signOut(); // user is gone server-side; this clears the local session (may 403 harmlessly)
  return null;
}

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

export async function fetchFreezes(): Promise<number[]> {
  const { data } = (await sb()?.from("streak_freezes").select("day")) ?? { data: null };
  return ((data as { day: number }[] | null) ?? []).map((r) => r.day);
}

// Records one auto-consumed freeze. RLS rejects it unless the user is an active supporter with no freeze that month.
export async function consumeFreeze(day: number): Promise<boolean> {
  const { error } = (await sb()?.from("streak_freezes").insert({ day })) ?? { error: null };
  return !error;
}

export type GlobalDay = { played: number; wins: number; dist: number[] };

// Aggregate counts for one day (migration 0003). null when unconfigured, function missing, or too few players.
export async function fetchGlobalDay(day: number): Promise<GlobalDay | null> {
  try {
    const { data, error } = (await sb()?.rpc("global_day_stats", { p_day: day })) ?? { data: null, error: null };
    const r = Array.isArray(data) ? data[0] : null;
    if (error || !r || !Array.isArray(r.dist)) return null;
    return { played: Number(r.played), wins: Number(r.wins), dist: r.dist as number[] };
  } catch {
    return null;
  }
}
