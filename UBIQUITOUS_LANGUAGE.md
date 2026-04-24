# Ubiquitous Language

## People

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Coach** | The sole user of the application; manages rosters, RSVPs, and lineups | Manager, admin, user |
| **Player** | A person registered to a season roster with position preferences, gender, and season history | Athlete, member, participant |
| **Guest** | A one-off player added for a single game who has no season history and yields to regulars in all tiebreaks | Sub, substitute, fill-in, temp |

## Season & Game Structure

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Season** | A fixed schedule of games (6 regular season + optional playoffs) that defines the scope of history tracking | League, year |
| **Game** | A single matchup within a season; has a date, inning count, mode, and one generated Lineup | Match, event |
| **Inning** | One defensive half-inning; the atomic unit for fielding assignments | Round, period, half |
| **InningCount** | The total number of innings a game will be played (5 or 6); set by the Coach before generation | Game length |
| **Roster** | The full set of Players registered to a season | Team, squad, player list |
| **ActiveRoster** | The derived set of Players with a Present or Late RSVP for a specific game; the actual input to lineup generation | Available players, game roster |

## Attendance

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **RSVP** | A Player's declared attendance status for a specific game: `Present`, `Absent`, or `Late` | Availability, attendance status |
| **Late** | An RSVP status indicating a player will arrive after game start; causes sit in Inning 1 and lower batting position | Tardy, delayed |

## Fielding

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Position** | One of ten named fielding locations: `P, C, 1B, 2B, 3B, SS, LF, LCF, RCF, RF` | Spot, slot, field position |
| **PositionPreference** | A Player's declared comfort tier for a given Position: `Tier1`, `Tier2`, `Tier3`, or `Anti` | Preference, skill rating |
| **Anti** | The special PositionPreference tier that is a hard constraint — a Player must never be assigned that Position | Blacklist, excluded, not allowed |
| **FieldingSlot** | The assignment of a single Player to a single Position for a single Inning | Field assignment, position slot |
| **FieldingGrid** | The complete inning-by-inning matrix of FieldingSlots for a Game | Fielding chart, fielding schedule |

## Batting

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **BattingSlot** | A Player's index in the batting order for a given Game (1 = lead-off) | Batting position, batting spot |
| **BattingOrder** | The ordered sequence of BattingSlots for a Game; either one (Unified) or two per gender (Split) | Lineup (avoid — Lineup means the full game plan) |
| **UnifiedMode** | A game mode producing a single interleaved BattingOrder for all genders | Combined mode |
| **SplitMode** | A game mode producing separate BattingOrders per gender, spliced live by the Coach during the game | Separate mode, gender mode |

## Fairness & History

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **PositionHistory** | A season-level record of how many times each Player has played each Position | Position stats, rotation history |
| **BattingHistory** | A season-level record of each Player's BattingSlot across all Games | Batting stats, order history |
| **InningsFairness** | The constraint that all Players in a Game must field within ±1 Inning of each other | Playing time balance |
| **Reshuffle** | A Coach-triggered action that produces a new valid Lineup using the same constraints with randomness injected at tiebreak points | Regenerate, re-roll |

## Lineup & Generation

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Lineup** | The complete game plan for a Game: one FieldingGrid plus one or two BattingOrders | Plan, schedule |
| **LineupGenerator** | The thin orchestrator that calls the Fielding Assignment Engine then the Batting Order Engine and returns a complete Lineup | Generator, builder |
| **Violation** | A constraint breach detected by the Constraint Validator, classified as `error` (hard block) or `warning` (overrideable) | Error (alone — too generic), issue, problem |

---

## Relationships

- A **Season** contains one or more **Games** and one **Roster**.
- A **Roster** contains **Players**; a **Game** can also have **Guests** added for that game only.
- An **ActiveRoster** is derived from the **Roster** + **Guests** filtered by **RSVP** status for a given **Game**.
- A **Lineup** belongs to exactly one **Game** and consists of one **FieldingGrid** and one or two **BattingOrders**.
- A **FieldingGrid** is composed of **FieldingSlots** (one per Player per Inning).
- A **BattingOrder** is composed of **BattingSlots** (one per Player).
- **PositionHistory** and **BattingHistory** accumulate across all **Games** in a **Season**, regardless of **UnifiedMode** or **SplitMode**.
- A **Guest** participates in **FieldingSlots** and **BattingSlots** but never contributes to or reads from **PositionHistory** or **BattingHistory**.

---

## Example dialogue

> **Dev:** "When the Coach marks RSVPs and hits generate, what does the system use as input?"
>
> **Domain expert:** "The **ActiveRoster** — that's the Players from the **Roster** (plus any **Guests**) who have a Present or Late **RSVP**. The full **Roster** doesn't matter for generation."
>
> **Dev:** "Got it. And a Late player — do they appear in the **FieldingGrid** at all?"
>
> **Domain expert:** "Yes, they're in the **ActiveRoster**, but the system always leaves them out of Inning 1. They still get a **BattingSlot**, just pushed lower in the **BattingOrder**."
>
> **Dev:** "If I'm looking at the **FieldingGrid**, what's one row — one Inning or one Player?"
>
> **Domain expert:** "One **Inning**. Each cell in that row is a **FieldingSlot** — one Player at one Position for that Inning. The grid is innings × positions."
>
> **Dev:** "When the Coach drags two players to swap positions, what checks run?"
>
> **Domain expert:** "The Constraint Validator evaluates the new **Lineup** and returns any **Violations**. Anti-position assignments and gender minimums come back as `error` — they can't be ignored. Preference-tier downgrades come back as `warning` — the Coach can override and save anyway."
>
> **Dev:** "So the Coach always has the final call, even on errors?"
>
> **Domain expert:** "Yes. The system is advisory. The Coach can override any **Violation** — but they're warned explicitly before saving."

---

## Flagged ambiguities

- **"lineup"** is used casually in the PRD to mean several things: the full **Lineup** (batting + fielding), the **BattingOrder** alone, or even just the **FieldingGrid**. The canonical term **Lineup** means the complete game plan. Use **BattingOrder** or **FieldingGrid** when referring to a specific part.
- **"order"** appears as both **BattingOrder** (a sequence of players) and constraint priority order (a ranked list of rules). Always qualify: **BattingOrder** for the former; "constraint priority" for the latter.
- **"rotation"** was used informally in user stories to mean both position-assignment variety over a season (**PositionHistory**) and inning-by-inning fielding swaps (**FieldingGrid**). Prefer the specific term in each context.
- **"slot"** appears as both **FieldingSlot** (player + position + inning) and **BattingSlot** (player + batting index). Always use the qualified compound term; naked "slot" is ambiguous.
- **"guest"** vs **"player"**: a **Guest** is technically a **Player** for the duration of a game, but lacks season history. Code should distinguish them (e.g. `isGuest` flag), and conversation should use **Guest** explicitly when the distinction matters (tiebreaks, history tracking).
