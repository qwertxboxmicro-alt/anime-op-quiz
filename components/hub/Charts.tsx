"use client";
import Link from "next/link";
import { useState } from "react";
import { GAMES, MODES } from "@/games/registry";
import type { SceneId } from "./scenes";
import { PixelCanvas } from "./PixelCanvas";
import { Avatar, PIcon, type IconName } from "./Sprites";

// ponytail: demo leaderboards until results are synced per game.
const STREAKS = [["mochi_beats", "41 days"], ["lofi_ren", "33 days"], ["Tsubasa", "28 days"], ["kaito.exe", "19 days"], ["Hana", "14 days"], ["Sorairo", "11 days"]];
const FAST = [["kaito.exe", "0.3 s"], ["Tsubasa", "0.4 s"], ["mochi_beats", "0.6 s"], ["pixelnami", "0.8 s"], ["Juniper", "1.1 s"], ["lofi_ren", "1.4 s"]];

type Kind = "daily" | "endless" | "era" | "soon";
type Item = { key: string; name: string; meta: string; href?: string; scene: SceneId; variant?: number; kind: Kind };
const FILTERS = ["All", "Daily", "Endless", "Eras"] as const;
const KIND: Record<(typeof FILTERS)[number], Kind | null> = { All: null, Daily: "daily", Endless: "endless", Eras: "era" };

const mode = (i: number, kind: Kind): Item => {
  const m = MODES[i];
  return { key: m.id, name: m.name, meta: m.meta, href: m.href, scene: "op-quiz", variant: m.variant, kind };
};
const SHELVES: { title: string; icon: IconName; ranked?: boolean; items: Item[] }[] = [
  { title: "Play today", icon: "play", ranked: true, items: [mode(0, "daily"), mode(1, "endless")] },
  { title: "By era", icon: "clock", items: [2, 3, 4, 5, 6].map((i) => mode(i, "era")) },
  { title: "Coming soon", icon: "plus", items: GAMES.filter((g) => g.status === "soon").map((g) => ({ key: g.id, name: g.name, meta: g.genre + " · Soon", scene: g.thumb, kind: "soon" as Kind })) },
];

function Tile({ it, rank }: { it: Item; rank?: number }) {
  const body = (
    <>
      <span className="h-pthumb">
        {rank && <span className="h-rankb">{rank}</span>}
        <PixelCanvas scene={it.scene} variant={it.variant} px={3} />
      </span>
      <b>{it.name}</b>
      <small>{it.meta}</small>
    </>
  );
  return it.href ? <Link href={it.href} className="h-ptile">{body}</Link> : <div className="h-ptile soon">{body}</div>;
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
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const k = KIND[f];
  return (
    <main className="h-page">
      <div className="h-strip">
        <PixelCanvas scene="op-quiz" variant={1} px={3} />
        <div className="h-strip-in">
        <h1 className="h-ptitle">Charts</h1>
        <div className="h-chips" role="group" aria-label="Filter">
          {FILTERS.map((x) => <button key={x} className="h-fchip" aria-pressed={f === x} onClick={() => setF(x)}>{x}</button>)}
        </div>
        </div>
      </div>
      {SHELVES.map((s) => {
        const items = s.items.filter((i) => !k || i.kind === k);
        return items.length ? (
          <section className="h-sec" key={s.title}>
            <div className="h-sec-h">
              <h2 className="h-h2"><PIcon name={s.icon} size={16} /> {s.title}</h2>
            </div>
            <ul className={`h-row${s.ranked ? " feat" : ""}`}>{items.map((it, i) => <li key={it.key}><Tile it={it} rank={s.ranked ? i + 1 : undefined} /></li>)}</ul>
          </section>
        ) : null;
      })}
      <div className="h-boards">
        <Board title="Longest streaks" rows={STREAKS} />
        <Board title="Fastest solves today" rows={FAST} />
      </div>
    </main>
  );
}
