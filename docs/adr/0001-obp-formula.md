# ADR-0001: OBP uses (H + BB) / AB, not the standard formula

**Status**: Accepted

## Context

The standard baseball OBP formula is `(H + BB + HBP) / (AB + BB + HBP + SF)`. This app tracks BB and SF but not HBP (hit by pitch). When the stats feature was designed, the Coach made an explicit choice about which formula to use.

## Decision

OBP is calculated as `(H + BB) / AB`.

- HBP is not tracked, so it is omitted from both numerator and denominator.
- SF is excluded from the denominator. The standard formula includes SF in the denominator to avoid penalising players for productive outs. This app omits it for simplicity.

## Consequences

- The displayed OBP will differ slightly from standard baseball OBP for players with sacrifice flies.
- Do not "fix" this to match the standard formula without discussing it with the Coach first — the deviation is intentional.
- If HBP tracking is added in the future, revisit this ADR.
