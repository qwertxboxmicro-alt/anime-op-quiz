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

export const GAMES: GameEntry[] = [
  { id: "op-quiz", name: "kikoe", route: "/op-quiz", blurb: "Guess the anime from 0.1 seconds of its opening.", genre: "Music quiz", status: "live", thumb: "op-quiz" },
  { id: "skidmark", name: "Skidmark", route: "/skidmark", blurb: "Daily anime trivia where the rarest right answer wins.", genre: "Trivia", status: "soon", thumb: "skidmark" },
  { id: "racer", name: "Daily Lap", route: "/racing", blurb: "One track, one car, one day. Beat your friends' ghosts.", genre: "Racing", status: "soon", thumb: "racer" },
];
