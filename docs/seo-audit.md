# SEO audit + plan: kikoe.io (2026-11-20)

**Update 2026-11-20:** the domain is the game hub's, `hibidle.com`; `kikoe.io` will not be bought. Where this audit says kikoe.io as a domain, use hibidle.com (OP Quiz will sit at `/op-quiz` in the hub). Domain cut-over waits for Razorpay approval (see `domain-setup.md`).

Scope: live `anime-op-quiz-alpha.vercel.app` + code in `app/`, `next.config.ts`. Method: curl probes + source read. Not run: Lighthouse/CWV, backlinks, GSC (no credentials).

Health score (rough): **~38/100**. Type: browser game / web app (no content pages).

## What's wrong

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 1 | Critical | Homepage HTML has **no body content**: no `<h1>`, no text. Crawlers and AI bots see an empty page until JS runs. | `components/Game.tsx:318` `if (!ready) return null;` ; live `<body>` is empty `<!--$-->` markers |
| 2 | Critical | **No `robots.txt`, no `sitemap.xml`** (both 404). | curl: 404 on both |
| 3 | Critical | **Production domain not live.** `kikoe.io` does not resolve; all metadata points at the `*.vercel.app` URL. | nslookup: Non-existent domain; `docs/domain-setup.md` |
| 4 | High | **No `metadataBase`, no canonical.** OG image URL is built from the Vercel host; once on kikoe.io, both hosts index as duplicates. | `app/layout.tsx:7-10`; no canonical in live head |
| 5 | High | **No structured data** (0 JSON-LD). Missing `WebSite` + `VideoGame`/`Game` schema. | live HTML |
| 6 | High | Single indexable page with ~0 indexable text. Nothing targets queries like "anime opening quiz", "guess the anime opening", "anime Heardle". | only `/`, `/privacy`, `/terms` exist |
| 7 | Medium | `/privacy` and `/terms` indexable and thin; fine, but no `noindex` decision made. | live meta |
| 8 | Medium | Title is 53 chars, ok, but leads with brand + colon; "0.1 seconds" is the hook, "anime opening quiz" keyword is absent. | `app/layout.tsx:8` |
| 9 | Medium | No `llms.txt`, no AI-crawler policy in robots (404). Low priority, optional. | curl |
| 10 | Low | Default Next boilerplate SVGs in `public/` (`next.svg`, `vercel.svg`, etc.). Harmless. | `public/` |
| 11 | Low | `public/anime.json` is 341 KB, publicly fetchable. Spoils the daily answer list; also not an SEO issue but affects the game. | `public/anime.json` |

Works already: HTTPS + HSTS, strong security headers/CSP, OG + Twitter card with 1200x630 image, `lang="en"`, viewport + theme-color, per-page titles/descriptions on legal pages, `noindex` 404.

## Concrete plan

### Phase 1: fix indexing (do first, ~1h)
1. **SSR a real shell.** In `Game.tsx`, stop returning `null` before mount. Render `<main><header><h1>kikoe.io</h1><p>…</p></header>` always; gate only the interactive/daily-dependent parts on `ready`. Add a short static intro block (what it is, how to play, 3 sentences) below the game.
2. Add `app/robots.ts`: allow `/`, disallow `/api/`, point to sitemap.
3. Add `app/sitemap.ts`: `/`, `/privacy`, `/terms`.
4. Add `metadataBase: new URL("https://hibidle.com")` (use env `NEXT_PUBLIC_SITE_URL`, fall back to vercel URL) + `alternates: { canonical: "/" }` in `layout.tsx`.

### Phase 2: domain (needs you)
5. Buy/attach `hibidle.com` per `docs/domain-setup.md` (after Razorpay approval); 301 the `*.vercel.app` host to it; add property in Google Search Console and submit the sitemap.

### Phase 3: on-page + schema (~1h)
6. Retitle: `Anime opening quiz: guess the anime in 0.1 seconds | kikoe.io`. Description: lead with "daily anime opening quiz".
7. JSON-LD on `/`: `WebSite` + `VideoGame` (`genre: Quiz`, `playMode: SinglePlayer`, free `offers`).
8. Mark `/privacy`, `/terms` as `index, follow` deliberately (or `noindex` them; either is fine).

### Phase 4: content + authority (Month 2+)
9. Crawlable archive pages (`/archive/[n]`) with a hint-only description (no answer in HTML before play), if you want long-tail pages. Risk: leaks answers; keep answers client-side.
10. Backlinks: r/anime, r/animemusic, Product Hunt, Heardle-clone directories. Share-result text already exists; make it include the URL.
11. Optional: `llms.txt`.

### Phase 5: monitor
12. GSC coverage + CWV after launch; rerun this audit.

## Not covered
CWV/Lighthouse numbers, backlink profile, competitor SERP check, GSC data. Say the word and I run the performance + SXO passes after Phase 1 ships.
