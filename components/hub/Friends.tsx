"use client";
import Link from "next/link";
import { useState } from "react";
import { useHub } from "@/platform/hub";
import { Avatar, PIcon } from "./Sprites";

const TABS = ["Online", "All", "Requests"] as const;

export function Friends() {
  const { friends, demo } = useHub();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [name, setName] = useState("");
  const [note, setNote] = useState(false);
  const list = tab === "Requests" ? [] : friends.filter((f) => tab === "All" || f.status !== "offline");
  return (
    <main className="h-page">
      <div className="h-sec-h"><h1 className="h-ptitle">Friends</h1>{demo && <span className="h-chip">Demo</span>}</div>
      <form className="h-panel h-addp" onSubmit={(e) => { e.preventDefault(); setNote(true); }}>
        <span className="h-lab">Add friend</span>
        <div className="h-add-row">
          <input className="h-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" aria-label="Username" autoComplete="off" />
          <button className="h-btn" type="submit"><PIcon name="plus" size={14} /> Add</button>
        </div>
        {note && <p className="h-note" role="status">Friend requests arrive with accounts soon.</p>}
      </form>
      <div className="h-tabs" role="group" aria-label="Show">
        {TABS.map((t) => <button key={t} className="h-fchip" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {list.length ? (
        <ul className="h-fgrid">
          {list.map((f) => (
            <li key={f.name} className="h-fcard">
              <span className={`h-fframe ${f.status}`}><Avatar seed={f.name} size={64} /></span>
              <b>{f.name}</b>
              <small>{f.status === "playing" ? `In ${f.game}` : f.status === "online" ? "Online" : "Offline"}</small>
              <span className="h-acts">
                <Link href="/chat" className="h-btn alt sm">Chat</Link>
                {f.status === "playing" && <Link href="/op-quiz" className="h-btn cy sm">Join</Link>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="h-empty">{tab === "Requests" ? "No requests." : "Nobody here yet."}</p>}
    </main>
  );
}
