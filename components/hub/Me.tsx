"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHub } from "@/platform/hub";
import { deleteAccount, sendLink, signInWith, signOut, type Provider } from "@/platform/cloud";
import { readStats, type Stats } from "@/games/op-quiz/stats";
import { Turnstile, turnstileSiteKey } from "@/platform/Turnstile";
import { Avatar } from "./Sprites";

export function Me() {
  const { user, name, isSupporter } = useHub();
  const [s, setS] = useState<Stats | null>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [widget, setWidget] = useState(0);
  useEffect(() => { const t = setTimeout(() => setS(readStats()), 0); return () => clearTimeout(t); }, []);
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
  const stats: [string, string][] = [
    ["Played", String(s?.played ?? 0)],
    ["Win %", s && s.played ? `${Math.round((s.wins / s.played) * 100)}%` : "0%"],
    ["Streak", String(s?.streak ?? 0)],
    ["Best", String(s?.best ?? 0)],
  ];
  return (
    <main className="h-page">
      <section className="h-panel h-prof">
        <span className="h-pframe"><Avatar seed={user?.id ?? "guest"} size={112} /></span>
        <div>
          <h1>{name}{isSupporter && <span className="h-sup">Supporter</span>}</h1>
          <p className="h-note">{user ? user.email : "Not signed in"}</p>
        </div>
      </section>
      <section className="h-sec">
        <h2 className="h-h2">kikoe</h2>
        <div className="h-stats">{stats.map(([l, v]) => <div key={l} className="h-stat"><span className="h-lab">{l}</span><b>{v}</b></div>)}</div>
      </section>
      <section className="h-sec">
        <h2 className="h-h2">Account</h2>
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
              <button className="h-btn alt" disabled={busy} onClick={() => oauth("google")}>Continue with Google</button>
              <button className="h-btn alt" disabled={busy} onClick={() => oauth("discord")}>Continue with Discord</button>
              <p className="h-note">Or use a one-time email link. No password.</p>
              <input className="h-input" type="email" value={email} placeholder="you@email.com" aria-label="Email" autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && !busy && !needCaptcha && send()} />
              <Turnstile key={widget} onToken={setCaptcha} />
              <button className="h-btn" disabled={busy || needCaptcha || !/^\S+@\S+\.\S+$/.test(email.trim())} onClick={send}>Send link</button>
              {msg && <p className="h-note" role="status">{msg}</p>}
            </>
          )}
        </div>
      </section>
      <p className="h-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></p>
    </main>
  );
}
