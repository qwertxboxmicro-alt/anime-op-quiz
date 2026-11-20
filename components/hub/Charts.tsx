"use client";
import Link from "next/link";
import { useState } from "react";
import { GAMES, type GameEntry } from "@/games/registry";
import { PixelCanvas } from "./PixelCanvas";
import { Avatar, PIcon } from "./Sprites";

// ponytail: demo leaderboards until results are synced per game.
const STREAKS = [["mochi_beats", "41 days"], ["lofi_ren", "33 days"], ["Tsubasa", "28 days"], ["kaito.exe", "19 days"], ["Hana", "14 days"], ["Sorairo", "11 days"]];
const FAST = [["kaito.exe", "0.3 s"], ["Tsubasa", "0.4 s"], ["mochi_beats", "0.6 s"], ["pixelnami", "0.8 s"], ["Juniper", "1.1 s"], ["lofi_ren", "1.4 s"]];

function Tile({ g }: { g: GameEntry }) {
  const body = (
    <>
      <span className="h-pthumb"><PixelCanvas scene={g.thumb} px={3} /></span>
      <b>{g.name}</b>
      <small>{g.genre} · {g.status === "live" ? "Daily" : "Soon"}</small>
    </>
  );
  return g.status === "live" ? <Link href={g.route} className="h-ptile">{body}</Link> : <div className="h-ptile soon">{body}</div>;
}

function Sec({ title, status }: { title: string; status: GameEntry["status"] }) {
  return (
    <section className="h-sec">
      <div className="h-sec-h"><h2 className="h-h2">{title} <PIcon name="chev" size={16} /></h2></div>
      <ul className="h-row">{GAMES.filter((g) => g.status === status).map((g) => <li key={g.id}><Tile g={g} /></li>)}</ul>
    </section>
  );
}

function Board({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="h-board">
      <div className="h-sec-h"><h2 className="h-h2">{title}</h2><span className="h-chip">Demo</span></div>
      <div className="h-panel">
        <ol className="h-rank">
          {rows.map(([n, v], i) => (
            <li key={n}><span className="n">{i + 1}</span><Avatar seed={n} size={36} className="h-av" /><b>{n}</b><span className="v">{v}</span></li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Charts() {
  const [f, setF] = useState<"all" | "today">("all");
  return (
    <main className="h-page">
      <h1 className="h-ptitle">Charts</h1>
      <div className="h-chips" role="group" aria-label="Filter">
        <button className="h-fchip" aria-pressed={f === "all"} onClick={() => setF("all")}>All games</button>
        <button className="h-fchip" aria-pressed={f === "today"} onClick={() => setF("today")}>Today</button>
      </div>
      <Sec title="Top today" status="live" />
      {f === "all" && <Sec title="Coming soon" status="soon" />}
      <div className="h-boards">
        <Board title="Longest streaks" rows={STREAKS} />
        <Board title="Fastest solves today" rows={FAST} />
      </div>
    </main>
  );
}
