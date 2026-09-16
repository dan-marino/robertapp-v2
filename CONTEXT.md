# Context

## Domain glossary

The full ubiquitous language is in [`UBIQUITOUS_LANGUAGE.md`](./UBIQUITOUS_LANGUAGE.md). Read it before exploring any domain code. The terms below extend it for the stats feature.

## Stats

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **GameStat** | A record of a Player's batting performance for a single Game; one row per Player per Game in `game_stats` | Box score, game stats, batting line |
| **SeasonStat** | The aggregated GameStats for a Player across all Games in a Season; derived at query time, never stored | Season totals, cumulative stats |
| **PlateAppearance (PA)** | One turn at bat, regardless of outcome; includes hits, walks, strikeouts, outs, and sacrifice flies | At-bat (PA ≠ AB — see AB) |
| **AtBat (AB)** | A PlateAppearance that counts toward batting average; PA minus walks (BB) and sacrifice flies (SF). Derived — never stored | PA (AB is a strict subset of PA) |
| **PAToken** | A single case-sensitive string token representing one PlateAppearance outcome. Valid tokens: `1B` `2B` `3B` `HR` `BB` `K` `FO` `FC` `GO` `SF` | Outcome, result |
| **PA string** | The Coach's input for a Player's Game stats: a space-separated sequence of PATokens (e.g. `1B GO BB HR FO`); parsed server-side into counts | Stat string, outcome string |
| **CountingStat** | A raw integer stored in `game_stats` (e.g. `s1b`, `bb`, `rbi`); the source of truth | Raw stat |
| **DerivedStat** | A stat computed from CountingStats at read time; never stored (AB, H, TB, BA, OBP, SLG) | Computed stat, calculated stat |

## ADRs

See [`docs/adr/`](./docs/adr/) for decisions that affect this codebase. Read any ADR that touches the area you are working in before writing code.
