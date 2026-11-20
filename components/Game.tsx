"use client";
// Client-only reads (Date.now, localStorage, fetch) must happen after mount because the page is prerendered,
// so setState-in-effect is intentional here.
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { CLIPS, SCHEDULES, finished, isCorrect, lookup, msToNext, openingFor, poster, puzzleNo, shareText, todayNum, won, type Guess, type Meta } from "@/lib/game";
import { OPENINGS, type Opening } from "@/data/openings";
import { ENDINGS } from "@/data/endings";
import { loadClip, play, stop } from "@/lib/audio";
import { recordResult } from "@/lib/stats";
import { AccountModal, HowTo, StatsModal } from "@/components/Modals";
import { cloudEnabled, onUser, pushResult } from "@/lib/cloud";
import { startSupporterCheckout, useSupporter } from "@/lib/useSupporter";
import type { User } from "@supabase/supabase-js";

type Entry = string[]; // [display, coverUrl, ...alt search terms]
const KEY = "opq-v1";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const DECADES = [0, 1990, 2000, 2010, 2020] as const; // 0 = all; 1990 = 1999 and earlier
const decadeOf = (y: number) => Math.max(1990, Math.floor(y / 10) * 10);
const pick1 = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
// d = difficulty, dec = decade (0 = any), ed = endings pool. Empty filter combo falls back to the whole pool.
const randomOpening = (d: number, dec = 0, ed = false) => {
  const all = ed ? ENDINGS : OPENINGS;
  const pool = all.filter((o) => (!d || o.diff === d) && (!dec || decadeOf(o.year) === dec));
  return pick1(pool.length ? pool : all);
};

function useCountdown() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    setMs(msToNext());
    const t = setInterval(() => setMs(msToNext()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export default function Game() {
  // Date.now() can't run during prerender, so read the day after mount.
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => setDay(todayNum()), []);
  const [daily, setDaily] = useState(true);
  const [arch, setArch] = useState<number | null>(null); // past day being replayed (never saved or counted)
  const [streamer, setStreamer] = useState(false);
  useEffect(() => {
    try {
      setStreamer(localStorage.getItem("opq-streamer") === "1");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("streamer", streamer);
    try {
      localStorage.setItem("opq-streamer", streamer ? "1" : "0");
    } catch {}
  }, [streamer]);
  const [diff, setDiff] = useState<0 | 1 | 2 | 3>(0); // 0 = all
  const [decade, setDecade] = useState<number>(0);
  const [ed, setEd] = useState(false);
  const [round, setRound] = useState(0);
  const [opts, setOpts] = useState({ start: "0.1", random: false });
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem("opq-opts") || "null");
      if (o?.start in SCHEDULES) setOpts(o);
    } catch {}
  }, []);
  const setOpt = (o: Partial<typeof opts>) => {
    const n = { ...opts, ...o };
    setOpts(n);
    try {
      localStorage.setItem("opq-opts", JSON.stringify(n));
    } catch {}
    next(); // new round so the new setting applies cleanly
  };
  const [endless, setEndless] = useState<Opening | null>(null);
  const [modal, setModal] = useState<"how" | "stats" | "account" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onUser(setUser), []);
  const { isSupporter, loading: supLoading } = useSupporter();
  // On sign-in, upload today's finished local game so it counts toward the account.
  useEffect(() => {
    if (!user || day === null) return;
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s?.day === day && finished(s.guesses)) pushResult({ day, won: won(s.guesses), tries: s.guesses.length });
    } catch {}
  }, [user, day]);
  useEffect(() => {
    try {
      if (!localStorage.getItem("opq-seen")) {
        setModal("how");
        localStorage.setItem("opq-seen", "1");
      }
    } catch {}
  }, []);

  const next = (d: number = diff, dec: number = decade, e: boolean = ed) => {
    setEndless(randomOpening(d, dec, e));
    setRound((r) => r + 1);
  };
  if (day === null) return null;
  const practice = !daily && arch === null;
  const opening = daily ? openingFor(day) : arch !== null ? openingFor(arch) : endless ?? openingFor(day);

  return (
    <>
      <nav className="modes">
        <button className="icon" onClick={() => setModal("how")} aria-label="How to play">?</button>
        <button className={daily ? "on" : ""} onClick={() => { setDaily(true); setArch(null); }}>Daily</button>
        <button className={practice ? "on" : ""} onClick={() => { setDaily(false); setArch(null); if (!endless) next(); }}>Endless</button>
        {puzzleNo(day) > 1 && (
          <button className={!daily && arch !== null ? "on" : ""} onClick={() => { setDaily(false); setArch(arch ?? day - 1); }}>Archive</button>
        )}
        <button className={`icon ${streamer ? "on" : ""}`} onClick={() => setStreamer(!streamer)} aria-label="Streamer mode" aria-pressed={streamer}>&#128250;</button>
        <button className="icon" onClick={() => setModal("stats")} aria-label="Stats">&#9783;</button>
        {cloudEnabled && (
          <button className={`icon ${user ? "on" : ""}`} onClick={() => setModal("account")} aria-label="Account">&#9786;</button>
        )}
      </nav>
      {modal === "how" && <HowTo onClose={() => setModal(null)} />}
      {modal === "stats" && <StatsModal user={user} day={day} onClose={() => setModal(null)} onAccount={() => setModal("account")} />}
      {modal === "account" && <AccountModal user={user} onClose={() => setModal(null)} />}
      {!daily && arch !== null && isSupporter && (
        <div className="opts">
          <span>Puzzle</span>
          <select value={arch} onChange={(e) => setArch(Number(e.target.value))} aria-label="Past puzzle">
            {Array.from({ length: puzzleNo(day) - 1 }, (_, i) => day - 1 - i).map((d) => (
              <option key={d} value={d}>#{puzzleNo(d)}</option>
            ))}
          </select>
        </div>
      )}
      {practice && (
        <div className="opts">
          <span>Type</span>
          {([false, true] as const).map((e) => (
            <button key={String(e)} className={ed === e ? "on" : ""} onClick={() => { setEd(e); next(diff, decade, e); }}>{e ? "Endings" : "Openings"}</button>
          ))}
          <span>Era</span>
          <select value={decade} onChange={(e) => { setDecade(Number(e.target.value)); next(diff, Number(e.target.value), ed); }} aria-label="Decade">
            {DECADES.map((d) => (
              <option key={d} value={d}>{d === 0 ? "All" : d === 1990 ? "≤1990s" : `${d}s`}</option>
            ))}
          </select>
        </div>
      )}
      {practice && (
        <div className="diffs">
          {(["All", "Easy", "Medium", "Hard"] as const).map((l, i) => (
            <button key={l} className={`d${i} ${diff === i ? "on" : ""}`} onClick={() => { setDiff(i as 0 | 1 | 2 | 3); next(i, decade, ed); }}>{l}</button>
          ))}
        </div>
      )}
      {practice && (
        <div className="opts">
          <span>Start at</span>
          {["0.05", "0.1", "0.5", "2"].map((k) => (
            <button key={k} className={opts.start === k ? "on" : ""} onClick={() => setOpt({ start: k })}>
              {k}s{k === "0.05" ? " (hard)" : ""}
            </button>
          ))}
          <span>From</span>
          <button className={!opts.random ? "on" : ""} onClick={() => setOpt({ random: false })}>
            Intro
          </button>
          <button className={opts.random ? "on" : ""} onClick={() => setOpt({ random: true })}>
            Random
          </button>
        </div>
      )}
      {arch !== null && !isSupporter ? (
        <ArchiveLocked loading={supLoading} />
      ) : (
        <Play
          key={daily ? "daily" : arch !== null ? `a${arch}` : `e${round}`}
          day={arch ?? day}
          opening={opening}
          daily={daily}
          archive={arch !== null}
          clips={practice ? SCHEDULES[opts.start] : CLIPS}
          random={practice && opts.random}
          onNext={() => next()}
        />
      )}
    </>
  );
}

// Archive is a Supporter perk. Daily, stats and sharing stay free.
function ArchiveLocked({ loading }: { loading: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (loading) return <p className="opts">Checking Supporter status…</p>;
  return (
    <div className="opts">
      <p>Past puzzles are a Supporter perk. Daily, stats and sharing stay free.</p>
      <button
        className="primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await startSupporterCheckout();
          if (r.url) window.location.href = r.url;
          else { setErr(r.error ?? "Could not start subscription."); setBusy(false); }
        }}
      >
        Become a Supporter
      </button>
      {err && <p>{err}</p>}
    </div>
  );
}

function Play({ day, opening, daily, archive, clips, random, onNext }: { day: number; opening: Opening; daily: boolean; archive: boolean; clips: readonly number[]; random: boolean; onNext: () => void }) {
  const [offset, setOffset] = useState(opening.startOffset);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [ready, setReady] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [err, setErr] = useState("");
  const [playing, setPlaying] = useState(false);
  const [list, setList] = useState<Entry[]>([]);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState(0);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const countdown = useCountdown();

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (daily && s?.day === day) setGuesses(s.guesses);
    } catch {}
    if (random) setOffset(Math.random() * 10); // random spot in the preview
    setReady(true);
    fetch("/anime.json")
      .then((r) => r.json())
      .then(setList)
      .catch(() => setErr("Could not load anime list."));
    poster(opening.anime).then(setCover);
    lookup(opening.itunesTrackId)
      .then((m) => {
        setMeta(m);
        return loadClip(m.previewUrl);
      })
      .then(setBuf)
      .catch(() => setErr("Could not load audio. Check your connection and reload."));
    return stop;
  }, [day, daily, random, opening.anime, opening.itunesTrackId]);

  useEffect(() => {
    if (ready && daily) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ day, guesses }));
      } catch {}
    }
  }, [ready, daily, day, guesses]);

  const done = finished(guesses);
  useEffect(() => {
    if (ready && daily && done) {
      recordResult(day, guesses.length, won(guesses));
      pushResult({ day, won: won(guesses), tries: guesses.length });
    }
  }, [ready, daily, done, day, guesses]);

  const step = Math.min(guesses.length, clips.length - 1);
  const clip = clips[step];

  const matches = useMemo(() => {
    const n = clean(q);
    if (n.length < 2) return [];
    const hit = list.filter((e) => clean(e[0]).includes(n) || e.slice(2).some((t) => clean(t).includes(n)));
    hit.sort((a, b) => Number(!clean(a[0]).startsWith(n)) - Number(!clean(b[0]).startsWith(n)));
    return hit.slice(0, 6);
  }, [q, list]);

  const toggle = (seconds: number, from = offset) => {
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    if (!buf) return;
    setPlaying(true);
    play(buf, from, seconds, () => setPlaying(false));
  };

  const submit = (text: string, kind?: "skip") => {
    stop();
    setPlaying(false);
    const k: Guess["kind"] = kind ?? (isCorrect(text, opening) ? "correct" : "wrong");
    setGuesses((g) => [...g, { kind: k, text }]);
    setQ("");
    setPick(0);
  };

  const share = async () => {
    const t = shareText(day, guesses, daily || archive, clips);
    try {
      if (navigator.share) await navigator.share({ text: t });
      else {
        await navigator.clipboard.writeText(t);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  if (!ready) return null;

  return (
    <main className="game">
      <header>
        <h1>
          OP<span>spot</span>
        </h1>
        <p>{daily ? `Daily anime opening #${puzzleNo(day)}` : archive ? `Archive #${puzzleNo(day)}` : "Endless practice"}</p>
      </header>

      <ol className="bar" aria-label="Clip lengths">
        {clips.map((c, i) => (
          <li
            key={c}
            className={i < guesses.length ? (guesses[i].kind === "correct" ? "ok" : "miss") : i === step && !done ? "now" : ""}
          >
            {c}s
          </li>
        ))}
      </ol>

      {!done && (
        <div className="track" aria-hidden>
          <div className="open" style={{ width: `${Math.max((clip / clips[clips.length - 1]) * 100, 3)}%` }}>
            {playing && <i key={guesses.length + String(playing)} style={{ animationDuration: `${clip}s` }} />}
          </div>
        </div>
      )}

      {!done && (
        <button className="play" onClick={() => toggle(clip)} disabled={!buf} aria-label={playing ? "Stop" : `Play ${clip} seconds`}>
          {playing ? "■" : buf ? "▶" : "…"}
          <small>{buf ? `${clip}s clip` : err ? "error" : "loading"}</small>
        </button>
      )}
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}

      <ul className="log">
        {guesses.map((g, i) => (
          <li key={i} className={g.kind}>
            {g.kind === "skip" ? "Skipped" : g.text}
          </li>
        ))}
      </ul>

      {!done ? (
        <div className="guess">
          {matches.length > 0 && (
            <ul className="sugg" role="listbox">
              {matches.map((m, i) => (
                <li
                  key={m[0]}
                  role="option"
                  aria-selected={i === pick}
                  className={i === pick ? "on" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(m[0]);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m[1]} alt="" width={28} height={40} loading="lazy" />
                  <span>{m[0]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="row">
            <input
              ref={input}
              value={q}
              placeholder="Name that anime…"
              aria-label="Guess the anime"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setQ(e.target.value);
                setPick(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setPick((p) => Math.min(p + 1, matches.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setPick((p) => Math.max(p - 1, 0));
                } else if (e.key === "Enter" && matches[pick]) submit(matches[pick][0]);
              }}
            />
            <button className="skip" onClick={() => submit("", "skip")}>
              Skip{step < clips.length - 1 ? ` +${clips[step + 1]}s` : ""}
            </button>
          </div>
        </div>
      ) : (
        <section className="result">
          <h2>{won(guesses) ? "Nice!" : "Not this time"}</h2>
          <div className="reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {cover && <img className="poster" src={cover} alt={opening.anime} width={110} height={156} />}
            <div className="info">
              <p className="ans">{opening.anime}</p>
              <p className="song">{opening.song}</p>
              <p className="artist">{opening.artist}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {meta && <img className="art" src={meta.art} alt="" width={48} height={48} />}
            </div>
          </div>
          <button className="play small" onClick={() => toggle(30, 0)} disabled={!buf}>
            {playing ? "■ Stop" : "▶ Full preview"}
          </button>
          <div className="actions">
            <button className="primary" onClick={share}>
              {copied ? "Copied!" : "Share"}
            </button>
            {!daily && !archive && <button className="primary" onClick={onNext}>Next song</button>}
            {meta && (
              <a href={meta.link} target="_blank" rel="noreferrer">
                Apple Music ↗
              </a>
            )}
          </div>
          {daily && (
            <p className="next">
              Next opening in <b>{countdown}</b>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
