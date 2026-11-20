"use client";
// Client-only reads (Date.now, localStorage, fetch) must happen after mount because the page is prerendered,
// so setState-in-effect is intentional here.
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { CLIPS, SCHEDULES, finished, isCorrect, lookup, msToNext, openingFor, poster, puzzleNo, shareText, todayNum, won, type Guess, type Meta } from "@/games/op-quiz/game";
import { OPENINGS, type Opening } from "@/data/openings";
import { ENDINGS } from "@/data/endings";
import { loadClip, play, setVolume, stop } from "@/games/op-quiz/audio";
import { recordResult } from "@/games/op-quiz/stats";
import { AccountModal, HowTo, StatsModal } from "@/games/op-quiz/Modals";
import { Leagues } from "@/games/op-quiz/Leagues";
import Scene from "@/games/op-quiz/Scene";
import { Dropdown } from "@/games/op-quiz/Dropdown";
import { IChev, IGrid, IMenu, IMic, INote, IPlay, IPlayLine, IReroll, ISearch, IShuffle, ISkip, IStop, ISwap } from "@/games/op-quiz/Icons";
import { backfillLocal, cloudEnabled, onUser, pushResult } from "@/platform/cloud";
import { startSupporterCheckout, useSupporter } from "@/platform/useSupporter";
import { useTheme } from "@/platform/themes";
import type { User } from "@supabase/supabase-js";

type Entry = string[]; // [display, coverUrl, ...alt search terms]
const KEY = "opq-v1";
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const save = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

const DECADES = [0, 1990, 2000, 2010, 2020] as const; // 0 = all; 1990 = 1999 and earlier
const DIFFS = ["Any", "Easy", "Medium", "Hard"] as const;
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

// Static masthead: same markup before and after mount, so SSR HTML has the h1 and nothing shifts.
const Masthead = ({ sub }: { sub: string }) => (
  <header className="mast">
    <h1>
      kikoe<span>.io</span>
    </h1>
    <p>{sub}</p>
  </header>
);

const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button className="tog" role="switch" aria-checked={on} aria-label={label} onClick={onClick}>
    <i />
  </button>
);

export default function Game() {
  // Date.now() can't run during prerender, so read the day after mount.
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => setDay(todayNum()), []);
  const [daily, setDaily] = useState(true);
  const [arch, setArch] = useState<number | null>(null); // past day being replayed (never saved or counted)
  const [streamer, setStreamer] = useState(false);
  const [vol, setVol] = useState(0.8);
  const [covers, setCovers] = useState(true);
  const [menu, setMenu] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false); // narrow screens: side panels fold behind a button
  useEffect(() => {
    try {
      setStreamer(localStorage.getItem("opq-streamer") === "1");
      setCovers(localStorage.getItem("opq-covers") !== "0");
      const v = Number(localStorage.getItem("opq-vol") ?? "0.8");
      if (v >= 0 && v <= 1) setVol(v);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("streamer", streamer);
    save("opq-streamer", streamer ? "1" : "0");
  }, [streamer]);
  useEffect(() => setVolume(vol), [vol]);
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
  const [endless, setEndless] = useState<Opening | null>(null);
  const [modal, setModal] = useState<"how" | "stats" | "account" | "leagues" | null>(null);
  const [accountHint, setAccountHint] = useState("");
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onUser(setUser), []);
  const { isSupporter, loading: supLoading } = useSupporter();
  const [theme, setTheme] = useTheme(isSupporter);
  // On sign-in, upload finished local days (background, once per account; see backfillLocal).
  useEffect(() => {
    if (user && day !== null) backfillLocal(day);
  }, [user, day]);

  const next = (d: number = diff, dec: number = decade, e: boolean = ed) => {
    setEndless(randomOpening(d, dec, e));
    setRound((r) => r + 1);
  };
  // Every filter is an Endless setting: touching one leaves Daily, so the daily puzzle and its stats never change.
  const practiceWith = (d: number = diff, dec: number = decade, e: boolean = ed) => {
    setDaily(false);
    setArch(null);
    next(d, dec, e);
  };
  const setOpt = (o: Partial<typeof opts>) => {
    const n = { ...opts, ...o };
    setOpts(n);
    save("opq-opts", JSON.stringify(n));
    practiceWith(); // new round so the new setting applies cleanly
  };

  useEffect(() => {
    // Deep links: /op-quiz?mode=endless&era=2010&type=endings (era links in the About section).
    const p = new URLSearchParams(location.search);
    const era = Number(p.get("era"));
    const dec = (DECADES as readonly number[]).includes(era) ? era : 0;
    const e = p.get("type") === "endings";
    if (p.get("mode") === "endless" || dec || e) {
      setDecade(dec);
      setEd(e);
      practiceWith(0, dec, e);
      return;
    }
    try {
      if (!localStorage.getItem("opq-seen")) {
        setModal("how");
        localStorage.setItem("opq-seen", "1");
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const practice = !daily && arch === null;
  const opening = day === null ? null : daily ? openingFor(day) : arch !== null ? openingFor(arch) : endless ?? openingFor(day);
  const sub =
    day === null ? "Daily anime opening quiz" : daily ? `Daily anime opening #${puzzleNo(day)}` : arch !== null ? `Archive #${puzzleNo(arch)}` : `Endless ${ed ? "endings" : "openings"}`;
  const goArchive = () => {
    if (day === null) return;
    setDaily(false);
    setArch(arch ?? day - 1);
  };
  const modeTabs = [
    { label: "Daily", on: daily, go: () => { setDaily(true); setArch(null); } },
    { label: "Endless", on: practice, go: () => { setDaily(false); setArch(null); if (!endless) next(); } },
    ...(day !== null && puzzleNo(day) > 1 ? [{ label: "Archive", on: !daily && arch !== null, go: goArchive }] : []),
  ];
  const pickDiff = (i: number) => {
    setDiff(i as 0 | 1 | 2 | 3);
    practiceWith(i, decade, ed);
  };
  const pickType = (e: boolean) => {
    setEd(e);
    practiceWith(diff, decade, e);
  };
  const menuItem = (label: string, go: () => void, extra?: string) => (
    <button role="menuitem" onClick={() => { setMenu(false); go(); }}>
      {label}
      {extra && <span className="dim">{extra}</span>}
    </button>
  );

  return (
    <div className={`shell ${optsOpen ? "opts-open" : ""}`} id="top">
      <Scene />
      <div className="cone" aria-hidden />
      <div className="burger-wrap">
        <button className="burger" aria-label="Menu" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu(!menu)}>
          <IMenu />
        </button>
        {menu && (
          <>
            <div className="menu-scrim" onClick={() => setMenu(false)} />
            <div className="menu" role="menu">
              {menuItem("How to play", () => setModal("how"))}
              {menuItem("Stats", () => setModal("stats"))}
              {cloudEnabled && menuItem("Friend leagues", () => setModal("leagues"))}
              {cloudEnabled && menuItem(user ? "Account" : "Sign in", () => setModal("account"))}
              {menuItem("Streamer mode", () => setStreamer(!streamer), streamer ? "On" : "Off")}
            </div>
          </>
        )}
      </div>
      {modal === "how" && <HowTo onClose={() => setModal(null)} />}
      {modal === "stats" && day !== null && <StatsModal user={user} day={day} isSupporter={isSupporter} onClose={() => setModal(null)} onAccount={() => setModal("account")} />}
      {modal === "account" && <AccountModal user={user} onClose={() => { setModal(null); setAccountHint(""); }} isSupporter={isSupporter} theme={theme} onPick={setTheme} hint={accountHint} />}
      {modal === "leagues" && <Leagues user={user} onClose={() => setModal(null)} />}

      <aside className="side left" aria-label="Song filters">
        <div className="grp">
          <label className="lab" htmlFor="f-type">
            Type <span className="new">New</span>
          </label>
          <Dropdown id="f-type" warm icon={<IMic />} value={ed ? "ed" : "op"} onChange={(v) => pickType(v === "ed")}
            options={[{ value: "op", label: "Openings" }, { value: "ed", label: "Endings" }]} />
        </div>
        <div className="grp">
          <label className="lab" htmlFor="f-era">Era</label>
          <Dropdown id="f-era" icon={<IGrid />} value={decade} onChange={(v) => { setDecade(v); practiceWith(diff, v, ed); }}
            options={DECADES.map((d) => ({ value: d as number, label: d === 0 ? "Any era" : d === 1990 ? "Classic (≤1990s)" : `${d}s` }))} />
        </div>
        <hr />
        <div className="grp diff-list">
          <span className="lab">Difficulty</span>
          <div className="stack">
            {DIFFS.map((l, i) => (
              <button key={l} className={`item ${diff === i ? "on" : ""}`} aria-pressed={diff === i} onClick={() => pickDiff(i)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <hr />
        <button className="reroll" onClick={() => practiceWith()}>
          <IReroll /> New song
        </button>
      </aside>

      <main className="game">
        <Masthead sub={sub} />
        <div className="tabs">
          <button className="swap" onClick={() => pickType(!ed)} aria-label={ed ? "Switch to openings" : "Switch to endings"} title={ed ? "Switch to openings" : "Switch to endings"}>
            <ISwap />
          </button>
          <div className="tablist">
            {modeTabs.map((t) => (
              <button key={t.label} className={t.on ? "on" : ""} aria-pressed={t.on} onClick={t.go}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="pills">
          {DIFFS.map((l, i) => (
            <button key={l} className={`d${i} ${diff === i ? "on" : ""}`} aria-pressed={diff === i} onClick={() => pickDiff(i)}>
              {l}
            </button>
          ))}
        </div>
        {!daily && arch !== null && isSupporter && day !== null && (
          <div className="opts">
            <span>Puzzle</span>
            <select value={arch} onChange={(e) => setArch(Number(e.target.value))} aria-label="Past puzzle">
              {Array.from({ length: puzzleNo(day) - 1 }, (_, i) => day - 1 - i).map((d) => (
                <option key={d} value={d}>#{puzzleNo(d)}</option>
              ))}
            </select>
          </div>
        )}
        {day === null || !opening ? (
          <Skeleton />
        ) : arch !== null && !isSupporter ? (
          <ArchiveLocked loading={supLoading} onSignIn={() => { setAccountHint("Sign in to become a Supporter."); setModal("account"); }} />
        ) : (
          <Play
            key={daily ? "daily" : arch !== null ? `a${arch}` : `e${round}`}
            day={arch ?? day}
            opening={opening}
            daily={daily}
            archive={arch !== null}
            clips={practice ? SCHEDULES[opts.start] : CLIPS}
            random={practice && opts.random}
            covers={covers}
            onNext={() => next()}
          />
        )}
        <section className="more" aria-label="More ways to play">
          <div className="cards">
            <button className="card" onClick={() => pickType(false)}>
              <b>Endless</b>
              <span>Openings back to back</span>
            </button>
            <button className="card hot" onClick={() => pickType(true)}>
              <b>Endings</b>
              <span>Name it from the outro</span>
              <em className="ribbon">New</em>
            </button>
            <button className="card" onClick={goArchive}>
              <b>Archive</b>
              <span>Every past daily</span>
            </button>
          </div>
          <p className="lab center">More ways to play</p>
          <button className="opts-btn" aria-expanded={optsOpen} onClick={() => setOptsOpen(!optsOpen)}>
            {optsOpen ? "Hide game options" : "Game options"} <IChev />
          </button>
        </section>
      </main>

      <aside className="side right" aria-label="Playback options">
        <div className="grp">
          <span className="lab">Playback</span>
          <div className="stack">
            <button className={`item sm ${!opts.random ? "on" : ""}`} aria-pressed={!opts.random} onClick={() => setOpt({ random: false })}>
              <IPlayLine /> From the intro
            </button>
            <button className={`item sm ${opts.random ? "on" : ""}`} aria-pressed={opts.random} onClick={() => setOpt({ random: true })}>
              <IShuffle /> Random spot
            </button>
          </div>
        </div>
        <hr />
        <div className="grp">
          <span className="lab">Search</span>
          <div className="row-card">
            <ISearch />
            <span>Show covers</span>
            <Toggle on={covers} label="Show cover art in search" onClick={() => { setCovers(!covers); save("opq-covers", covers ? "0" : "1"); }} />
          </div>
        </div>
        <hr />
        <div className="grp">
          <span className="lab">First clip</span>
          <div className="chips">
            {Object.keys(SCHEDULES)
              .sort((a, b) => Number(a) - Number(b))
              .map((k) => (
                <button key={k} className={opts.start === k ? "on" : ""} aria-pressed={opts.start === k} onClick={() => setOpt({ start: k })}>
                  {k}s
                </button>
              ))}
          </div>
        </div>
        <hr />
        <div className="grp">
          <label className="lab" htmlFor="f-vol">Volume</label>
          <input
            id="f-vol"
            className="vol"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            style={{ "--v": `${vol * 100}%` } as React.CSSProperties}
            onChange={(e) => { const v = Number(e.target.value); setVol(v); save("opq-vol", String(v)); }}
          />
        </div>
        <hr />
        <details className="uiopts">
          <summary>
            UI options <span className="new">New</span>
            <IChev />
          </summary>
          <div className="row-card">
            <INote />
            <span>Streamer mode</span>
            <Toggle on={streamer} label="Streamer mode" onClick={() => setStreamer(!streamer)} />
          </div>
          {cloudEnabled && (
            <button className="item sm" onClick={() => setModal("account")}>
              Colour themes
            </button>
          )}
        </details>
      </aside>

      <nav className="foot" aria-label="Site">
        <a href="#eras">Eras</a>
        <a href="#how">How to play</a>
        <a href="#faq">FAQ</a>
      </nav>
    </div>
  );
}

// Same footprint as the play area, so the layout doesn't jump when the game mounts.
const Skeleton = () => (
  <>
    <div className="track" aria-hidden />
    <div className="playrow">
      <button className="play" disabled aria-label="Loading">
        <IPlay />
      </button>
    </div>
    <div className="row">
      <div className="field">
        <ISearch />
        <input disabled placeholder="Name that anime" aria-label="Guess the anime" />
      </div>
    </div>
  </>
);

// Archive is a Supporter perk. Daily, stats and sharing stay free.
function ArchiveLocked({ loading, onSignIn }: { loading: boolean; onSignIn: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (loading) return <p className="opts">Checking Supporter status…</p>;
  return (
    <div className="opts locked">
      <p>Past puzzles are a Supporter perk. Daily, stats and sharing stay free.</p>
      <button
        className="primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await startSupporterCheckout();
          if (r.url) window.location.href = r.url;
          else if (r.needsSignIn) { setBusy(false); onSignIn(); }
          else { setErr(r.error ?? "Could not start subscription."); setBusy(false); }
        }}
      >
        Become a Supporter
      </button>
      {err && <p>{err}</p>}
    </div>
  );
}

function Play({ day, opening, daily, archive, clips, random, covers, onNext }: { day: number; opening: Opening; daily: boolean; archive: boolean; clips: readonly number[]; random: boolean; covers: boolean; onNext: () => void }) {
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
  // Square-root scale: 0.1s still gets a visible slice of the bar.
  const pos = (c: number) => Math.sqrt(c / clips[clips.length - 1]) * 100;

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

  if (!ready) return <Skeleton />;

  return (
    <>
      <div className="trackwrap">
        <ol className="track" aria-label={`Clip ${step + 1} of ${clips.length}: ${clip} seconds`}>
          {clips.map((c, i) => {
            const from = i ? pos(clips[i - 1]) : 0;
            const g = guesses[i];
            return (
              <li
                key={c}
                className={g ? (g.kind === "correct" ? "ok" : "miss") : i <= step && !done ? "open" : ""}
                style={{ left: `${from}%`, width: `${pos(c) - from}%` }}
              />
            );
          })}
          {playing && <i key={guesses.length} style={{ width: `${pos(clip)}%`, animationDuration: `${clip}s` }} />}
        </ol>
        {!done && (
          <span className="mark" style={{ left: `${pos(clip)}%` }}>
            {clip}s
          </span>
        )}
      </div>

      {!done && (
        <div className="playrow">
          <button className={`play ${playing ? "is-on" : ""}`} onClick={() => toggle(clip)} disabled={!buf} aria-label={playing ? "Stop" : `Play ${clip} seconds`}>
            {playing ? <IStop /> : <IPlay />}
          </button>
          <span className="secs">{clip}s</span>
        </div>
      )}

      {guesses.length > 0 && (
        <ul className="log">
          {guesses.map((g, i) => (
            <li key={i} className={g.kind}>
              <span className="n">{clips[i]}s</span>
              {g.kind === "skip" ? "Skipped" : g.text}
            </li>
          ))}
        </ul>
      )}

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
                  {covers && <img src={m[1]} alt="" width={28} height={40} loading="lazy" />}
                  <span>{m[0]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="row">
            <div className="field">
              <ISearch />
              <input
                ref={input}
                value={q}
                placeholder="Name that anime"
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
            </div>
            <button className="skip" onClick={() => submit("", "skip")}>
              <ISkip />
              {step < clips.length - 1 ? `Skip +${clips[step + 1]}s` : "Give up"}
            </button>
          </div>
          {err && (
            <p className="err" role="alert">
              {err}{" "}
              <button className="link" onClick={() => location.reload()}>
                Reload
              </button>
            </p>
          )}
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
            {!daily && !archive && (
              <button className="primary" onClick={onNext}>
                Next song
              </button>
            )}
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
    </>
  );
}
