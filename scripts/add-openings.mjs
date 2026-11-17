// Candidate list -> verified iTunes track + anime-in-autocomplete check. Prints TS lines for data/openings.ts.
import { readFileSync } from "node:fs";

const list = JSON.parse(readFileSync("public/anime.json", "utf8"));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const have = new Set([...readFileSync("data/openings.ts", "utf8").matchAll(/itunesTrackId: (\d+)/g)].map((m) => +m[1]));

// [anime (must start an AniList title), aliases, song, artist, diff 1-3]
const C = [
  ["Naruto Shippuden", ["Naruto"], "Silhouette", "KANA-BOON", 1],
  ["Naruto", [], "Haruka Kanata", "ASIAN KUNG-FU GENERATION", 1],
  ["Hunter x Hunter", ["HxH"], "Departure!", "Masatoshi Ono", 1],
  ["Dragon Ball Z", ["DBZ"], "Cha-La Head-Cha-La", "Hironobu Kageyama", 1],
  ["ONE PIECE", ["One Piece"], "We Are!", "Hiroshi Kitadani", 1],
  ["Neon Genesis Evangelion", ["Evangelion"], "A Cruel Angel's Thesis", "Yoko Takahashi", 1],
  ["Code Geass", [], "COLORS", "FLOW", 2],
  ["Steins;Gate", ["Steins Gate"], "Hacking to the Gate", "Kanako Ito", 2],
  ["Re:ZERO", ["Re Zero"], "Redo", "Konomi Suzuki", 2],
  ["KONOSUBA", ["Konosuba"], "Fantastic Dreamer", "Machico", 2],
  ["Mob Psycho 100", [], "99", "MOB CHOIR", 2],
  ["Black Clover", [], "Haruka Mirai", "Kankaku Piero", 2],
  ["Black Clover", [], "Black Catcher", "Vickeblanka", 2],
  ["Fairy Tail", [], "Snow Fairy", "Funkist", 2],
  ["Kaguya-sama", ["Kaguya sama Love is War"], "Love Dramatic", "Masayuki Suzuki", 2],
  ["Vinland Saga", [], "MUKANJYO", "Survive Said The Prophet", 2],
  ["Dandadan", ["DAN DA DAN"], "Otonoke", "Creepy Nuts", 1],
  ["Frieren", ["Sousou no Frieren"], "Yuusha", "YOASOBI", 1],
  ["Solo Leveling", [], "LEveL", "SawanoHiroyuki[nZk]:Mizuki", 2],
  ["Bocchi the Rock!", ["Bocchi"], "Seisyun Complex", "Kessoku Band", 2],
  ["Demon Slayer", ["Kimetsu no Yaiba"], "Zankyosanka", "Aimer", 1],
  ["Akame ga Kill!", ["Akame ga Kill"], "Skyreach", "Sora tob sakana", 3],
  ["Parasyte", ["Kiseijuu"], "Let Me Hear", "Fear, and Loathing in Las Vegas", 3],
  ["Tokyo Revengers", [], "Cry Baby", "Official HIGE DANdism", 2],
  ["Puella Magi Madoka Magica", ["Madoka Magica"], "Connect", "ClariS", 2],
  ["Fate/Zero", [], "oath sign", "LiSA", 3],
  ["Noragami", [], "Goya no Machiawase", "Hello Sleepwalkers", 3],
  ["Assassination Classroom", ["Ansatsu Kyoushitsu"], "Seishun Satsubatsu-ron", "3-nen E-gumi Utatan", 3],
  ["Nisekoi", [], "Click", "ClariS", 3],
  ["MASHLE", ["Mashle"], "Bling-Bang-Bang-Born", "Creepy Nuts", 1],
  ["JoJo's Bizarre Adventure", ["JoJo"], "Bloody Stream", "Coda", 2],
  ["Tokyo Ghoul:re", [], "asphyxia", "Cö shu Nie", 3],
  ["Charlotte", [], "Bravely You", "Lia", 3],
  ["Angel Beats!", ["Angel Beats"], "My Soul, Your Beats!", "Lia", 3],
  ["Gurren Lagann", ["Tengen Toppa Gurren Lagann"], "Sorairo Days", "Shoko Nakagawa", 3],
  ["The Melancholy of Haruhi Suzumiya", ["Haruhi"], "Hare Hare Yukai", "Aya Hirano", 2],
  ["Dragon Ball Super", [], "Chozetsu Dynamic!", "Kazuya Yoshii", 2],
  ["Digimon Adventure", ["Digimon"], "Butter-Fly", "Koji Wada", 2],
  ["Inuyasha", [], "Change the World", "V6", 3],
  ["Soul Eater", [], "Resonance", "T.M.Revolution", 3],
  ["Attack on Titan", ["Shingeki no Kyojin"], "Shinzou wo Sasageyo!", "Linked Horizon", 1],
  ["Your Name.", ["Kimi no Na wa"], "Zenzenzense", "RADWIMPS", 1],
  ["Death Note", [], "the WORLD", "Nightmare", 1],
  ["Cowboy Bebop", [], "Tank!", "Seatbelts", 2],
  ["Sailor Moon", [], "Moonlight Densetsu", "DALI", 2],
  ["Toradora!", ["Toradora"], "Pre-Parade", "Rie Kugimiya", 3],
  ["Kuroko's Basketball", ["Kuroko no Basket"], "Can Do", "GRANRODEO", 3],
  ["Haikyu!!", [], "Hikari Are", "Burnout Syndromes", 3],
  ["Blue Lock", [], "Chaos ga Kiwami Sugite Mou Nanimo Wakaranai", "UNISON SQUARE GARDEN", 3],
];

for (const [anime, aliases, song, artist, diff] of C) {
  const inList = list.some((e) => [e[0], ...e.slice(1)].some((t) => norm(t).startsWith(norm(anime))));
  const r = await (await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song + " " + artist)}&entity=song&limit=8&country=US`)).json();
  const a0 = norm(artist).split(" ")[0], s0 = norm(song).slice(0, 4);
  const m = r.results.find((x) => x.previewUrl && norm(x.artistName).includes(a0) && norm(x.trackName).includes(s0) && !/instrumental|karaoke|cover|piano|remix/i.test(x.trackName));
  if (!m) { console.log("// NO ITUNES:", anime, song); continue; }
  if (have.has(m.trackId)) continue;
  if (!inList) { console.log("// NOT IN LIST:", anime, song); continue; }
  have.add(m.trackId);
  const q = (s) => JSON.stringify(s);
  console.log(`  { anime: ${q(anime)}, aliases: ${q(aliases)}, song: ${q(song)}, artist: ${q(artist)}, itunesTrackId: ${m.trackId}, startOffset: 0, diff: ${diff} },`);
}
