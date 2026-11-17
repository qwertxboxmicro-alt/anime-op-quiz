# Anime Opening Quiz — Spec

Working name. Daily web game: hear a tiny clip of an anime opening, guess the anime. Clip grows each miss.

## Why this

- "Guess the song in 0.1 seconds" Shorts are hot (e.g. squareheads Short: 288K views in 6 days, Nov 2026).
- "anime opening quiz" YouTube searches: ~41K/mo, +82% growth (vidIQ, Nov 2026). "anime quiz": ~232K/mo, +30%.
- Krillion (rare-answer trivia) grew via creators playing it on camera. Same plan here: streamer-friendly, Shorts-friendly.
- Competition: an older "Anime Heardle" exists, looks stale. No 0.1-second version found.

## Core loop (MVP)

- [x] One opening per day, same for everyone (picked by date). _Code: `openingFor(day)` in `lib/game.ts`._
- [x] Clip lengths unlock per miss: 0.1s, 0.5s, 1s, 2s, 4s, 8s (6 tries). _Code: `CLIPS` in `lib/game.ts`._
- [x] Player guesses the **anime title** (not song title). Skip button = counts as a miss. _Code: `submit("", "skip")` adds a guess in `Game.tsx`._
- [x] Autocomplete over a list of anime titles (English + romaji). _Code: matches title + alt terms from `public/anime.json` (alts include romaji); not checked how complete the list is._
- [x] Win/lose screen: anime, song, artist, cover art, link to Apple Music. _Code: result section in `Game.tsx`._
- [x] Share text, e.g. `🎵 0.5s 🟥🟩⬛⬛⬛⬛` + site URL. _Code: `shareText` in `lib/game.ts`; format is `🎵 OP Quiz #N 0.5s <squares>` + origin; skips show ⬜._
- [x] One play per day per device (localStorage). _Code: `opq-v1` restores today's guesses. Accounts were added later (optional)._
- [x] Countdown to next puzzle. _Code: `useCountdown` + `msToNext` (UTC midnight)._

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
- Supabase for auth + `results` table (accounts and synced stats). Game works without it.

## Accounts & synced stats (Supabase)

- [x] Auth: email magic link (no passwords), Supabase Auth, signed-out play still works.
- [x] `results(user_id, day, won, tries)` table, one row per user per daily puzzle (`supabase/migrations/0001_results.sql`).
- [x] Row Level Security: users read/insert only their own rows; no update/delete; anon has no access.
- [x] Stats modal shows synced stats when signed in, device-only stats when signed out.
- [x] On sign-in, today's finished local game is uploaded.
- [ ] Create the Supabase project, run the migration, set `.env.local` (see `.env.example`), set Auth site URL + redirect URLs.
- [ ] Back-fill: old local-only history (before sign-in) is not uploaded, only today's game. Decide if that matters.
- [x] Delete-my-account flow (needs a server route with the service role key, never client-side). _Code: `app/api/delete-account/route.ts` + Account dialog. Fail-closed (503) checked locally with the key unset; not exercised against live Supabase. Owner must set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel._
- [ ] Optional: Google/Discord sign-in.

## Security testing

- [x] Security headers: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (`next.config.ts`).
- [x] `npm audit` clean (re-run before each deploy).
- [x] No secrets in client bundle or repo: only the public anon key is used; `.env*` is gitignored, `.env.example` committed.
- [x] RLS test script: `node scripts/security-test.mjs` (anon access, cross-user read/write, update/delete blocked, constraint checks).
- [ ] Run the RLS test script against the real Supabase project (test project first).
- [ ] Supabase dashboard: email confirmation on, rate limits on, only needed redirect URLs allowed, service_role key kept out of Vercel public env vars.
- [ ] Verify headers on the deployed site (securityheaders.com or `curl -I`) and check the browser console for CSP violations.
- [ ] Magic-link abuse: confirm Supabase email rate limit, consider CAPTCHA (Turnstile) on sign-in if abused.
- [ ] Re-test auth redirect: link must only return to our own origin (open redirect check).
- [x] Dependency updates + `npm audit` in CI. _`.github/workflows/ci.yml` runs audit (high), lint, build. Dependency-update bot (Dependabot) not added._

## Later (only once real players show up)

- [ ] Global stats (needs aggregate counts across all users): "Only 3% got it at 0.1s" (Supabase: `results(date, tries)` counts).
- [ ] Streamer mode: big text, no spoilers in UI, OBS-friendly layout.
- [x] Endless / practice mode (random openings). _Code: `randomOpening` in `Game.tsx`, difficulty + start-length options; picks from all openings, not only past dailies._
- [ ] Endings (ED) mode, hard mode (start at 0.05s), decade filters.
- [ ] Streaks, archive of past days.

## Open questions

- [ ] Final name + domain.
- [ ] Guess the anime only, or bonus point for song title?
- [ ] Which ~60 openings for launch?
