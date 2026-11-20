# CLAUDE.md

Daily "guess the anime from its opening" web game (Heardle-style, clips start at 0.1s), name kikoe.io. Live; spec and progress in `SPEC.md`.

- **Game hub (decided 2026-11-20):** this game will live with the other games in `../` (see `../CLAUDE.md`) in one Next.js app, each game on its own route, with one shared Supabase account. This repo is the likely base for the hub (not confirmed). Build new shared code (auth, stats, share, Supporter) so another game can reuse it, keep game-specific code and localStorage keys (`opq-*`) separate, and do not hard-code OP Quiz into shared tables or routes.

- Audio comes from iTunes Search API preview URLs only. Never rehost audio, never use a hidden YouTube player.
- Stack: Next.js on Vercel (`anime-op-quiz-alpha.vercel.app`, Git-linked to GitHub `qwertxboxmicro-alt/anime-op-quiz`: pushes to `main` deploy to production). Supabase project `anime-op-quiz` (ref `meqpyffiuqylljsxupfh`) for auth + synced stats; migrations in `supabase/migrations/`.
- Env vars `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` live in `.env.local` (gitignored) and Vercel; `NEXT_PUBLIC_` values bake in at build, so redeploy after changing them. Never put service_role/secret keys in the repo or a `NEXT_PUBLIC_` var.
