# Engine capabilities (Session 1.6)

`evaluate(snapshot, request, { now, trace? })` returns a schema-valid staff
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

Alternatives default to disabled in 1.6. Even when advanced options are supplied,
search remains explicitly disabled, alternatives are empty and adminFix is null.
Alternatives become available/default-on in 2.3; policy fixes arrive in 4.1.
Groups and practitioner summaries are empty until 2.2. Patient projection arrives
in 2.1: these staff results must not be rendered or serialized for patients.

Run `pnpm bench` for external S/M/L p50/p95 measurements, warm-up and hardware
metadata. S p95 gates are 2 ms for isBookable and 20 ms for evaluation without
alternatives/fixes. Same-platform/runtime/CPU baselines flag greater than 50%
regression; different hardware is reported as incomparable and still runs the
absolute gates. CI stores its measured report as core-benchmark. No timing enters
engine results.

The time module is slightly above the usual 300-line guideline because all Luxon
and timezone conversion must remain confined to time.ts. Its two internal batch
helpers share work only within one call and are excluded from package exports.
