"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHub } from "@/platform/hub";
import { deleteAccount, sendLink, signInWith, signOut, type Provider } from "@/platform/cloud";
import { readDays, readStats, type DayLog, type Stats } from "@/games/op-quiz/stats";
import { Turnstile, turnstileSiteKey } from "@/platform/Turnstile";
import { PixelCanvas } from "./PixelCanvas";
import { Avatar, PIcon, type IconName } from "./Sprites";

type R = [number, number, number, number, string];
const G = "#3a4a66", L = "#566a8c", D = "#26354f";
// ponytail: locked grey placeholders; give them colour once achievements are tracked.
const frame: R[] = [[4, 2, 16, 20, D], [5, 3, 14, 18, G]];
const BADGES: [string, R[]][] = [
  ["First win", [...frame, [10, 6, 4, 2, L], [9, 8, 6, 5, L], [11, 13, 2, 3, L], [9, 16, 6, 2, L]]],
  ["3-day streak", [...frame, [11, 6, 2, 2, L], [10, 8, 4, 2, L], [9, 10, 6, 4, L], [10, 14, 4, 2, L]]],
  ["7-day streak", [...frame, [11, 5, 2, 2, L], [10, 7, 4, 2, L], [8, 9, 8, 3, L], [9, 12, 6, 3, L], [10, 15, 4, 2, L]]],
  ["One-try solve", [...frame, [11, 6, 2, 10, L], [9, 8, 2, 2, L], [9, 16, 6, 2, L]]],
  ["All eras", [...frame, [8, 7, 8, 1, L], [8, 11, 8, 1, L], [8, 15, 8, 1, L], [7, 8, 1, 7, L], [16, 8, 1, 7, L]]],
  ["Night owl", [...frame, [9, 6, 6, 2, L], [8, 8, 8, 6, L], [9, 10, 2, 2, G], [13, 10, 2, 2, G], [11, 12, 2, 2, D], [9, 14, 6, 3, L]]],
];

export function Me() {
  const { user, name, isSupporter } = useHub();
  const [s, setS] = useState<Stats | null>(null);
  const [days, setDays] = useState<DayLog>({});
  const [today, setToday] = useState(0); // set after mount: Date.now() must not run during prerender
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [widget, setWidget] = useState(0);
  useEffect(() => { const t = setTimeout(() => { setS(readStats()); setDays(readDays()); setToday(Math.floor(Date.now() / 864e5)); }, 0); return () => clearTimeout(t); }, []);
  const remove = async () => {
    setBusy(true);
    const err = await deleteAccount();
    if (err) { setMsg(err); setBusy(false); return; }
    // Wipe this device's game data too (stats, today's game, options, seen flag).
    try { ["opq-v1", "opq-days", "opq-stats", "opq-opts", "opq-seen"].forEach((k) => localStorage.removeItem(k)); } catch {}
    window.location.reload();
  };
  const oauth = async (p: Provider) => {
    setBusy(true);
    const err = await signInWith(p);
    if (err) { setMsg(err); setBusy(false); } // success: the browser is already leaving for the provider
  };
  const send = async () => {
    setBusy(true);
    const err = await sendLink(email.trim(), captcha ?? undefined);
    setMsg(err ?? "Check your email for a sign-in link.");
    setCaptcha(null);
    setWidget((n) => n + 1); // token is single-use
    setBusy(false);
  };
  const needCaptcha = !!turnstileSiteKey && !captcha;
  const wins = s && s.played ? Math.round((s.wins / s.played) * 100) : 0;
  const stats: [string, string, IconName][] = [
    ["Played", String(s?.played ?? 0), "play"],
    ["Win %", `${wins}%`, "charts"],
    ["Streak", String(s?.streak ?? 0), "flame"],
    ["Best", String(s?.best ?? 0), "clock"],
  ];
  const last14 = Array.from({ length: 14 }, (_, i) => today - 13 + i);
  const hasDays = today > 0 && Object.keys(days).length > 0;
  return (
    <main className="h-page">
      <section className="h-panel h-prof">
        <div className="h-banner"><PixelCanvas scene="dusk" px={4} /></div>
        <div className="h-profbody">
          <span className="h-pframe"><Avatar seed={user?.id ?? "guest"} size={112} /></span>
          <div className="h-plate">
            <h1>{name}{isSupporter && <span className="h-sup">Supporter</span>}</h1>
            <p className="h-note">{user ? user.email : "Not signed in"}</p>
            {!user && <a href="#account" className="h-btn sm h-sign">Sign in</a>}
          </div>
        </div>
      </section>
      <section className="h-sec">
        <h2 className="h-h2">kikoe</h2>
        <div className="h-stats">{stats.map(([l, v, ic]) => <div key={l} className="h-stat"><PIcon name={ic} size={18} /><span className="h-lab">{l}</span><b>{v}</b>{l === "Win %" && <span className="h-bar"><i style={{ width: `${wins}%` }} /></span>}{/^0%?$/.test(v) && <small>Play today to start</small>}</div>)}</div>
      </section>
      <section className="h-sec">
        <h2 className="h-h2" id="account">Account</h2>
        <div className="h-acctgrid">
        <div className="h-panel h-acct">
          {user ? (
            <>
              <p className="h-note">Signed in as <b>{user.email}</b>.</p>
              <button className="h-btn" onClick={() => signOut()}>Sign out</button>
              {!deleting ? (
                <button className="h-btn alt" onClick={() => setDeleting(true)}>Delete account</button>
              ) : (
                <>
                  <p className="h-note">This permanently deletes your account and all synced results. Type <b>DELETE</b> to confirm.</p>
                  <input className="h-input" value={confirm} placeholder="DELETE" aria-label="Type DELETE to confirm" autoComplete="off" onChange={(e) => setConfirm(e.target.value)} />
                  <button className="h-btn alt" disabled={busy || confirm.trim() !== "DELETE"} onClick={remove}>Permanently delete</button>
                  {msg && <p className="h-note" role="alert">{msg}</p>}
                </>
              )}
            </>
          ) : (
            <>
              <p className="h-note">Sign in to keep your stats across devices.</p>
              <button className="h-prov" disabled={busy} onClick={() => oauth("google")}><i style={{ background: "#ea4335" }} />Continue with Google</button>
              <button className="h-prov" disabled={busy} onClick={() => oauth("discord")}><i style={{ background: "#5865f2" }} />Continue with Discord</button>
              <p className="h-note">Or use a one-time email link. No password.</p>
              <input className="h-input" type="email" value={email} placeholder="you@email.com" aria-label="Email" autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && !busy && !needCaptcha && send()} />
              <Turnstile key={widget} onToken={setCaptcha} />
              <button className="h-btn pk" disabled={busy || needCaptcha || !/^\S+@\S+\.\S+$/.test(email.trim())} onClick={send}>Send link</button>
              {msg && <p className="h-note" role="status">{msg}</p>}
            </>
          )}
        </div>
        <div className="h-panel h-acct">
          <span className="h-lab">kikoe history · last 14 days</span>
          <div className="h-days">
            {last14.map((d) => {
              const r = hasDays ? days[d] : undefined;
              return <span key={d} className={`h-day${r ? (r.won ? " w" : " l") : ""}`} title={`Day ${d}`}>{r?.won ? r.tries : ""}</span>;
            })}
          </div>
          <div className="h-legend"><span><i className="w" />Won (tries)</span><span><i className="l" />Lost</span><span><i />Not played</span></div>
          {!hasDays && <p className="h-note">No daily games yet. Play today&apos;s kikoe and your history shows up here.</p>}
        </div>
        </div>
      </section>
      <section className="h-sec">
        <div className="h-sec-h"><h2 className="h-h2">Achievements</h2><span className="h-chip">Soon</span></div>
        <div className="h-panel h-acct">
          <ul className="h-badges">
            {BADGES.map(([n, d]) => (
              <li key={n}>
                <svg width="48" height="48" viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden>{d.map(([x, y, w, h, c], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={c} />)}</svg>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <p className="h-note">Badges unlock as you play.</p>
        </div>
      </section>
      <p className="h-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></p>
    </main>
  );
}
