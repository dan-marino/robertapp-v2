# ADR-0002: AB is derived from stored PA outcome counts, never entered directly

**Status**: Accepted

## Context

At-bats (AB) can be calculated in two ways: stored directly as a number the Coach enters, or derived from the individual plate appearance outcomes that are stored. The app tracks nine PA outcome types: `1B`, `2B`, `3B`, `HR`, `BB`, `K`, `FO`, `FC`, `GO`, `SF`.

## Decision

AB is derived, never stored:

```
AB = s1b + s2b + s3b + hr + k + fo + fc + go
```

BB (walks) and SF (sacrifice flies) are excluded from AB per standard baseball rules. FO, FC, and GO are included because they are official at-bats.

The Coach enters a PA string (e.g. `1B GO BB HR FO SF K`) and the system tallies outcome counts. AB is then computed from those counts. The Coach never types an AB number directly.

## Consequences

- AB is always consistent with the entered PA outcomes — it cannot be mistyped.
- If outcome counts are corrected, AB updates automatically.
- All other derived stats (BA, OBP, SLG) chain off AB, so they also stay consistent.
- The `game_stats` table stores `s1b`, `s2b`, `s3b`, `hr`, `bb`, `k`, `fo`, `fc`, `go`, `sf` as raw counts. There is no `ab` column.
