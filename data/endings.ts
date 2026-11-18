// Ending (ED) themes for Endless mode only. Same shape as openings; iTunes preview ids verified via search API.
// startOffset 0 until tuned: `node scripts/tune-offsets.mjs data/endings.ts --write`.
import type { Opening } from "./openings";

export const ENDINGS: Opening[] = [
  { anime: "Demon Slayer", aliases: ["Kimetsu no Yaiba"], song: "from the edge", artist: "FictionJunction", itunesTrackId: 1537909393, startOffset: 6.5, diff: 1, year: 2019 },
  { anime: "Bleach", aliases: [], song: "Ichirinnohana", artist: "HIGH and MIGHTY COLOR", itunesTrackId: 1537233480, startOffset: 11.7, diff: 3, year: 2005 },
  { anime: "The Melancholy of Haruhi Suzumiya", aliases: ["Haruhi"], song: "Hare Hare Yukai", artist: "Aya Hirano, Minori Chihara & Yuuko Gotou", itunesTrackId: 1880590189, startOffset: 14.05, diff: 2, year: 2006 },
  { anime: "Steins;Gate", aliases: ["Steins Gate"], song: "Skyclad no Kansokusha", artist: "Kanako Ito", itunesTrackId: 6791035956, startOffset: 3.9, diff: 3, year: 2011 },
  { anime: "Re:ZERO", aliases: ["Re Zero"], song: "Stay Alive", artist: "Rie Takahashi", itunesTrackId: 1556788456, startOffset: 14.25, diff: 2, year: 2016 },
  { anime: "Your lie in April", aliases: ["Shigatsu wa Kimi no Uso"], song: "Orange", artist: "SPYAIR", itunesTrackId: 1728595882, startOffset: 19.7, diff: 2, year: 2014 },
  { anime: "SPY x FAMILY", aliases: ["Spy Family"], song: "Comedy", artist: "Gen Hoshino", itunesTrackId: 1617909669, startOffset: 10.45, diff: 2, year: 2022 },
  { anime: "Frieren", aliases: ["Sousou no Frieren"], song: "Anytime Anywhere", artist: "milet", itunesTrackId: 1708333825, startOffset: 18.15, diff: 2, year: 2023 },
  { anime: "Bocchi the Rock!", aliases: ["Bocchi"], song: "Karakara", artist: "Kessoku Band", itunesTrackId: 1657318783, startOffset: 0.7, diff: 2, year: 2022 },
  { anime: "Cowboy Bebop", aliases: [], song: "The Real Folk Blues", artist: "Mai Yamane", itunesTrackId: 1521442611, startOffset: 16.6, diff: 2, year: 1998 },
  { anime: "Hunter x Hunter", aliases: ["HxH"], song: "Just Awake", artist: "Fear, and Loathing in Las Vegas", itunesTrackId: 1045853101, startOffset: 9.65, diff: 2, year: 2011 },
  { anime: "Naruto", aliases: [], song: "Wind", artist: "Akeboshi", itunesTrackId: 1536226794, startOffset: 11.25, diff: 2, year: 2002 },
  { anime: "JUJUTSU KAISEN", aliases: ["Jujutsu Kaisen"], song: "LOST IN PARADISE", artist: "ALI feat. AKLO", itunesTrackId: 1533684239, startOffset: 6.75, diff: 2, year: 2020 },
];
