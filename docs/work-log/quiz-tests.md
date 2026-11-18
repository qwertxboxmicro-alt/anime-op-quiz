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
Win path (`won=true`) was not exercised; only a loss was written.

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
