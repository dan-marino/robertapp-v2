# Stats Feature — Design Spec

## Data Model

### `game_stats` table

One row per player per game. Upsertable (supports editing after initial save). Guests are included.

| Column | Type | Notes |
|---|---|---|
| `gameId` | FK → games | |
| `playerId` | FK → players | includes guests |
| `s1b` | int | singles |
| `s2b` | int | doubles |
| `s3b` | int | triples |
| `hr` | int | home runs |
| `bb` | int | walks |
| `k` | int | strikeouts |
| `fo` | int | fly outs |
| `fc` | int | fielder's choices |
| `go` | int | ground outs |
| `sf` | int | sacrifice flies |
| `rbi` | int | runs batted in |
| `r` | int | runs scored |

### Derived stats (computed, never stored)

| Stat | Formula |
|---|---|
| AB | `s1b + s2b + s3b + hr + k + fo + fc + go` (BB and SF excluded) |
| H | `s1b + s2b + s3b + hr` |
| TB | `s1b + (2 × s2b) + (3 × s3b) + (4 × hr)` |
| BA | `H / AB` |
| OBP | `(H + BB) / AB` |
| SLG | `TB / AB` |

BA, OBP, and SLG display as `—` when AB = 0.

## Game Page — Stats Tab

A new tab on `/games/[id]`, alongside the existing Lineup and RSVPs tabs.

### Players shown

Active roster for the game: players with RSVP status Present or Late, plus any guests. Absent players are excluded.

### Entry UI

One row per player:

- **PA string input** — space-separated, case-sensitive tokens representing each plate appearance in sequence. Valid tokens: `1B` `2B` `3B` `HR` `BB` `K` `FO` `FC` `GO` `SF`. Unknown tokens show an inline error identifying the offending token; the row cannot be saved until resolved.
- **RBI** — number field (total for the game)
- **R** — number field (total for the game)

When the PA string is valid, the UI shows a live preview of the derived counts (AB, H, BB, etc.) before saving.

### Save behaviour

- Explicit **Save** button (no auto-save)
- Fully editable after initial save
- On re-edit, the PA string is reconstructed from stored counts in canonical token order: `1B 2B 3B HR BB K FO FC GO SF`
- Saving upserts the `game_stats` row for each player

## Season Page — Stats Section

A new section on `/seasons/[id]` showing cumulative stats across all games in the season.

### Table columns

`Player | G | AB | H | 1B | 2B | 3B | HR | BB | K | SF | RBI | R | BA | OBP | SLG`

- **G** — games where the player has at least 1 PA recorded
- **BA** — `H / AB`, shown as `—` when AB = 0
- **OBP** — `(H + BB) / AB`, shown as `—` when AB = 0
- **SLG** — `TB / AB`, shown as `—` when AB = 0

### Display rules

- All season players shown, including those with no stats yet (their counting stats show `0`, rate stats show `—`)
- No minimum PA threshold for MVP
- FO, FC, GO are not shown as separate columns (they are noise at the season level; AB already captures them)
