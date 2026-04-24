# PRD: Softball Lineup & Position Generator

## Problem Statement

Managing a co-ed recreational softball team requires generating fair lineups each game — balancing who plays which positions, who sits, and where players bat. Doing this manually is time-consuming and error-prone, often resulting in the same players getting stuck in bad positions or sitting too often. Co-ed rules (minimum women on field, batting order gender distribution) add additional complexity that is hard to track mentally across a season.

## Solution

A web application that generates fair, rules-compliant softball lineups per game. The coach marks RSVPs, saves attendance, and receives a fully generated lineup — batting order and inning-by-inning fielding assignments — that respects player preferences, co-ed rules, and season-level fairness history. The coach can reshuffle or manually adjust with real-time constraint validation.

## Ubiquitous Language

- **Season** — a fixed schedule of games (6 regular season + playoffs)
- **Game** — a single matchup, 5–6 innings
- **Inning** — one defensive half-inning; the atomic unit for fielding swaps
- **Roster** — all players registered to a season
- **Player** — a person with position preferences, gender, and season history
- **Guest** — a one-off player for a single game with no season history
- **RSVP** — per-game attendance status: `Present | Absent | Late`
- **ActiveRoster** — players with `Present` or `Late` RSVP for a given game
- **Position** — one of: `P, C, 1B, 2B, 3B, SS, LF, LCF, RCF, RF`
- **PositionPreference** — a player's declared tier for a position: `Tier1 | Tier2 | Tier3 | Anti`
- **FieldingSlot** — assignment of a player to a position for one inning
- **BattingSlot** — a player's position in the batting order (1–N)
- **InningCount** — number of innings a player fields in a game
- **Lineup** — full game plan: batting order(s) + fielding slots per inning
- **PositionHistory** — season record of how many times a player played each position
- **BattingHistory** — season record of batting order positions per game
- **UnifiedMode** — single interleaved batting order for all genders
- **SplitMode** — separate batting orders per gender, spliced live by coach during game

## User Stories

### Season Management
1. As a coach, I want to create a season with a name and number of games, so that I can organize my team's schedule.
2. As a coach, I want to view all games in a season, so that I can navigate to any game quickly.
3. As a coach, I want fairness history to carry over through regular season and playoffs, so that the system accounts for the full season when making decisions.

### Roster & Player Management
4. As a coach, I want to add players to a season roster, so that I can track who is on my team.
5. As a coach, I want to record each player's gender, so that the system can enforce co-ed rules.
6. As a coach, I want to set a player's position preferences (Tier 1, Tier 2, Tier 3, Anti) across all 10 positions, so that the system knows where they want to play.
7. As a coach, I want to assign multiple positions to each preference tier, so that players can express nuanced preferences.
8. As a coach, I want to edit a player's position preferences during the season, so that I can update them if a player's availability or skill changes.
9. As a coach, I want to add a guest player to a specific game without adding them to the full season roster, so that I can accommodate one-off substitutes.
10. As a coach, I want to view a player's season history (positions played, batting slots), so that I can understand their experience so far.

### RSVP Management
11. As a coach, I want to mark each player's RSVP status (Present, Absent, Late) before a game, so that the lineup generator knows who is available.
12. As a coach, I want to save RSVPs and trigger lineup generation in one action, so that the workflow is fast.
13. As a coach, I want the lineup to be locked once the game starts, so that mid-game changes don't disrupt the plan.

### Lineup Generation — Fielding
14. As a coach, I want the system to assign players to positions for each inning, so that I don't have to manually track rotations.
15. As a coach, I want the system to never assign a player to a position they marked as Anti, so that player hard limits are always respected.
16. As a coach, I want all players to play within ±1 inning of each other, so that playing time is fair.
17. As a coach, I want players with fewer innings played to have lower priority for sitting, so that sitting is distributed fairly.
18. As a coach, I want players who must sit to sit earlier in the game if they are batting early in the order, so that their overall game impact is balanced.
19. As a coach, I want players batting in the bottom third of the order to play inning 1 when possible, so that the impact of sitting and batting late doesn't compound.
20. As a coach, I want Late players to sit inning 1, so that their absence at game start is handled gracefully.
21. As a coach, I want at least 3 women on the field at all times, so that co-ed rules are met.
22. As a coach, I want no more than 7 men on the field at any time, so that co-ed rules are met.
23. As a coach, I want the system to drop the Catcher position first when short on women, so that the most dispensable position is sacrificed.
24. As a coach, I want the system to drop Left Field next if still short on women, so that the field degrades gracefully.
25. As a coach, I want the system to warn me if fewer than 1 woman is available (disqualification risk), so that I'm aware before the game.
26. As a coach, I want pitcher assignments to be consistent within a game (1 pitcher = full game, 2 = halves, 3 = 2 innings each, 4 = max, 2+2+1+1), so that pitchers have stable roles.
27. As a coach, I want no more than 4 pitchers used per game, so that pitching stays organized.
28. As a coach, I want pitchers to play other positions in their non-pitching innings, so that no one sits unnecessarily.
29. As a coach, I want position assignments to favor players' higher preference tiers, so that players enjoy the game more.
30. As a coach, I want position assignment tiebreaks resolved by season history (who played a position least recently), so that rotation is fair over time.
31. As a coach, I want guest players to yield to regular players in position tiebreaks, while still receiving fair preference-tier matching, so that regulars' season fairness is protected.

### Lineup Generation — Batting (Unified Mode)
32. As a coach, I want a single interleaved batting order in unified mode, so that all players bat together.
33. As a coach, I want no more than 3 consecutive men between any two women in the batting order, so that co-ed batting rules are met.
34. As a coach, I want the batting order to wrap around and still enforce the 3-man rule, so that the rule holds throughout the game.
35. As a coach, I want women to never bat 1st or 2nd in the order, so that co-ed batting conventions are respected.
36. As a coach, I want women to be maximally spread through the batting order, so that the order is as balanced as possible.
37. As a coach, I want batting order positions to rotate across games based on history, so that no player always bats in the same spot.
38. As a coach, I want players who batted late last game to bat earlier this game, so that batting fairness compounds over the season.
39. As a coach, I want Late players to bat lower in the order, so that their late arrival doesn't disrupt the top of the lineup.

### Lineup Generation — Batting (Split Mode)
40. As a coach, I want to toggle split mode per game, so that I can use it when gender ratios are lopsided.
41. As a coach, I want split mode to produce two independent batting orders (one per gender), so that each gender bats through their own list.
42. As a coach, I want the system to splice women into the men's order every 3rd man during the game, so that the interleaving is predictable (handled live, not pre-computed).
43. As a coach, I want split mode to still enforce the same fielding grid and co-ed field rules, so that the game is still co-ed compliant.
44. As a coach, I want women to play every inning in split mode when only 3 women are present, so that short-handed women aren't penalized.
45. As a coach, I want ±1 inning fairness applied within each gender group separately in split mode, so that each group is internally fair.
46. As a coach, I want batting history tracked per player regardless of mode, so that unified and split games contribute to the same history.

### Manual Adjustments
47. As a coach, I want to reshuffle the entire lineup with one action, so that I can get a fresh valid lineup if I dislike the generated one.
48. As a coach, I want to manually swap players between positions or innings, so that I can make targeted adjustments.
49. As a coach, I want the system to warn me in real-time when a manual swap violates a constraint (Anti position, gender rule, etc.), so that I'm aware of rule violations.
50. As a coach, I want to override warnings and save an invalid lineup anyway, so that I retain final authority over all decisions.

### Views
51. As a coach, I want a Season view showing all games and the season roster, so that I have a high-level overview.
52. As a coach, I want a Game view showing RSVP status and the generated lineup, so that I can manage each game in one place.
53. As a coach, I want a Lineup view showing the batting order and an inning-by-inning fielding grid, so that I can see the full game plan at a glance.
54. As a coach, I want a Player view showing a player's preferences and season history stats, so that I can understand and manage individual players.

## Implementation Decisions

### Constraint Priority Order
When multiple rules conflict during generation, resolve in this order:
1. Hard constraints — Anti-preference never assigned; gender field minimums; ±1 inning rule
2. Batting-position sit rule — top third of order sits inning 1 if needed; bottom third plays inning 1 if needed; middle third is neutral
3. Co-ed batting rule — max 3 consecutive men between women (wrap-around); no woman bats 1st or 2nd; maximize spread
4. Late player rules — sit inning 1; bat lower in order
5. Pitcher consistency rules — assign pitchers per schedule before other positions
6. Season history fairness — position rotation tiebreak; batting order rotation
7. Preference tiers — Tier1 > Tier2 > Tier3
8. Guest player yield — guests yield to regulars in tiebreaks

### Modules

**1. Domain Models**
Pure TypeScript types and value objects. No DB dependencies.
- `Player` — id, name, gender, isGuest
- `Position` — union type of 10 position strings
- `PositionPreference` — player id, position, tier (Tier1 | Tier2 | Tier3 | Anti)
- `Season` — id, name, game count
- `Game` — id, season id, date, inning count (5 or 6), mode (Unified | Split)
- `Roster` — season id, player ids
- `RSVP` — game id, player id, status (Present | Absent | Late)
- `FieldingSlot` — game id, inning, player id, position
- `BattingSlot` — game id, player id, order index, gender group (for split mode)
- `Lineup` — game id, fielding slots, batting slots
- `PositionHistory` — player id, season id, position, count
- `BattingHistory` — player id, season id, game id, batting slot

**2. Preference Engine**
Given a player and position, returns the preference tier. Validates that Anti positions are never assigned. Simple, pure functions.

**3. Fielding Assignment Engine**
Core complexity module. Inputs: active roster, position preferences, position history, RSVP statuses, game inning count, mode.
Outputs: inning-by-inning fielding grid.
Enforces all fielding constraints in priority order.
Handles pitcher scheduling, gender field rules, innings fairness, sit rules.

**4. Batting Order Engine**
Inputs: active roster, gender breakdown, mode, batting history, RSVP statuses, fielding assignments (for top/bottom third sit rule cross-reference).
Outputs: one batting order (unified) or two (split).
Enforces co-ed batting rules, history-based rotation, late player placement.

**5. Lineup Generator**
Thin orchestrator. Calls Fielding Assignment Engine then Batting Order Engine. Returns complete Lineup. No business logic of its own.

**6. History Tracker**
Reads and writes PositionHistory and BattingHistory. Provides query interface: "who played P least recently", "what slot did player X bat last game". Used by engines for tiebreaking.

**7. RSVP Manager**
Manages per-game attendance. Derives ActiveRoster from RSVPs. Exposes late player list separately.

**8. Constraint Validator**
Validates any Lineup against all rules. Returns structured list of violations with severity (error | warning). Powers real-time feedback during manual swaps and override flow.

**9. Database Layer**
Drizzle ORM with PostgreSQL. Schema mirrors domain models. Repository pattern — one repository per aggregate root (PlayerRepository, GameRepository, LineupRepository, HistoryRepository).

**10. API Layer**
Next.js API routes. Thin — validates input, calls domain modules, returns results. Routes: CRUD for seasons, games, players, preferences, RSVPs; lineup generation; reshuffle; manual swap with validation.

**11. UI**
Next.js pages. Four views: Season, Game, Lineup, Player. Lineup view shows batting order and fielding grid. Manual swap UI shows real-time constraint warnings.

### Database
PostgreSQL locally via Docker. Drizzle ORM for schema, migrations, and queries. Designed for future deployment to Neon or Supabase without query changes.

### Authentication
None for local use. Login required when deployed (future scope).

## Testing Decisions

**What makes a good test:** Tests verify external behavior of a module through its public interface only. No testing of internal implementation details or private methods. Tests should be readable as specifications of expected behavior.

**Modules with tests:**

- **Domain Models (1)** — test value object construction, validation rules (e.g. a player cannot have the same position in two tiers), type narrowing
- **Preference Engine (2)** — test tier lookup, Anti enforcement, edge cases (position not in any tier defaults to neutral)
- **Fielding Assignment Engine (3)** — most critical test suite. Test: Anti never assigned, ±1 inning rule, gender field minimums, pitcher scheduling for 1/2/3/4 pitcher scenarios, sit priority rules, batting-position sit rule, late player sit in inning 1, guest player yield
- **Batting Order Engine (4)** — test: unified co-ed rules (max 3 men between women, wrap-around, no woman slots 1-2), split mode independent orders, history-based rotation, late player placement, fairness distribution
- **Lineup Generator (5)** — integration test: valid complete lineup produced from a given active roster and history. Tests that fielding and batting outputs are internally consistent.
- **History Tracker (6)** — test: position history increments correctly after a game, batting history records correct slot, tiebreak queries return correct player
- **Constraint Validator (8)** — test: every rule produces the correct violation type and severity. Test that overrideable warnings are distinct from hard errors.

## Out of Scope

- Player-facing views (future: player can view their own lineup and history)
- Authentication and user accounts (future: required for deployment)
- Mobile app (web only)
- Mid-game lineup changes after game is locked
- Automatic out tracking for single-woman split mode (handled live by coach)
- Multi-team or multi-league support
- Playoff bracket management

## Further Notes

- **Split vs Unified mode** is a per-game toggle. History (batting and position) is always tracked per player regardless of mode.
- **Guest players** have no history. They receive preference-tier matching but yield to regular players in all tiebreaks.
- **Innings per game** is 6 by default, 5 when cut for time. The coach sets this before or at generation time.
- **Reshuffle** produces a new valid lineup using the same constraints but with randomness injected at tiebreak points.
- **Manual swap validation** warns on violations but always allows coach override — the system is advisory, not authoritative.
- The **drop order** when short on women for the field: drop Catcher first, then Left Field. Below 1 woman = disqualification warning.
- **Pitcher drop order when 4 pitchers**: 2 pitchers get 2-inning slots, 2 get 1-inning slots. Who gets which is random; pitching order (who goes first) is random.
- Top/bottom/middle thirds for the batting-position sit rule are **dynamic per game** based on active roster count.
