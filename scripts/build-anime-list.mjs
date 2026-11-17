// Snapshot top AniList anime titles to public/anime.json: [display, coverUrl, ...searchTerms]
import { writeFileSync } from "node:fs";
const q = `query($p:Int){Page(page:$p,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,format_in:[TV,MOVIE,ONA,OVA,TV_SHORT]){title{romaji english}synonyms coverImage{medium}}}}`;
const out = [];
for (let p = 1; p <= 30; p++) {
  const r = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q, variables: { p } }) });
  if (!r.ok) throw new Error(`AniList ${r.status} on page ${p}`);
  const { data } = await r.json();
  for (const m of data.Page.media) {
    const { romaji, english } = m.title;
    const display = english || romaji;
    const terms = [...new Set([romaji, ...m.synonyms].filter((x) => x && x !== display))].slice(0, 4);
    out.push([display, m.coverImage.medium, ...terms]);
  }
}
writeFileSync("public/anime.json", JSON.stringify(out));
console.log(out.length, "titles");
