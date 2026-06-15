# Position Swap Flow

**Date:** 2026-06-15

## Problem

The current position-editing UI opens a modal on every click, requiring the user to pick a player from a list. The desired flow is simpler: click player A's cell, click player B's cell in the same inning — their positions swap.

## Design

### State

Remove `activeCell`, `pendingAddSlot`, and the modal that goes with them. Add one piece of state to `LineupSwapGrid`:

```ts
selectedSlot: { inning: number; playerId: string } | null
```

### Click Logic

Every position cell (including empty ones) is clickable. On click of `(inning, playerId)`:

| Condition | Result |
|---|---|
| Nothing selected | Select this cell |
| Same cell clicked again | Deselect (clear) |
| Different inning than selection | Replace selection with new cell |
| Same inning, different player | Fire swap → clear selection |

### API Change

The existing `POST /api/games/[id]/lineup/swap` route currently accepts `{ slot1: { inning, position }, slot2: { inning, position } }` — it finds slots by position and swaps player IDs.

Update it to accept player-based pairs instead:

```ts
{ slot1: { inning: number; playerId: string }, slot2: { inning: number; playerId: string } }
```

The route looks up each player's current position in that inning (may be absent for empty slots), then writes each player into the other's old slot. The existing constraint validation and response shape are unchanged.

### Visual Feedback

The selected cell gets a highlight ring. No other visual changes.

## Out of Scope

- Hover highlights on same-inning cells
- Muting cells in other innings
- Assign-player-to-empty-slot modal (removed, not replaced)
- Remove-player-from-slot operation (removed, not replaced)
