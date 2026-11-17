import { OPENINGS, type Opening } from "@/data/openings";

export const CLIPS: readonly number[] = [0.1, 0.5, 1, 2, 4, 8];
// Endless-mode starting lengths; all have 6 steps. Daily always uses CLIPS.
export const SCHEDULES: Record<string, readonly number[]> = {
  "0.1": CLIPS,
  "0.5": [0.5, 1, 2, 4, 8, 12],
  "2": [2, 4, 8, 12, 16, 20],
};
export type Guess = { kind: "wrong" | "skip" | "correct"; text: string };
export type Saved = { day: number; guesses: Guess[] };

const DAY_MS = 86_400_000;
const EPOCH_DAY = 20774; // launch day (UTC days since 1970), puzzle #1
export const todayNum = () => Math.floor(Date.now() / DAY_MS);
export const puzzleNo = (day: number) => day - EPOCH_DAY + 1;
export const openingFor = (day: number): Opening => OPENINGS[((day - EPOCH_DAY) % OPENINGS.length + OPENINGS.length) % OPENINGS.length];
export const msToNext = () => DAY_MS - (Date.now() % DAY_MS);

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
// startsWith so "Demon Slayer: ... Entertainment District Arc" counts as Demon Slayer
export const isCorrect = (guess: string, o: Opening) => {
  const g = norm(guess);
  return !!g && [o.anime, ...o.aliases].some((n) => g.startsWith(norm(n)));
};

export const won = (g: Guess[]) => g.some((x) => x.kind === "correct");
export const finished = (g: Guess[]) => won(g) || g.length >= CLIPS.length;

export function shareText(day: number, g: Guess[], daily = true, clips: readonly number[] = CLIPS) {
  const sq = Array.from({ length: CLIPS.length }, (_, i) => {
    const x = g[i];
    return !x ? "⬛" : x.kind === "correct" ? "🟩" : x.kind === "skip" ? "⬜" : "🟥";
  }).join("");
  const at = g.findIndex((x) => x.kind === "correct");
  return `🎵 OP Quiz ${daily ? `#${puzzleNo(day)}` : "(endless)"} ${at >= 0 ? `${clips[at]}s` : "X"} ${sq}\n${location.origin}`;
}

export type Meta = { previewUrl: string; art: string; link: string };

// Anime poster from AniList (CORS-enabled). Falls back to null.
export async function poster(anime: string): Promise<string | null> {
  try {
    const r = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query($s:String){Media(search:$s,type:ANIME,sort:POPULARITY_DESC){coverImage{extraLarge}}}", variables: { s: anime } }),
    });
    return (await r.json()).data?.Media?.coverImage?.extraLarge ?? null;
  } catch {
    return null;
  }
}
export async function lookup(id: number): Promise<Meta> {
  const r = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
  const t = (await r.json()).results?.[0];
  if (!t?.previewUrl) throw new Error("no preview");
  return { previewUrl: t.previewUrl, art: String(t.artworkUrl100).replace("100x100", "400x400"), link: t.trackViewUrl };
}
