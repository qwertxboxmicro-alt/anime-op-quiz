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

- Next.js (static/edge), deployed on Vercel, Git-linked to GitHub `qwertxboxmicro-alt/anime-op-quiz` (2026-11-17): pushes to `main` deploy to production. Env vars set for Production only.
- Supabase for auth + `results` table (accounts and synced stats). Game works without it.

## Accounts & synced stats (Supabase)

- [x] Auth: email magic link (no passwords), Supabase Auth, signed-out play still works.
- [x] `results(user_id, day, won, tries)` table, one row per user per daily puzzle (`supabase/migrations/0001_results.sql`).
- [x] Row Level Security: users read/insert only their own rows; no update/delete; anon has no access.
- [x] Stats modal shows synced stats when signed in, device-only stats when signed out.
- [x] On sign-in, today's finished local game is uploaded.
- [x] Supabase project `anime-op-quiz` (ref `meqpyffiuqylljsxupfh`) created; migrations 0001 + 0002 applied; Auth site URL + redirect allow-list set (prod + localhost).
- [x] `.env.local` (gitignored) and Vercel Production env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key) set; production redeployed 2026-11-17, live bundle contains the project URL. Preview/Development scopes not set.
- [ ] Apply `supabase/migrations/0003_global_stats.sql` to the live project (needs owner's Supabase access), then check the global-stats line appears.
- [ ] Back-fill: old local-only history (before sign-in) is not uploaded, only today's game. Decide if that matters.
- [x] Delete-my-account flow (needs a server route with the service role key, never client-side). _Code: `app/api/delete-account/route.ts` + Account dialog. Fail-closed (503) checked locally with the key unset; not exercised against live Supabase. Owner must set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel._ Live check 2026-11-18: `POST /api/delete-account` returned 503 until the key was set. Key now set in `.env.local` and Vercel Production, redeployed; a fake bearer token returns 401 "Not signed in." (key is live, bad token rejected). Real deletion tested live 2026-11-18 (throwaway user via admin API + local route POST): 200, user and `results` rows gone, old token then 401, cross-origin 403; see `docs/work-log/quiz-tests.md` §7. Account dialog UI click-through not exercised.
- [ ] Optional: Google/Discord sign-in.

## Security testing

- [x] Security headers: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (`next.config.ts`).
- [x] `npm audit` clean (re-run before each deploy).
- [x] No secrets in client bundle or repo: only the public anon key is used; `.env*` is gitignored, `.env.example` committed.
- [x] RLS test script: `node scripts/security-test.mjs` (anon access, cross-user read/write, update/delete blocked, constraint checks).
- [x] Run the RLS test script against the real Supabase project: 12/12 pass 2026-11-18 (throwaway admin-created users, deleted after; see `docs/work-log/quiz-tests.md` §6).
- [x] Supabase Auth config checked via API: email confirmation on, redirect allow-list only prod + localhost, service_role/secret key not in Vercel env vars. RLS policies + grants verified live (anon none, authenticated select+insert only after `0002`).
- [ ] Email send limit is 2/hour on Supabase's built-in mailer; set custom SMTP before real traffic. **Deferred (decided 2026-11-17): do this later with Resend.** Plan: owner has a domain; add a `mail.<domain>` sending subdomain in Resend, add its DNS records (SPF, DKIM, return-path), create an API key (owner creates it, pasted into Supabase Dashboard > Auth > SMTP, never into chat/repo), set host `smtp.resend.com`, port 465, user `resend`, sender `noreply@mail.<domain>`, then raise the Auth email rate limit and re-test sign-in. Also add the domain to the Supabase redirect allow-list + Vercel domains if the app moves to it.
- [x] Headers verified on deployed site with `curl -I` (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS).
- [x] Browser console on the deployed site: no CSP violations or errors (`docs/work-log/quiz-tests.md`). Open: audio `media-src` not exercised by a real Play click; owner to click Play once with DevTools open.
- [ ] Magic-link abuse: **Turnstile code is ready** (`components/Turnstile.tsx`, token passed as `captchaToken` to `signInWithOtp`, CSP allows challenges.cloudflare.com). It stays off until the site key is set. Owner steps: (1) create a Turnstile site in Cloudflare (hostnames: prod + localhost); (2) set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (site key) in Vercel; (3) paste the Turnstile **secret** in Supabase Dashboard > Auth > Bot and Abuse Protection and enable CAPTCHA; (4) redeploy (NEXT_PUBLIC_ values bake in at build). Do step 3 and 4 together: enabling CAPTCHA in Supabase before the site key is deployed breaks sign-in. Also confirm Supabase email rate limit.
- [x] Live sign-in tested 2026-11-17: email link sent, confirm email arrived, link returned to our origin and created a session (new-user flow = "Confirm your email address" signup link). Round sync to `results` tested (1 row, PK blocks duplicates). Win path tested 2026-11-18 (wins 1/2/3/6 tries sync, duplicate ignored; `docs/work-log/quiz-tests.md` §8); live `global_day_stats` aggregate unverified until migration 0003 is applied. Returning-user sign-in not tested (email limit).
- [x] Auth redirect checked: the emailed link redirects only to our own origin (allow-list is prod + localhost). Foreign `redirect_to` falls back to the site URL (see `docs/work-log/quiz-tests.md`).
- [x] Dependency updates + `npm audit` in CI. _`.github/workflows/ci.yml` runs audit (high), lint, build. Dependabot added (`.github/dependabot.yml`, weekly npm + actions, minor/patch grouped)._
- [x] **Scan run 2026-11-18 against local prod build: 1 LOW finding (public answer bank, accepted, client-side game by design), 0 Critical/High/Medium; fixes none. Remaining: re-scan against a test Supabase project once delete-account key is wired. See `docs/work-log/quiz-strix.md`, `docs/strix-instructions.txt`.** Strix (AI pentest agent): install per its README (needs Docker + an LLM API key), then scan this repo and the deployed staging/preview URL. Only target our own site and our own Supabase test project, never production or third-party services. Triage findings, fix real ones, re-scan, and note results here.

## Later (only once real players show up)

- [x] Global stats: "N% got it today, most in X tries" in stats modal via `global_day_stats` RPC. Migration `0003_global_stats.sql` is written but NOT applied to live Supabase (line hides until it is).
- [x] Streamer mode: big text, no spoilers in UI, OBS-friendly layout.
- [x] Endless / practice mode (random openings). _Code: `randomOpening` in `Game.tsx`, difficulty + start-length options; picks from all openings, not only past dailies._
- [x] Endings (ED) mode, decade filters. _Code: `data/endings.ts` (13 ED entries, Endless-only) + `year` on `Opening`; Type/Era rows in `Game.tsx` Endless; daily/archive/stats untouched. Empty filter combo falls back to the whole pool._
- [x] Hard mode (start at 0.05s). _Code: `SCHEDULES["0.05"]`, Endless "Start at" option._
- [x] Streaks (stats modal), archive of past days. _Code: Archive tab in `Game.tsx` replays `openingFor(day)`; not saved to `opq-v1`, not counted in stats._

## Open questions

- [ ] Final name + domain. (Live site currently shows "OPspot".)
- [ ] Guess the anime only, or bonus point for song title?
- [x] Which ~60 openings for launch? 60 in `data/openings.ts` (2026-11-18); start offsets are heuristic, not checked by ear. Owner to review the picks.
