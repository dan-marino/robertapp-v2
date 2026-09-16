# ADR-0003: PA string input is case-sensitive with strict token validation

**Status**: Accepted

## Context

The stats entry UI uses a PA string (e.g. `1B GO BB HR`) rather than individual number fields for each outcome type. This format was chosen because it maps naturally to how a Coach reads a scorecard left-to-right and is faster to enter than tabbing through many separate fields.

Two design questions arose: should the parser be case-sensitive, and should unknown tokens be silently dropped or treated as errors?

## Decision

**Case-sensitive**: tokens must be entered exactly as defined (`1B`, not `1b` or `1b`). The valid token set is: `1B` `2B` `3B` `HR` `BB` `K` `FO` `FC` `GO` `SF`.

**Strict**: any unrecognised token surfaces as an inline validation error identifying the offending token. The row cannot be saved until all tokens are valid.

Silent dropping was rejected because it would corrupt stat totals without the Coach noticing (e.g. `fo` silently ignored means a plate appearance disappears from AB).

## Consequences

- On re-edit, the PA string is reconstructed from stored counts in canonical token order (`1B 2B 3B HR BB K FO FC GO SF`), not in the original entry order. The Coach may notice the reordering but the data is identical.
- The parser is a pure function and must be unit tested with cases covering valid tokens, invalid casing, unknown tokens, and empty input.
