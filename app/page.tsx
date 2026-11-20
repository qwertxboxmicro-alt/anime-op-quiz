import type { Metadata } from "next";
import Game from "@/components/Game";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Game />
      {/* Visually hidden (screen readers + crawlers only). Keep text identical to what a player would learn. */}
      <footer className="sr-only">
        <p>kikoe.io is a daily anime opening quiz: name the anime from a 0.1-second clip of its opening, with a new one every day.</p>
        <p>Each miss unlocks a longer clip, so you can keep guessing until you get it or run out of clips.</p>
        <p>It is free to play.</p>
      </footer>
    </>
  );
}
