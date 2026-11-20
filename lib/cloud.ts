// Supabase auth + synced stats. Everything here is a no-op when env vars are missing,
// so the game still works signed out / unconfigured. Only the public anon key is used client-side;
// row access is enforced by RLS (supabase/migrations/0001_results.sql).
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { logDay, readDays } from "@/lib/stats";
import { finished, won as wonGuesses, type Saved } from "@/lib/game";

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

export type Provider = "google" | "discord";
const PROVIDER_NAME: Record<Provider, string> = { google: "Google", discord: "Discord" };

// Google/Discord. Checks Supabase's public settings first so a provider the owner has not enabled shows a message
// instead of sending the browser to a raw Supabase error page. Returns an error message, or null when redirecting.
export async function signInWith(provider: Provider): Promise<string | null> {
  const c = sb();
  if (!c || !url || !key) return "Sign-in is not configured.";
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    const s = (await r.json().catch(() => null)) as { external?: Record<string, boolean> } | null;
    if (!r.ok) return "Could not check sign-in options. Try the email link.";
    if (s?.external?.[provider] !== true) return `${PROVIDER_NAME[provider]} sign-in is not enabled yet. Use the email link.`;
  } catch {
    return "Could not reach sign-in. Try the email link.";
  }
  const { error } = await c.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  return error?.message ?? null;
}

// Once per account per page load: a token refresh or re-render does not re-upload.
let backfilledFor: string | null = null;
const FIRST_DAY = 20774; // mirrors the results.day check in supabase/migrations/0001_results.sql

// Pure: keeps only rows the table would accept (day range, tries 1..6, won boolean, a loss is tries 6).
// One bad row would reject the whole insert, so invalid rows are dropped, not coerced.
export function validRows(log: unknown, today: number): Row[] {
  if (!log || typeof log !== "object" || Array.isArray(log)) return [];
  const out: Row[] = [];
  for (const [k, v] of Object.entries(log as Record<string, unknown>)) {
    const day = Number(k);
    if (!Number.isInteger(day) || day < FIRST_DAY || day > today) continue;
    if (!v || typeof v !== "object") continue;
    const { won, tries } = v as { won?: unknown; tries?: unknown };
    if (typeof won !== "boolean" || typeof tries !== "number" || !Number.isInteger(tries)) continue;
    if (tries < 1 || tries > 6 || (!won && tries !== 6)) continue;
    out.push({ day, won, tries });
  }
  return out;
}

// Uploads every finished local daily (not just today). Existing server rows are never overwritten.
// ponytail: one insert call; chunk it if a player ever has hundreds of unsynced days.
export async function backfillLocal(today: number) {
  try {
    const c = sb();
    const uid = (await c?.auth.getSession())?.data.session?.user.id;
    if (!c || !uid || backfilledFor === uid) return;
    backfilledFor = uid;
    try {
      const cur = JSON.parse(localStorage.getItem("opq-v1") || "null") as Saved | null;
      if (cur && cur.day <= today && finished(cur.guesses)) logDay(cur.day, cur.guesses.length, wonGuesses(cur.guesses));
    } catch {}
    const rows = validRows(readDays(), today);
    if (rows.length) await c.from("results").upsert(rows, { onConflict: "user_id,day", ignoreDuplicates: true });
  } catch {
    // Sync is best effort; the local stats are still correct.
  }
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
