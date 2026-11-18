# Quiz offset audit

Generated 2026-11-18 by `scripts/audit-offsets.mjs` (read-only; `data/openings.ts` untouched).

**Caveat: this is automated. It cannot judge by ear.** It checks that the preview resolves, track/artist roughly match, the offset leaves room for the longest daily clip (8s), and that audio isn't near-silent at the offset (RMS vs track average). A passing row can still start on a boring spot; a suggested offset is just the loudest attack that fits, not a verified "recognisable" spot. Owner should listen.

- Openings checked: 60; flagged: 1
- Daily longest clip: 8s. Longest endless clip: 20s (the "2s" start mode, schedule 2..20).

## Flagged
| Anime | Song | Offset | Issues | Suggested |
|---|---|---|---|---|
| Dragon Ball Z | Cha-La Head-Cha-La | 0.7 | quiet start (first 0.5s RMS 38% of avg) | 0.70 |

## Endless 20s clip would run past preview end
Not a bug (clip just plays to end of preview, shorter than labelled); informational. 32 entries: Fullmetal Alchemist: Brotherhood (18.2s), JUJUTSU KAISEN (17.85s), Sword Art Online (16.6s), Bleach (12.3s), HAIKYU!! (11.25s), OSHI NO KO (16.15s), My Hero Academia (10.45s), Dr. STONE (14.75s), Naruto Shippuden (19.55s), Naruto (14s), Neon Genesis Evangelion (17.55s), Steins;Gate (17.85s), KONOSUBA (15.05s), Kaguya-sama (17.9s), Dandadan (11.1s), Frieren (19s), Bocchi the Rock! (15.9s), Puella Magi Madoka Magica (17.4s), Fate/Zero (12.75s), Nisekoi (11.9s), MASHLE (14.45s), JoJo's Bizarre Adventure (19.6s), Charlotte (14.85s), Angel Beats! (14.85s), Gurren Lagann (18.3s), The Melancholy of Haruhi Suzumiya (14.05s), Soul Eater (16.1s), The Promised Neverland (15.25s), Fire Force (19.65s), Kill la Kill (13.15s), Psycho-Pass (15.85s), Kaiju No. 8 (10.15s).
