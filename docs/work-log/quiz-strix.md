# Strix scan log: anime-op-quiz (branch claude/kind-germain-b50469)

Date 2026-11-17. Target: local dev server `http://localhost:3000`, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9` (unreachable on purpose), anon key `dummy`, no `.env.local`, no service-role key. Nothing pushed or merged.

## Result: Strix scan BLOCKED, 0 scan requests completed, 0 Strix findings

| Run | Model | Result |
|---|---|---|
| 1 | `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` (top free+tools pick) | `401 API key expired` from OpenRouter, before any agent step |
| (diagnostic) | `groq/openai/gpt-oss-120b` (the **shell environment** has `STRIX_LLM`/`LLM_API_KEY` set to a Groq config, which overrides `~/.strix/cli-config.json`) | Groq 400: `invalid JSON schema for tool list_mcps ... 'required' present but 'properties' is missing`. Strix's own tool schema is rejected by Groq; provider-side, any Groq model will fail. Not patched (installed package). |

The OpenRouter key in `~/.strix/cli-config.json` is expired, so every OpenRouter model (free or not) fails identically; trying more models cannot help. Fallback list was fetched (free + tools, by context): ling-3.2-flash, inkling-2-small, particle-1, ernie-5.5-flash-preview, nemotron-3.5-super-vl, nemotron-3.5-lightning, gemma-4-31b-it. None tried (same key).

Docker: was not running; started Docker Desktop once, came up in ~10 s. No scanner container left running. Project folder was never mounted. `strix_runs/` is gitignored (no real run was produced).

## Owner must
1. Put a valid OpenRouter key (or other provider key Strix supports) into `~/.strix/cli-config.json`. **Also** clear or fix the shell/user env vars `STRIX_LLM` and `LLM_API_KEY` (they currently point to Groq and win over the file).
2. Gotcha: Strix **rewrites the config file** with whatever env vars are set when run (`persist_current`), including `--config` copies. Run with `env -u STRIX_LLM -u LLM_API_KEY` and a private config copy.

## Re-run
```
npm ci
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run dev   # background, port 3000
env -u STRIX_LLM -u LLM_API_KEY strix -n -m standard -t http://localhost:3000 --instruction-file docs/strix-instructions.txt --max-budget 5
# resume after a limit: strix --resume <run-name> (same flags); switch model via a copy of the config with a different STRIX_LLM and --config
```

## Manual checks (curl, not Strix) against the local server, as a partial stand-in
With the service-role key unset, `/api/delete-account` returns 503 before auth/origin logic runs, so those branches were NOT exercised here (they need a test Supabase project).

| Check | Result |
|---|---|
| POST no auth / bad bearer / evil Origin | all 503 `{"error":"Account deletion is unavailable."}` (fail closed, generic) |
| GET/PUT/DELETE/PATCH | 405 |
| OPTIONS with evil Origin | 204, no `Access-Control-Allow-*` headers (no CORS widening) |
| 2 MB body, bad bearer | 503, handled |
| Headers | CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy, HSTS present; no X-Powered-By |
| `/.env.local`, `/.git/config`, `*.js.map` | 404 |
| `/_next/image?url=http://127.0.0.1:9/x` | 400 (no open proxy) |
| `/auth/callback` | 404 (no such route, so no open redirect there) |
| innerHTML / dangerouslySetInnerHTML in app, components, lib | none |

Dev-only: CSP includes `'unsafe-eval'` and `ws:` (dev mode); prod build does not. Known, accepted: `'unsafe-inline'` scripts. `/anime.json` is public (autocomplete list; not checked for daily-answer leakage).

## Findings
None (scan did not run). No code changed, so no fixes to revert except the instruction/gitignore commit: `git revert <sha>` of "Add Strix instruction file".
