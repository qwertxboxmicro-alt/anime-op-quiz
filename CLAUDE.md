# CLAUDE.md

Daily "guess the anime from its opening" web game (Heardle-style, clips start at 0.1s). Spec only so far: see `SPEC.md`.

- Audio comes from iTunes Search API preview URLs only. Never rehost audio, never use a hidden YouTube player.
- Stack: Next.js on Vercel (`anime-op-quiz-alpha.vercel.app`, deployed via `vercel deploy`, not Git-linked). Supabase project `anime-op-quiz` (ref `meqpyffiuqylljsxupfh`) for auth + synced stats; migrations in `supabase/migrations/`.
- Env vars `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` live in `.env.local` (gitignored) and Vercel; `NEXT_PUBLIC_` values bake in at build, so redeploy after changing them. Never put service_role/secret keys in the repo or a `NEXT_PUBLIC_` var.
