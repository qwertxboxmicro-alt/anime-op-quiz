"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHub } from "@/platform/hub";
import { readStats } from "@/games/op-quiz/stats";
import { GAMES, type GameEntry } from "@/games/registry";
import { PixelCanvas } from "./PixelCanvas";
import { Avatar, PIcon } from "./Sprites";

const DAY = 864e5;
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

export function HeroHud() {
  const [left, setLeft] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(DAY - (Date.now() % DAY));
    tick();
    setStreak(readStats().streak);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div className="h-hud h-hud-l">
        <span className="h-lab">Next daily</span>
        <b className="h-hudv cyan">{left === null ? "--:--:--" : fmt(left)}</b>
      </div>
      <div className="h-hud h-hud-r">
        <span className="h-lab">kikoe streak</span>
        <b className="h-hudv pink">{streak ?? 0}<PIcon name="flame" size={16} /></b>
      </div>
    </>
  );
}

export function FriendsRow() {
  const { friends, demo } = useHub();
  return (
    <section className="h-sec">
      <div className="h-sec-h">
        <Link href="/friends" className="h-h2">Friends ({friends.length}) <PIcon name="chev" size={16} /></Link>
        {demo && <span className="h-chip">Demo</span>}
      </div>
      <ul className="h-friends">
        <li>
          <Link href="/friends" className="h-friend">
            <span className="h-fav h-add"><PIcon name="plus" size={26} /></span>
            <b>Add friends</b>
          </Link>
        </li>
        {friends.map((f) => (
          <li key={f.name}>
            <Link href="/chat" className="h-friend">
              <span className={`h-fav ${f.status}`}>
                <Avatar seed={f.name} size={72} />
                {f.status === "playing" && <i className="h-playing"><PIcon name="play" size={10} /></i>}
              </span>
              <b>{f.name}</b>
              <small>{f.status === "playing" ? `In ${f.game}` : f.status === "online" ? "Online" : " "}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GameTile({ g }: { g: GameEntry }) {
  const body = (
    <>
      <span className="h-thumb">
        <PixelCanvas scene={g.thumb} px={3} />
        <span className="h-thumb-t">{g.name}</span>
        <span className={`h-badge ${g.status}`}>{g.status === "live" ? "Daily" : "Soon"}</span>
      </span>
      <b className="h-tname">{g.name}</b>
      <span className="h-tmeta">{g.genre} · {g.status === "live" ? "New puzzle every day" : "Coming soon"}</span>
    </>
  );
  return g.status === "live" ? <Link href={g.route} className="h-tile">{body}</Link> : <div className="h-tile soon" aria-disabled>{body}</div>;
}

export function GameGrid() {
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();
  const list = GAMES.filter((g) => !q || `${g.name} ${g.genre} ${g.blurb}`.toLowerCase().includes(q));
  return (
    <section className="h-sec">
      <div className="h-sec-h">
        <h2 className="h-h2">{q ? `Results for "${q}"` : "Games"}</h2>
      </div>
      {list.length ? (
        <div className="h-grid">{list.map((g) => <GameTile key={g.id} g={g} />)}</div>
      ) : (
        <p className="h-empty">No game matches that yet.</p>
      )}
    </section>
  );
}
