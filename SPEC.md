# Anime Opening Quiz — Spec

Working name. Daily web game: hear a tiny clip of an anime opening, guess the anime. Clip grows each miss.

## Why this

- "Guess the song in 0.1 seconds" Shorts are hot (e.g. squareheads Short: 288K views in 6 days, Nov 2026).
- "anime opening quiz" YouTube searches: ~41K/mo, +82% growth (vidIQ, Nov 2026). "anime quiz": ~232K/mo, +30%.
- Krillion (rare-answer trivia) grew via creators playing it on camera. Same plan here: streamer-friendly, Shorts-friendly.
- Competition: an older "Anime Heardle" exists, looks stale. No 0.1-second version found.

## Core loop (MVP)

- [ ] One opening per day, same for everyone (picked by date).
- [ ] Clip lengths unlock per miss: 0.1s, 0.5s, 1s, 2s, 4s, 8s (6 tries).
- [ ] Player guesses the **anime title** (not song title). Skip button = counts as a miss.
- [ ] Autocomplete over a list of anime titles (English + romaji).
- [ ] Win/lose screen: anime, song, artist, cover art, link to Apple Music.
- [ ] Share text, e.g. `🎵 0.5s 🟥🟩⬛⬛⬛⬛` + site URL.
- [ ] One play per day per device (localStorage). No accounts.
- [ ] Countdown to next puzzle.

## Audio

- Source: iTunes Search API `previewUrl` (30s clip, free, no auth). Verified: Gurenge, Unravel, Idol, KICK BACK all have previews.
- Stream from Apple's URL. Do not download or rehost files.
- Each puzzle stores a start offset inside the 30s preview (pick the most recognisable bit).
- Play with Web Audio API for accurate 0.1s cuts (`<audio>` timing is too loose for 0.1s).
- Must show Apple Music link after reveal (Apple preview terms). Legal grey area, same as Heardle clones.
- Not allowed: hidden YouTube player (YouTube API policy bans separating audio from video).

## Content

- `openings.json`: `{ date, anime, aliases[], song, artist, itunesTrackId, startOffset }`.
- Start with ~60 hand-picked openings (2 months of dailies). Mix famous + mid-tier.
- Anime title list for autocomplete: AniList GraphQL API (free), snapshot to a static JSON at build time.

## Stack

- Next.js (static/edge), deploy on Vercel.
- No DB for MVP.

## Later (only once real players show up)

- [ ] Global stats: "Only 3% got it at 0.1s" (Supabase: `results(date, tries)` counts).
- [ ] Streamer mode: big text, no spoilers in UI, OBS-friendly layout.
- [ ] Endless / practice mode (random past openings).
- [ ] Endings (ED) mode, hard mode (start at 0.05s), decade filters.
- [ ] Streaks, archive of past days.

## Open questions

- [ ] Final name + domain.
- [ ] Guess the anime only, or bonus point for song title?
- [ ] Which ~60 openings for launch?
