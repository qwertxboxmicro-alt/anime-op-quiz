---
name: preflight
description: Type check and production-build anime-op-quiz before committing. Use when asked to verify, preflight, or before any commit.
---

1. Run `npx tsc --noEmit`. Stop and report errors if it fails.
2. Run `npm run build`. Report the first failing route or error.
3. Report pass or fail plainly; do not commit or push.
