import type { Metadata } from "next";
import Link from "next/link";
import Game from "@/games/op-quiz/OpQuizGame";
import { IDisc, IHead, ITape, IWave } from "@/games/op-quiz/Icons";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const ERAS = [
  { era: 1990, label: "Classic anime opening quiz", icon: <IDisc />, c: "#f2b84b" },
  { era: 2000, label: "2000s anime opening quiz", icon: <ITape />, c: "#5fb8f0" },
  { era: 2010, label: "2010s anime opening quiz", icon: <IHead />, c: "#a9b4ad" },
  { era: 2020, label: "2020s anime opening quiz", icon: <IWave />, c: "#b98cf0" },
];

const FAQ = [
  ["Is kikoe.io free?", "Yes. The daily puzzle, Endless mode, stats and sharing are free. Supporters also get past puzzles, streak freezes and colour themes."],
  ["Does it work on my phone?", "Yes. It runs in any modern mobile browser with no app to install. Tap play once so your phone allows the audio."],
  ["Where do the clips come from?", "Every clip is cut from the official 30-second preview in Apple's iTunes catalogue and played straight in your browser."],
];

export default function Home() {
  return (
    <>
      <Game />
      <div className="about">
        <section className="sec" id="about">
          <p className="side-h">About kikoe.io</p>
          <div>
            <h2>Anime opening guessing game</h2>
            <p>
              Guess the anime from a 0.1-second clip of its opening. Listen for the first chord, a synth hit or a voice you know. Each miss unlocks a longer clip. A new
              opening drops every day, and Endless mode has no limit.
            </p>
            <a className="u" href="#top">Back to the game</a>
          </div>
        </section>
        <section className="sec" id="how">
          <p className="side-h">How to play</p>
          <div>
            <ol className="steps">
              <li>
                <b>Listen</b>
                <p>Press play. You start with 0.1 seconds and can replay the clip as often as you like.</p>
              </li>
              <li>
                <b>Make a guess</b>
                <p>Type the anime, pick it from the list and it is submitted right away.</p>
              </li>
              <li>
                <b>Need more?</b>
                <p>Skip or miss to hear 0.5, 1, 2, 4, then 8 seconds. After the reveal, play the full preview or share your score.</p>
              </li>
            </ol>
            <div className="tip">
              <b>A listening tip</b>
              <p>Many openings start cold on a vocal line or a big hit. Replay the first clip a few times before you type: the key and the tempo give away more than you expect.</p>
            </div>
          </div>
        </section>
        <section className="sec" id="eras">
          <p className="side-h">Choose an era</p>
          <div>
            <ul className="eras">
              {ERAS.map((e) => (
                <li key={e.era}>
                  <a href={`/op-quiz?mode=endless&era=${e.era}`}>
                    <span style={{ color: e.c }}>{e.icon}</span>
                    {e.label}
                  </a>
                </li>
              ))}
            </ul>
            <p>Era quizzes play in Endless mode with openings from those years. To combine filters, pick an era in the game options and add a difficulty, or switch to endings.</p>
          </div>
        </section>
        <section className="sec" id="faq">
          <p className="side-h">Quick questions</p>
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} className="qa">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
            <p className="links">
              <Link className="u" href="/privacy">Privacy</Link>
              <Link className="u" href="/terms">Terms</Link>
            </p>
          </div>
        </section>
        <footer className="site-foot">
          <span>© 2026 kikoe.io</span>
          <nav aria-label="Footer">
            <a href="#eras">Eras</a>
            <a href="#how">How to play</a>
            <a href="#faq">FAQ</a>
          </nav>
        </footer>
      </div>
    </>
  );
}
