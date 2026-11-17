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
- Supabase for auth + `results` table (accounts and synced stats). Game works without it.

## Accounts & synced stats (Supabase)

- [x] Auth: email magic link (no passwords), Supabase Auth, signed-out play still works.
- [x] `results(user_id, day, won, tries)` table, one row per user per daily puzzle (`supabase/migrations/0001_results.sql`).
- [x] Row Level Security: users read/insert only their own rows; no update/delete; anon has no access.
- [x] Stats modal shows synced stats when signed in, device-only stats when signed out.
- [x] On sign-in, today's finished local game is uploaded.
- [x] Supabase project `anime-op-quiz` (ref `meqpyffiuqylljsxupfh`) created; migrations 0001 + 0002 applied; Auth site URL + redirect allow-list set (prod + localhost).
- [x] `.env.local` (gitignored) and Vercel Production env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key) set; production redeployed 2026-11-17, live bundle contains the project URL. Preview/Development scopes not set.
- [ ] Back-fill: old local-only history (before sign-in) is not uploaded, only today's game. Decide if that matters.
- [ ] Delete-my-account flow (needs a server route with the service role key, never client-side).
- [ ] Optional: Google/Discord sign-in.

## Security testing

- [x] Security headers: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (`next.config.ts`).
- [x] `npm audit` clean (re-run before each deploy).
- [x] No secrets in client bundle or repo: only the public anon key is used; `.env*` is gitignored, `.env.example` committed.
- [x] RLS test script: `node scripts/security-test.mjs` (anon access, cross-user read/write, update/delete blocked, constraint checks).
- [ ] Run the RLS test script against the real Supabase project (test project first).
- [x] Supabase Auth config checked via API: email confirmation on, redirect allow-list only prod + localhost, service_role/secret key not in Vercel env vars. RLS policies + grants verified live (anon none, authenticated select+insert only after `0002`).
- [ ] Email send limit is 2/hour on Supabase's built-in mailer; set custom SMTP before real traffic. **Deferred (decided 2026-11-17): do this later with Resend.** Plan: owner has a domain; add a `mail.<domain>` sending subdomain in Resend, add its DNS records (SPF, DKIM, return-path), create an API key (owner creates it, pasted into Supabase Dashboard > Auth > SMTP, never into chat/repo), set host `smtp.resend.com`, port 465, user `resend`, sender `noreply@mail.<domain>`, then raise the Auth email rate limit and re-test sign-in. Also add the domain to the Supabase redirect allow-list + Vercel domains if the app moves to it.
- [x] Headers verified on deployed site with `curl -I` (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS).
- [ ] Check the browser console on the deployed site for CSP violations.
- [x] Live sign-in tested 2026-11-17: email link sent, confirm email arrived, link returned to our origin and created a session (new-user flow = "Confirm your email address" signup link). Not yet tested: a round syncing to `results`, returning-user sign-in.
- [ ] Magic-link abuse: confirm Supabase email rate limit, consider CAPTCHA (Turnstile) on sign-in if abused.
- [x] Auth redirect checked: the emailed link redirects only to our own origin (allow-list is prod + localhost). Crafted foreign `redirect_to` not tried.
- [ ] Dependency updates + `npm audit` in CI.

## Later (only once real players show up)

- [ ] Global stats (needs aggregate counts across all users): "Only 3% got it at 0.1s" (Supabase: `results(date, tries)` counts).
- [ ] Streamer mode: big text, no spoilers in UI, OBS-friendly layout.
- [ ] Endless / practice mode (random past openings).
- [ ] Endings (ED) mode, hard mode (start at 0.05s), decade filters.
- [ ] Streaks, archive of past days.

## Open questions

- [ ] Final name + domain.
- [ ] Guess the anime only, or bonus point for song title?
- [ ] Which ~60 openings for launch?
