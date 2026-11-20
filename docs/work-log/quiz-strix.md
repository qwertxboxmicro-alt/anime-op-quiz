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

## Update 2026-11-18: key fixed, Groq removed
- New OpenRouter key in `~/.strix/cli-config.json` verified valid (50 credit limit). Model: `openrouter/thinkingmachines/inkling-2-small:free`.
- User-level `STRIX_LLM` / `LLM_API_KEY` (old Groq config) deleted, so the file config is used. Groq is not used for Strix anymore.
- **When the model hits its cap/limit, change the model in `~/.strix/cli-config.json` (`STRIX_LLM`) to another free+tools OpenRouter model from the fallback list above, then `strix --resume <run-name>` with the same flags.** Strix does not switch models by itself.
- Scan not yet run.

## Scan run 2026-11-18 (completed)
Target: local prod build (`npm run build && npm start`, port 3000, dummy Supabase URL `http://127.0.0.1:9`, anon key `dummy`). `strix -n -m standard --max-budget 5`, model `openrouter/thinkingmachines/inkling-2-small:free`, private config copy, `env -u STRIX_LLM -u LLM_API_KEY` (the shell had those vars set again; the file config was used). Ran ~20 min, 578 LLM requests, 54.5M input tokens, no model cap hit. Run dir `strix_runs/host-docker-internal-3000_e53d` (gitignored).

Result: **1 finding, LOW (CVSS 3.7, CWE-602)**, no Critical/High/Medium.
- `/anime.json` (public autocomplete list, 1500 titles) plus the daily schedule formula in the client bundle lets anyone derive the daily answer. Game integrity only. **Not fixed**: the game is fully client-side by design (SPEC); fixing needs server-side answer checking. Accepted risk, no anti-cheat guarantee.

Strix also reported, no vulnerability: `/api/delete-account` fail-closed on ~150 probes (always the same 503 generic body; note the service key was unset, so auth/origin branches still untested); `/_next/image` no SSRF/open proxy; no source maps, `.env`, `.git`; middleware-bypass headers ineffective; no secrets in the bundle; no DOM sink, localStorage `opq-*` values render escaped, no prototype pollution; no cookies; CSP identical on all routes.

Notes (not fixed, no code changed):
- CSP still has `'unsafe-inline'` for script/style (known, accepted).
- Robustness only: `components/Game.tsx` `o?.start in SCHEDULES` accepts inherited keys like `"toString"` from a tampered `opq-opts`; use `Object.hasOwn(SCHEDULES, o?.start)`. Left alone because another session is editing Game.tsx. Also validate `opq-stats` `dist` shape on read.
- Possible later: COOP/CORP headers, canonical origin for og:image.
- Coverage limit: black-box, unauthenticated, no live Supabase. Re-run after wiring auth or the delete-account service key against a test Supabase project.

## Re-run 2026-11-20: BLOCKED (LLM upstream), no scan completed
Target: local prod build on port 3000 (`npm run build`, `next start`), dummy Supabase URL `http://127.0.0.1:9`, anon key `dummy`, `SUPABASE_SERVICE_ROLE_KEY` empty (so delete-account fails closed, 503, as in the last scan). `strix -n -m standard --max-budget 5`, `env -u STRIX_LLM -u LLM_API_KEY`. Docker Desktop started; daemon up (Docker 29.9.3).

| Model tried | Result |
|---|---|
| `openrouter/thinkingmachines/inkling-2-small:free` (file config) | 404: "unavailable for free, paid version is available: `thinkingmachines/inkling-2-small`". Not switched to the paid slug (would spend the owner's credit). |
| `openrouter/inclusionai/ling-3.2-flash:free` (private config copy) | 429 upstream rate limit (shared pool) |
| `openrouter/nvidia/nemotron-3.5-lightning:free` (private config copy) | no answer in 30 s (LLM_PREFLIGHT_TIMEOUT) |

Free + tools list at the time (OpenRouter `/models`, 2026-11-20): ling-3.2-flash, ernie-5.5-flash-preview, lfm-3-1.7b, particle-1, flint-v1.0, nemotron-3.5-super-vl, dots-3-note-preview, nemotron-3.5-lightning, nemotron-3-ultra-550b, nemotron-3-nano-omni, gemma-4-26b-it, gemma-4-31b-it, openrouter/free.

Result: **0 scan requests, 0 findings.** The earlier 2026-11-18 scan stays the latest.
Owner must choose one:
1. Pay for the model (`thinkingmachines/inkling-2-small`, paid) in `~/.strix/cli-config.json`, or
2. Add your own provider key (BYOK) on OpenRouter for a free model, or
3. Retry later when a free slug has quota.
Then re-run with the command in "Re-run" above (env -u for both vars, same port 3000 prod build). Strix writes config back to the file it runs with: use a private `--config` copy, as tried here.
