"use client";
import { useState } from "react";
import { useHub } from "@/platform/hub";
import { Avatar, PIcon } from "./Sprites";

type Msg = { me?: boolean; t: string };
// ponytail: demo conversations, local state only; real chat needs a messages table.
const SEED: Record<string, { msgs: Msg[]; time: string }> = {
  mochi_beats: { time: "2m", msgs: [{ t: "did you get today's opening?" }, { me: true, t: "second try, the intro fooled me" }, { t: "same, 0.1s is brutal" }] },
  Tsubasa: { time: "1h", msgs: [{ t: "streak check, how many?" }, { me: true, t: "five and counting" }, { t: "ok I need to catch up" }] },
  lofi_ren: { time: "3h", msgs: [{ me: true, t: "join me for endless mode?" }, { t: "give me ten minutes" }] },
  "kaito.exe": { time: "1d", msgs: [{ t: "new game coming soon, you heard?" }, { me: true, t: "Skidmark, yes. Waiting for it" }, { t: "rare answers only, I am ready" }] },
  Hana: { time: "2d", msgs: [{ me: true, t: "gg on yesterday's puzzle" }, { t: "thanks! that one was easy" }] },
};

export function Chat() {
  const { friends, demo } = useHub();
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<Record<string, Msg[]>>({});
  const convs = friends.filter((f) => SEED[f.name] && f.name.toLowerCase().includes(q.trim().toLowerCase()));
  const f = friends.find((x) => x.name === sel && SEED[x.name]);
  const msgs = f ? [...SEED[f.name].msgs, ...(extra[f.name] ?? [])] : [];
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t || !f) return;
    setExtra((x) => ({ ...x, [f.name]: [...(x[f.name] ?? []), { me: true, t }] }));
    setDraft("");
  };
  return (
    <main className="h-page">
      <div className="h-sec-h">
        <h1 className="h-ptitle">Chat</h1>
        {demo && <span className="h-chip">Demo</span>}
        <span className="h-note">Messages are not saved yet.</span>
      </div>
      <div className={`h-chat${f ? " open" : ""}`}>
        <div className="h-clist">
          <input className="h-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search chats" />
          <button className="h-crow" disabled><span className="h-cicon"><PIcon name="party" size={22} /></span><b>Start party</b><PIcon name="chev" size={14} className="h-cchev" /></button>
          <button className="h-crow" disabled><span className="h-cicon"><PIcon name="users" size={22} /></span><b>Groups</b><PIcon name="chev" size={14} className="h-cchev" /></button>
          {convs.map((c) => (
            <button key={c.name} className={`h-crow${sel === c.name ? " on" : ""}`} onClick={() => setSel(c.name)}>
              <Avatar seed={c.name} size={44} className="h-av" />
              <span style={{ minWidth: 0 }}><b>{c.name}</b><small>{SEED[c.name].msgs.at(-1)!.t}</small></span>
              <time>{SEED[c.name].time}</time>
            </button>
          ))}
        </div>
        <section className="h-cpane" aria-label="Conversation">
          {f ? (
            <>
              <div className="h-chead">
                <button className="h-iconbtn h-back" onClick={() => setSel(null)} aria-label="Back to chats"><PIcon name="chev" size={18} /></button>
                <Avatar seed={f.name} size={40} className="h-av" />
                <span><b>{f.name}</b><small>{f.status === "playing" ? `In ${f.game}` : f.status === "online" ? "Online" : "Offline"}</small></span>
              </div>
              <div className="h-msgs">{msgs.map((m, i) => <p key={i} className={`h-bub${m.me ? " me" : ""}`}>{m.t}</p>)}</div>
              <form className="h-send" onSubmit={send}>
                <input className="h-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message" aria-label="Message" autoComplete="off" />
                <button className="h-btn" type="submit" disabled={!draft.trim()}>Send</button>
              </form>
            </>
          ) : (
            <div className="h-empty-pane">
              <svg width="160" height="120" viewBox="0 0 32 24" shapeRendering="crispEdges" aria-hidden>
                <g transform="rotate(-8 10 10)"><rect x="3" y="4" width="14" height="9" fill="#26395c" /><rect x="3" y="4" width="14" height="1" fill="#4fe3f0" /><rect x="5" y="7" width="8" height="1" fill="#8fa3bf" /><rect x="5" y="9" width="5" height="1" fill="#8fa3bf" /><rect x="5" y="13" width="2" height="2" fill="#26395c" /></g>
                <g transform="rotate(7 22 14)"><rect x="14" y="10" width="14" height="9" fill="#ff4f7b" /><rect x="14" y="18" width="14" height="1" fill="#c4345a" /><rect x="17" y="13" width="8" height="1" fill="#ffd9e3" /><rect x="17" y="15" width="5" height="1" fill="#ffd9e3" /><rect x="24" y="19" width="2" height="2" fill="#ff4f7b" /></g>
              </svg>
              <b>Pick a friend to chat</b>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
