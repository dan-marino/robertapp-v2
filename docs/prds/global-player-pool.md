# PRD: Global Player Pool, CSV Import, Traded Flag & Game Details

> GitHub Issue: #20

## Problem Statement

Managing players across seasons is tedious. Every new season requires re-entering players from scratch, even though most of the team carries over. There's no way to mark players who've left the team, no way to import player data in bulk, and game records are missing key info (time, opponent) with no way to edit them after creation.

## Solution

Introduce a global player pool as the single source of truth for all players. Season rosters are built by picking from this pool rather than creating new players each time. Players who've left can be marked as traded, hiding them from new season pickers without losing historical data. Bulk CSV import lets managers seed the pool quickly. Game records gain time and opponent fields and become editable after creation.

## User Stories

1. As a team manager, I want a global players page, so that I can see and manage all players in one place.
2. As a team manager, I want to add a new player to the global pool with a name and gender, so that they're available to add to any season.
3. As a team manager, I want to mark a player as traded, so that they no longer appear when I'm building a new season roster.
4. As a team manager, I want traded players hidden by default on the global players page, so that the list stays clean and focused.
5. As a team manager, I want a "Show traded players" toggle on the global players page, so that I can see and manage players who've left the team.
6. As a team manager, I want traded players to appear greyed out with a "Traded" badge when shown, so that I can visually distinguish them from active players.
7. As a team manager, I want to un-trade a player with one click, so that I can reinstate someone who has returned to the team.
8. As a team manager, I want to build a season roster by selecting from the global player pool, so that I don't have to re-enter player info each season.
9. As a team manager, I want the season roster picker to be searchable and filterable, so that I can quickly find players on larger rosters.
10. As a team manager, I want traded players excluded from the season roster picker, so that I'm not distracted by players who are no longer on the team.
11. As a team manager, I want an "Add new player" escape hatch on the season roster picker, so that I can add a brand new player to the global pool and season roster in one step.
12. As a team manager, I want to import players from a CSV file on the global players page, so that I can seed the player pool quickly without manual data entry.
13. As a team manager, I want the CSV to support name, gender, and position preferences (Tier1/Tier2/Tier3/Anti) per position, so that I can import all player data in one shot.
14. As a team manager, I want duplicate player names in the CSV to be skipped rather than overwritten, so that I don't accidentally corrupt existing player records.
15. As a team manager, I want a summary of skipped rows after a CSV import, so that I know which players weren't imported and why.
16. As a team manager, I want to add a game time when creating a game, so that players know when to show up.
17. As a team manager, I want to add an opponent name when creating a game, so that the schedule is clear.
18. As a team manager, I want to edit a game's date, time, opponent, and inning count after creation, so that I can handle reschedules and corrections.
19. As a team manager, I want edited game info reflected immediately on the game page, so that I don't have to refresh or navigate away.
20. As a team manager, I want past season rosters to still show traded players, so that historical lineups remain accurate.

## Implementation Decisions

### Schema changes
- `players` table: add `traded` boolean, default false
- `games` table: add `time` text (nullable), add `opponent` text (nullable)

### New domain module
- `parsePlayerCSV` — pure function, no DB or I/O. Takes raw CSV string, returns `{ players: ParsedPlayer[], preferences: ParsedPreference[], skipped: string[] }`. CSV columns: `name`, `gender`, `P`, `C`, `1B`, `2B`, `3B`, `SS`, `LF`, `LCF`, `RCF`, `RF`. Position values: `Tier1` / `Tier2` / `Tier3` / `Anti` / blank.

### API changes
- `GET /api/players` — new route, returns all non-traded players by default; `?includeTraded=true` returns all
- `POST /api/players` — new route, creates a player in the global pool
- `PUT /api/players/[id]` — extend existing route to accept `traded` boolean alongside name/gender
- `POST /api/players/csv` — new route, accepts CSV body, runs `parsePlayerCSV`, inserts players + preferences, skips duplicates by name, returns skipped list
- `POST /api/seasons/[id]/players` — extend to accept either `{ playerId }` (existing player) or `{ name, gender }` (new player, creates globally then adds to season)
- `PUT /api/games/[id]` — extend existing route to accept `time`, `opponent`, `date`, `inningCount` alongside `mode`

### UI changes
- New `/players` page (server component) with `PlayerList` client component
- `PlayerList`: shows active players, inline traded toggle per row, "Show traded" toggle at top reveals greyed/badged traded players
- `AddPlayerForm`: inline form on `/players` for adding new players to the global pool
- `CSVImporter`: file upload on `/players`, parses CSV client-side, POSTs to `/api/players/csv`, shows skipped summary
- `RosterPicker`: replaces the free-form add form in `RosterManager`; searchable checklist of non-traded global players; checked = on season roster; "Add new player" escape hatch
- `GameEditor`: inline edit form on the game page for date, time, opponent, inning count; replaces static display of those fields

### Architectural notes
- `players` table already serves as the global pool — no new table needed
- `rosters` join table unchanged — season roster = subset of global pool linked by `playerId`
- Traded players remain on past season rosters (historical integrity); filter applies only to new season picker and default API response
- Global players page accessible from top-level nav

## Testing Decisions

Good tests verify external behavior, not implementation details. They should be runnable in isolation without mocking domain logic.

### `parsePlayerCSV` unit tests
- Valid CSV with all position columns → correct players + preferences returned
- Blank position cells → no preference record for that position
- Invalid tier value → preference omitted (silently ignored)
- Empty CSV → empty result, no error
- Duplicate name in same CSV → later row skipped, added to skipped list
- Prior art: existing domain tests in `src/domain/__tests__/`

### `GET /api/players` integration tests
- Default response excludes traded players
- `?includeTraded=true` response includes traded players

## Out of Scope

- Player photo or contact info
- Opponent team history or win/loss tracking
- Game location / field info
- CSV export
- Bulk editing of preferences outside of CSV import
- Authentication or multi-team support

## Further Notes

The "RollingRoster" concept is fulfilled by the existing `players` table — no new abstraction or table required. UI naming: "Players" for the global pool, "Roster" for the season-scoped subset.
