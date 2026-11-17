"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { readStats, type Stats } from "@/lib/stats";
import { cloudEnabled, fetchRows, sendLink, signOut, statsFromRows } from "@/lib/cloud";

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
      <button className="primary" onClick={onClose}>Got it</button>
    </Shell>
  );
}

export function StatsModal({ user, day, onClose, onAccount }: { user: User | null; day: number; onClose: () => void; onAccount: () => void }) {
  const [s, setS] = useState<Stats>(() => readStats());
  // Signed in: stats come from the account (synced across devices). Signed out: this device only.
  useEffect(() => {
    if (user) fetchRows().then((rows) => setS(statsFromRows(rows, day)));
  }, [user, day]);
  const max = Math.max(1, ...s.dist);
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
      {cloudEnabled && !user && (
        <button className="primary" onClick={onAccount}>Sign in to save stats</button>
      )}
    </Shell>
  );
}

export function AccountModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const err = await sendLink(email.trim());
    setMsg(err ?? "Check your email for a sign-in link.");
    setBusy(false);
  };
  return (
    <Shell title="Account" onClose={onClose}>
      {user ? (
        <>
          <p className="how">Signed in as <b>{user.email}</b>. Your daily results are saved to your account.</p>
          <button className="primary" onClick={() => signOut().then(onClose)}>Sign out</button>
        </>
      ) : (
        <>
          <p className="how">Sign in with a one-time email link to keep your stats across devices. No password.</p>
          <input type="email" value={email} placeholder="you@email.com" aria-label="Email" autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && send()} />
          <button className="primary" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())} onClick={send}>Send link</button>
          {msg && <p className="how" role="status">{msg}</p>}
        </>
      )}
    </Shell>
  );
}
