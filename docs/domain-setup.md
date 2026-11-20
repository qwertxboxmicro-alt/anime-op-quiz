# hibidle.com domain setup (run AFTER buying the domain)

**Hold (decided 2026-11-20):** do not run any step here until Razorpay has approved the current site `https://anime-op-quiz-alpha.vercel.app`. Changing the live domain or the Razorpay website during review can restart it.

The domain is the game hub's, `hibidle.com` (see `../../CLAUDE.md`). `kikoe.io` will not be bought; kikoe stays only the OP Quiz game name.

Project: anime-op-quiz. Vercel project `anime-op-quiz` (team `qwertxboxmicro-alts-projects`). Current origin: `https://anime-op-quiz-alpha.vercel.app`. Supabase ref `meqpyffiuqylljsxupfh`.

Status 2026-11-20: `hibidle.com` returned HTTP 404 from Verisign RDAP (unregistered) and was available on Namecheap at ₹1,127 first year, renews ₹1,490.86/yr. Re-check before buying. Buy .com only for now.

## 1. Vercel: add the domain

1. Vercel dashboard > project `anime-op-quiz` > Settings > Domains.
2. Add `hibidle.com` and `www.hibidle.com`.
3. Set `www.hibidle.com` to redirect to `hibidle.com` (or the reverse; pick one and keep it).
4. Vercel shows the DNS records for each. Copy the exact values it displays (do not guess). At the registrar/DNS host, add them. Wait for Vercel to show "Valid Configuration" and for HTTPS to issue.
5. Use `https://hibidle.com` as the canonical origin from here on.

## 2. Supabase: auth redirects

Project ref `meqpyffiuqylljsxupfh`. Dashboard > Authentication > URL Configuration.

1. Site URL: `https://hibidle.com`.
2. Redirect URLs allow-list: add `https://hibidle.com` and `https://www.hibidle.com`. Keep the existing `https://anime-op-quiz-alpha.vercel.app` and `localhost` entries until the new domain is confirmed working, then remove the old one if wanted.
3. The app sends `redirectTo: window.location.origin` (`lib/cloud.ts:73`), so the origin must be on this list or sign-in falls back to the Site URL.

## 3. Cloudflare Turnstile

1. Cloudflare dashboard > Turnstile > widget `anime-op-quiz`.
2. Hostnames: add `hibidle.com` and `www.hibidle.com`. Keep `anime-op-quiz-alpha.vercel.app` until cut-over is done.
3. The site key is `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (`components/Turnstile.tsx:6`). It does not change, but `NEXT_PUBLIC_` values bake in at build: redeploy after any env change.

## 4. Razorpay (only after Razorpay approval of the current site)

1. Razorpay dashboard > Account/Website settings: update the website/domain entry to `https://hibidle.com`.
2. Webhooks: set the URL to `https://hibidle.com/api/razorpay/webhook` (route: `app/api/razorpay/webhook/route.ts`). Keep the existing webhook secret; do not paste it into the repo.
3. Rename the plan as needed (SPEC.md line 98 notes this as to-do). Plan name is text only.

## 5. OAuth providers (Google, Discord)

- Redirect URI stays `https://meqpyffiuqylljsxupfh.supabase.co/auth/v1/callback` in both Google Cloud Console and the Discord developer portal. Nothing to add for the new origin there.
- Google "Authorized JavaScript origins" and Discord app settings: add `https://hibidle.com` only if the provider settings list origins (see `docs/oauth-setup.md`, which says nothing else needs registering).

## 6. Repo: hard-coded domain hits

Grep for `anime-op-quiz-alpha.vercel.app`, `hibidle` and `kikoe` (excluding node_modules):

| File | Line | Current | Action |
|---|---|---|---|
| `CLAUDE.md` | 6 | `anime-op-quiz-alpha.vercel.app` as the Vercel URL | Change to `hibidle.com` once cut-over is done. Keep the Vercel alias mention if still in use. |
| `SPEC.md` | 3, 98 | Hub section and Open questions list domain to-dos | Tick items as they are done. |
| `docs/work-log/quiz-tests.md` | 3, 22, 116 | Historical test log against the alpha URL | Leave as is (historical record). |
| `docs/work-log/quiz-strix.md` | 3, 24 | localhost only | No change. |
| `components/Game.tsx` | 322 | `kikoe<span>.io</span>` text | Drop the `.io` (no kikoe.io domain); game name stays kikoe. |
| `app/layout.tsx` | 8 | Page title `kikoe.io: ...` | Drop the `.io`; set when the hub routes are built. |
| `app/opengraph-image.tsx` | 3, 12 | OG alt/text | Drop the `.io` with the title. |
| `next.config.ts` | 5-18 | CSP has no origin hard-coded; `connect-src`/`img-src` use `'self'` and third-party hosts only | No change needed. Re-check if a `metadataBase` or canonical URL is added later. |

Other code: no hard-coded `vercel.app` URL found in `app/` or `lib/`. `lib/cloud.ts` uses `window.location.origin`, so it adapts automatically.

## 7. Verify after cut-over

1. `https://hibidle.com` and `https://www.hibidle.com` load over HTTPS with the expected redirect.
2. Sign in with Google and Discord from `https://hibidle.com`; land back on `https://hibidle.com`.
3. Turnstile widget renders on `https://hibidle.com` (no "invalid domain" error in console).
4. Razorpay webhook test event returns 200 from `/api/razorpay/webhook`.
5. CSP: no violations in the browser console on `https://hibidle.com`.
