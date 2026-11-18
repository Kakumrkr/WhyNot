# Engine capabilities

`evaluate(snapshot, request, { now, alternatives?, costWeights?, trace? })` returns a schema-valid staff
evaluation: `bookable` with a canonical load-ranked assignment, `blocked` with a
sufficient and irredundant explanation, or `invalid_request` with safe errors.
`isBookable(snapshot, request, now)` returns a boolean and rejects invalid input.
All instants are integer UTC epoch minutes; the clock is always supplied.

Explanations minimize positive catalog weights, then canonical fact-ID sequences.
Completed bounded search reports `optimal: true`; exhausted search returns a
checked greedy/irredundant fallback with `optimal: false`. Missing resource pools
have a separate structural basis and one true missing-resource cause. All evidence
is retained. Trace is optional and caps real candidate rows at 500, reporting
truncation without changing the decision.

Since 2.3, blocked evaluations search for up to three verified alternatives by
default, within 14 local dates either side and at most 3000 changed-request
evaluations. Set `alternatives: false` to disable search or supply
`{ max, searchDays, budgetEvals }` to adjust the limits. A completed or
window-limited report gives the configured search window intersected with the
snapshot. Coverage must also include the full appointments of eligible starts,
including starts near the end of the last requested date. A budget-exhausted report
bounds the evaluated appointments, and its
optional trace identifies individual attempts, capped at 3000 entries. Ordering
prefers the cheapest verified result followed by still-unrepresented categories.
Policy fixes arrive in 4.1. Use `projectForAudience` before rendering or serializing
a patient result.

Run `pnpm bench` for external S/M/L p50/p95 measurements, warm-up and hardware
metadata. S p95 gates are 2 ms for isBookable and 20 ms for evaluation without
alternatives/fixes, and 400 ms for evaluation with alternatives. The alternatives
workload uses 40 warm-ups and 120 samples per dataset. Same-platform/runtime/CPU baselines flag greater than 50%
regression; different hardware is reported as incomparable and still runs the
absolute gates. CI stores its measured report as core-benchmark. No timing enters
engine results.

The wrapper uses `--max-semi-space-size=64` to fix Node's young-generation
configuration across hosts; flags and V8 heap limit are recorded. Measurements
are individual wall-time calls, including GC/scheduling delays. The fixed flag
is part of these benchmark conditions, not an application runtime requirement.

The time module is slightly above the usual 300-line guideline because all Luxon
and timezone conversion must remain confined to time.ts. Its two internal batch
helpers share work only within one call and are excluded from package exports.
