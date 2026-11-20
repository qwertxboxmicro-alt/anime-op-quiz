"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { readStats, type Stats } from "@/lib/stats";
import { Turnstile, turnstileSiteKey } from "@/components/Turnstile";
import { ThemePicker } from "@/components/ThemePicker";
import type { ThemeId } from "@/lib/themes";
import { cloudEnabled, consumeFreeze, deleteAccount, fetchFreezes, fetchGlobalDay, fetchRows, sendLink, signInWith, type GlobalDay, type Provider, signOut } from "@/lib/cloud";
import { freezeCandidates, monthKey, statsFromRows } from "@/lib/streak";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <Shell title="How to play" onClose={onClose}>
      <ul className="how">
        <li>Hit play and name the <b>anime</b> from its opening.</li>
        <li>You get 6 tries. The first clip is only <b>0.1 seconds</b>.</li>
        <li>Each miss or skip unlocks a longer clip.</li>
        <li>A new opening drops every day. Want more? Try <b>Endless</b>.</li>
      </ul>
      <p className="how"><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
      <button className="primary" onClick={onClose}>Got it</button>
    </Shell>
  );
}

export function StatsModal({ user, day, isSupporter, onClose, onAccount }: { user: User | null; day: number; isSupporter: boolean; onClose: () => void; onAccount: () => void }) {
  const [s, setS] = useState<Stats>(() => readStats());
  const [freezes, setFreezes] = useState<number[] | null>(null); // supporter only; null = not loaded / not a supporter
  // Signed in: stats come from the account (synced across devices). Signed out: this device only.
  // Supporters: auto-consume a freeze for a single missed day (server-side row), then bridge frozen days in the streak.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const rows = await fetchRows();
      let frozen = isSupporter ? await fetchFreezes() : [];
      if (isSupporter) {
        for (const d of freezeCandidates(rows, day, frozen)) {
          if (await consumeFreeze(d)) frozen = [...frozen, d];
        }
      }
      if (!alive) return;
      setS(statsFromRows(rows, day, frozen));
      setFreezes(isSupporter ? frozen : null);
    })();
    return () => { alive = false; };
  }, [user, day, isSupporter]);
  // Freeze indicator: one per calendar month, so it is "used" once a freeze falls in this month.
  const freezeUsed = !!freezes?.some((d) => monthKey(d) === monthKey(day));
  const [g, setG] = useState<GlobalDay | null>(null);
  useEffect(() => {
    fetchGlobalDay(day).then(setG);
  }, [day]);
  const max = Math.max(1, ...s.dist);
  // Most common winning try count, for the "N% got it in X tries" line.
  const top = g ? g.dist.indexOf(Math.max(...g.dist)) + 1 : 0;
  return (
    <Shell title="Stats" onClose={onClose}>
      <div className="nums">
        <div><b>{s.played}</b>Played</div>
        <div><b>{s.played ? Math.round((s.wins / s.played) * 100) : 0}</b>Win %</div>
        <div><b>{s.streak}</b>Streak</div>
        <div><b>{s.best}</b>Best</div>
      </div>
      <ol className="dist">
        {s.dist.map((n, i) => (
          <li key={i}>
            <span>{i + 1}</span>
            <i style={{ width: `${Math.max((n / max) * 100, 6)}%` }}>{n}</i>
          </li>
        ))}
      </ol>
      {freezes && (
        <p className="how" aria-label="Streak freeze">
          Streak freeze: {freezeUsed ? "used this month" : "ready (saves one missed day this month)"}
        </p>
      )}
      {g && g.played > 0 && g.wins > 0 && (
        <p className="how">
          {Math.round((g.wins / g.played) * 100)}% got it today, most in {top} {top === 1 ? "try" : "tries"}.
        </p>
      )}
      {cloudEnabled && !user && (
        <button className="primary" onClick={onAccount}>Sign in to save stats</button>
      )}
    </Shell>
  );
}

export function AccountModal({ user, onClose, isSupporter, theme, onPick, hint = "" }: { user: User | null; onClose: () => void; isSupporter: boolean; theme: ThemeId; onPick: (id: ThemeId) => void; hint?: string }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(hint);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [widget, setWidget] = useState(0);
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
    setWidget((n) => n + 1); // token is single-use: fresh widget for the next attempt
    setBusy(false);
  };
  const needCaptcha = !!turnstileSiteKey && !captcha;
  return (
    <Shell title="Account" onClose={onClose}>
      <ThemePicker isSupporter={isSupporter} theme={theme} onPick={onPick} />
      {user ? (
        <>
          <p className="how">Signed in as <b>{user.email}</b>. Your daily results are saved to your account.{isSupporter && <> <span className="badge">Supporter</span></>}</p>
          <button className="primary" onClick={() => signOut().then(onClose)}>Sign out</button>
          {!deleting ? (
            <button onClick={() => setDeleting(true)}>Delete account</button>
          ) : (
            <>
              <p className="how">This permanently deletes your account and all synced results. Type <b>DELETE</b> to confirm.</p>
              <input value={confirm} placeholder="DELETE" aria-label="Type DELETE to confirm" autoComplete="off"
                onChange={(e) => setConfirm(e.target.value)} />
              <button disabled={busy || confirm.trim() !== "DELETE"} onClick={remove}>Permanently delete</button>
              {msg && <p className="how" role="alert">{msg}</p>}
            </>
          )}
        </>
      ) : (
        <>
          <p className="how">Sign in to keep your stats across devices.</p>
          <button className="oauth" disabled={busy} onClick={() => oauth("google")}>Continue with Google</button>
          <button className="oauth" disabled={busy} onClick={() => oauth("discord")}>Continue with Discord</button>
          <p className="how">Or use a one-time email link. No password.</p>
          <input type="email" value={email} placeholder="you@email.com" aria-label="Email" autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && !busy && !needCaptcha && send()} />
          <Turnstile key={widget} onToken={setCaptcha} />
          <button className="primary" disabled={busy || needCaptcha || !/^\S+@\S+\.\S+$/.test(email.trim())} onClick={send}>Send link</button>
          {msg && <p className="how" role="status">{msg}</p>}
        </>
      )}
    </Shell>
  );
}
