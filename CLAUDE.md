# CLAUDE.md

Hibidle: the game hub for daily browser games (domain `hibidle.com` to be bought; live now at `anime-op-quiz-alpha.vercel.app`). The first game is kikoe, the daily "guess the anime from its opening" game (Heardle-style, clips start at 0.1s). Spec and progress for the game in `SPEC.md`; hub plan in `../HUB-PLAN.md`; folder rules in `../CLAUDE.md`.

- Stack: Next.js on Vercel (project `hibidle`, Git-linked to GitHub `qwertxboxmicro-alt/hibidle`: pushes to `main` deploy to production; other branches get Vercel preview builds behind Vercel login). The hub went live on `main` 2026-11-20. Supabase project `hibidle` (ref `meqpyffiuqylljsxupfh`) for shared auth + synced stats; migrations in `supabase/migrations/`.
- Razorpay: verification was withdrawn 2026-11-20 and restarts later on hibidle.com. Keep `/api/razorpay/*` paths unchanged (the webhook URL uses them).
- Layout:
  - `app/(hub)/`: hub pages with a left rail (`/` home, `/charts`, `/friends`, `/chat`, `/me`). CSS scoped under `.hub` in `app/(hub)/hub.css` and `pages.css`.
  - `app/op-quiz/`: the kikoe game route. Game code in `games/op-quiz/`, main component `OpQuizGame.tsx`.
  - `games/registry.ts`: lists the games.
  - `platform/`: shared code (`cloud.ts` auth/sync, `useSupporter`, themes, Turnstile, `hub.tsx` with `useHub()`). Shared code goes here; game-specific code stays in `games/<game>/`. Do not hard-code OP Quiz into shared tables or routes.
  - `components/hub/`: hub UI, incl. code-drawn pixel scenes (`pixel.ts`, `scenes.ts`, `PixelCanvas.tsx`) and `Sprites.tsx` (pixel avatars and icons).
  - Old `/?mode|era|type` links redirect to `/op-quiz` (`next.config.ts`).
  - Friends, Chat and leaderboards are demo data until HUB-PLAN P4/P5.
  - Never use `useSearchParams` in hub pages (under `cacheComponents` it left the home grid stuck in a hidden Suspense container) and never read `Date.now()` during render (breaks prerender); read both after mount.
  - Design run notes (references, rounds, critic scores): `cook/` (gitignored, local only).
- localStorage shares one origin across the hub: the game uses `opq-*` keys, the post-sign-in return path uses `hibidle-return`. Every new game needs its own key prefix.
- Windows gotcha: never put `Foo.tsx` and `foo.ts` in one folder (tsc TS1149 case clash).

- Audio comes from iTunes Search API preview URLs only. Never rehost audio, never use a hidden YouTube player.
- Env vars `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` live in `.env.local` (gitignored) and Vercel; `NEXT_PUBLIC_` values bake in at build, so redeploy after changing them. Never put service_role/secret keys in the repo or a `NEXT_PUBLIC_` var.
