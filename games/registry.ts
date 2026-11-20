// Every game in the hub. Adding a game = a folder under games/, a route under app/, and one entry here.
import type { SceneId } from "@/components/hub/scenes";

export type GameEntry = {
  id: string;
  name: string;
  route: string;
  blurb: string;
  genre: string;
  status: "live" | "soon";
  thumb: SceneId;
};

// Real, playable entry points into live games (no fake games, no fake numbers). `variant` picks the thumbnail palette.
export type ModeEntry = { id: string; game: string; name: string; href: string; meta: string; variant: number };
export const MODES: ModeEntry[] = [
  { id: "opq-daily", game: "kikoe", name: "kikoe: Daily", href: "/op-quiz", meta: "One opening a day · 6 tries", variant: 0 },
  { id: "opq-endless", game: "kikoe", name: "kikoe: Endless", href: "/op-quiz?mode=endless", meta: "No limit · all eras", variant: 1 },
  { id: "opq-1990", game: "kikoe", name: "Classic openings", href: "/op-quiz?mode=endless&era=1990", meta: "Endless · up to 1999", variant: 2 },
  { id: "opq-2000", game: "kikoe", name: "2000s openings", href: "/op-quiz?mode=endless&era=2000", meta: "Endless · 2000 to 2009", variant: 3 },
  { id: "opq-2010", game: "kikoe", name: "2010s openings", href: "/op-quiz?mode=endless&era=2010", meta: "Endless · 2010 to 2019", variant: 4 },
  { id: "opq-2020", game: "kikoe", name: "2020s openings", href: "/op-quiz?mode=endless&era=2020", meta: "Endless · 2020 onward", variant: 5 },
  { id: "opq-endings", game: "kikoe", name: "Anime endings", href: "/op-quiz?mode=endless&type=endings", meta: "Endless · ending themes", variant: 6 },
];

export const GAMES: GameEntry[] = [
  { id: "op-quiz", name: "kikoe", route: "/op-quiz", blurb: "Guess the anime from 0.1 seconds of its opening.", genre: "Music quiz", status: "live", thumb: "op-quiz" },
  { id: "skidmark", name: "Skidmark", route: "/skidmark", blurb: "Daily anime trivia where the rarest right answer wins.", genre: "Trivia", status: "soon", thumb: "skidmark" },
  { id: "racer", name: "Daily Lap", route: "/racing", blurb: "One track, one car, one day. Beat your friends' ghosts.", genre: "Racing", status: "soon", thumb: "racer" },
];
