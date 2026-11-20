# Live test results: anime-op-quiz

Run 2026-11-17 against https://anime-op-quiz-alpha.vercel.app (Supabase ref `meqpyffiuqylljsxupfh`). No app code changed. No emails sent by this run.

| # | Test | Result |
|---|------|--------|
| 1 | Browser console / CSP | PASS |
| 2 | Foreign redirect_to | PASS |
| 3 | Results sync + duplicate day | PASS (see note) |
| 4 | Returning-user sign-in | NOT TESTED |
| 5 | Header + sensitive path checks | PASS |

## 1. Browser console / CSP: PASS
Steps (Claude in Chrome, signed-in profile): load `/`; install `securitypolicyviolation` + `error` listeners; open How to play, Stats, Account, Endless, Daily; skip through a full Daily round (6 skips); open Stats.
Evidence: `window.__csp` = `[]` after every step. `read_console_messages` returned no messages.
Limit: the console reader only starts after first call, so page-load messages before the reload were not captured; the violation listener was installed after load. Audio playback (iTunes preview, `media-src` falls back to `default-src 'self'`) was not exercised by a real click (autoplay needs a user gesture), so a `media-src` violation on the 0.1s clip is **not ruled out**. Owner: click Play once with DevTools open. If blocked, add `media-src 'self' https://*.mzstatic.com` to the CSP in the headers config.

## 2. Foreign redirect: PASS
Used `/auth/v1/verify` with a bogus token (triggers the redirect logic without sending any email).
```
curl -sD- -G $P/auth/v1/verify --data-urlencode token=bogus --data-urlencode type=magiclink --data-urlencode redirect_to=https://evil.example/steal
HTTP/1.1 303  Location: https://anime-op-quiz-alpha.vercel.app#error=access_denied&error_code=otp_expired...
```
Evil origin ignored, fell back to site URL. Same call with the real site as `redirect_to` redirects there. Note: this proves the fallback; it does not prove the allow-list has no overly broad wildcard. Owner should eyeball Auth > URL Configuration.

## 3. Results sync: PASS
Steps: Daily round was fresh ("Daily anime opening #1"); skipped 6 times (lost, answer Demon Slayer / Gurenge). Stats modal shows `1 Played, 0 Win%`. Reloaded page (replay same day).
SQL (read-only):
```
select count(*),min(day),max(day) from public.results  ->  1, 20774, 20774  (1 user)
row: won=false tries=6 ; PK = PRIMARY KEY (user_id, day)
```
Before reload and after reload: still 1 row. PK blocks a second row for the same (user, day).
Note: a direct duplicate INSERT was not attempted (would need the user's JWT, which must not be extracted); duplicate protection is shown by the PK plus the unchanged count after a replay. Day 20774 = epoch days (2026-11-17); UI label "#1" is a separate counter.
Win path: see §8.

## 4. Returning-user sign-in: NOT TESTED
Built-in mailer allows 2 emails/hour and the first sign-in used one; budget not safe to spend. Owner: sign out, request a link, confirm session returns and Stats still show 1 played.

## 5. Headers and paths: PASS
```
curl -I /  -> 200; CSP present (default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src ... *.supabase.co; frame-ancestors 'none'), HSTS 63072000, X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera/mic/geo/payment off
/.env.local 404 ; /.git/config 404 ; /.git/HEAD 404
3 sampled /_next/static/immutable/chunks/*.js.map -> 403 (not served)
```
Observations (not failures): `Access-Control-Allow-Origin: *` on the HTML (Vercel static default; harmless for a public page). CSP allows `'unsafe-inline'` scripts (needed by Next inline bootstrap; nonce-based CSP is the upgrade path). `/robots.txt` is 404.

## 6. RLS script against live project (2026-11-18): PASS 12/12
Live project has email confirmation ON, so `scripts/security-test.mjs` as written would skip the two-user checks (and mail example.com). Ran its exact checks from a scratch copy that creates two confirmed throwaway users via the admin API (`opq-test-<random>@example.invalid`), signs them in with password, then deletes both. Anon key only for all checks.
```
PASS anon cannot read / insert results
PASS user A inserts own result (201)
PASS user B cannot see A's rows / insert as A / update A's row
PASS user A cannot rewrite or delete own result (no update/delete policy)
PASS constraints reject tries=0, tries=99, day far in future, loss with 2 tries
cleanup: both users deleted (200)
```
Possible follow-up: make the script use the admin API when `SUPABASE_SERVICE_ROLE_KEY` is set, so it works on confirmed-email projects.

## 7. Real account deletion (2026-11-18): PASS
Local `npm run dev` (port 3123) with live `.env.local` values, one throwaway confirmed user + 1 `results` row:
```
no token            -> 401
cross-origin Origin -> 403, user still exists
real delete (token) -> 200 {"ok":true}
admin get user      -> 404 ; results rows for that user -> 0 (cascade works)
reuse old token     -> 401
```
Cleanup confirmed: admin user list shows 0 leftover test users (1 user total, the owner's, untouched). No app code changed. Not exercised: the Account dialog UI click-through.

## 8. Win-round sync to `results` (2026-11-18): PASS (aggregate part blocked)
Scratch script (not committed), service key from local `.env.local` only to create/delete 5 confirmed throwaway users (`opq-wintest-*@example.invalid`). Each user signed in with the anon key and called the exact `pushResult` upsert from `lib/cloud.ts` (`onConflict: "user_id,day", ignoreDuplicates: true`) on test day 79990 (valid, far from real puzzle days). Rows: win/1, win/2, win/3, win/6, loss/6.
```
PASS pushResult accepted for wins (tries 1,2,3,6) and loss
PASS owner reads own win row as {day, won:true, tries:1}; user_id defaulted to auth.uid()
PASS duplicate pushResult (different tries) -> no error, row unchanged
PASS plain duplicate INSERT -> 23505 (PK)
FAIL global_day_stats x3 -> PGRST202 "function not found in schema cache"
cleanup: 5 users deleted, 0 leftover rows for day 79990
```
Win shape matches code: `Game.tsx` pushes `{day, won: won(guesses), tries: guesses.length}`; constraints (`tries 1..6`, `won or tries=6`) accept it. No app bug found, no code changed.
Blocked: `public.global_day_stats` (migration `0003_global_stats.sql`) is **not applied on the live project**, so the aggregate read of win rows was not verified (the app degrades to null, by design). After 0003 is applied, re-run the aggregate checks: with 5 rows on one day expect `played=5, wins=4, dist=[1,1,1,0,0,1]`; with 4 rows expect no row (k>=5 hiding); anon call returns no `user_id`.

## 9. `global_day_stats` end to end (2026-11-20): PASS
Scratch script in the scratchpad (not committed). Service key from `.env.local` only, for 5 confirmed throwaway users (`opq-rpctest-*@example.invalid`), signed in via admin `generate_link` + `/auth/v1/verify` (no email sent). Each user inserted one row with the anon key on test days 79991 (5 rows) and 79992 (4 rows). Users deleted after.
```
PASS anon RPC status 200
PASS anon 5 rows -> played=5 wins=4 dist=[1,1,1,0,0,1]
PASS anon response keys are only played, wins, dist (no user_id)
PASS authenticated RPC returns the same aggregate
PASS anon 4 rows -> empty result (k>=5 hiding)
PASS empty day -> empty result
cleanup: 5 users deleted, 0 leftover result rows
```
This closes the §8 FAIL (PGRST202): the function is now in the live schema. Note: `Game.tsx` only calls `fetchGlobalDay` for the stats line; the anon call is what the browser makes.

## 10. Returning-user session, no email (2026-11-20): PARTIAL
Email path NOT used (0 emails sent; the 2/hour budget untouched). Scratch script: admin `generate_link` (magiclink) for a throwaway user, then the same flow a returning user's session uses:
```
PASS admin generate_link returns hashed_token (no email sent)
PASS first sign-in via link returns session (verify 200)
PASS same link reused is rejected (one-time)
PASS refresh_token grant issues a new access token
PASS refreshed token resolves to the same user (/auth/v1/user)
INFO reusing the already-rotated refresh token returned 200 (Supabase reuse window; not a failure)
cleanup: user delete 200
```
Still NOT tested: the real emailed link arriving and the sign-in button path for a returning user. Blocker found: **password sign-in is now blocked by Turnstile** (`captcha_failed: no captcha_token found`). So `scripts/security-test.mjs` two-user checks (password signup) cannot run on the live project any more. Use the admin-link method from §6 or add a captcha-free path before re-running it.

## 11. Account dialog delete click-through, local (2026-11-20): PASS
`npm run dev` on port 3123 with `.env.local` values. Throwaway user (`opq-ui-*@example.invalid`), signed in by opening its verify link in the browser and storing the session.
- Account dialog shows "Signed in as <throwaway email>", Sign out, Delete account.
- Delete account -> type `DELETE` -> Permanently delete. Dev log: `POST /api/delete-account 200`. Page reloaded.
- After: admin get user -> 404; `results` rows for that user -> 0 (the user had none; cascade not re-proven here, §7 covers it).
- Local storage: auth key removed; `opq-v1`, `opq-seen`, `opq-streamer` present again. The app writes them back on reload, so the modal's wipe is not visible after reload. Expected from init order, not verified as a bug.
Observed, not a failure: the browser was opened on `localhost:3123`, but Supabase's `redirect_to` fell back to the production site URL (`localhost:3123` is not on the allow-list). The first session landed on the production origin and was removed from that origin's localStorage right away. Test users only. Dev sign-in needs `localhost:3000` (allow-listed) or a new allow-list entry; not changed here.
Not done: the Turnstile widget did not render on localhost (no site key for localhost in Cloudflare); this test bypassed the sign-in form, not the Turnstile check.

## Blockers this run
- Password sign-in is captcha-protected (see §10). The RLS script needs a rewrite before re-run.
- Strix: see `docs/work-log/quiz-strix.md`, "Re-run 2026-11-20".
