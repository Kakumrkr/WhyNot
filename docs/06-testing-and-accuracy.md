# 06 — Testing and accuracy

## Gates

From 0.1, pnpm verify runs format:check, lint, typecheck, test and build, failing fast. No separate baseline run is needed: main was green when the previous card merged. If an unrelated test fails, record it rather than silently fixing it. No success-returning test:e2e/bench placeholders; introduce commands with real suites.

Default 500 runs locally and in PR CI; 5000 runs (`pnpm test:deep`) locally at milestone gate cards, optionally also in the manual Deep verification workflow (D-071/D-072). Print failure seeds and save shrunk counterexamples as normal tests. No skip/only/todo, lowered counts, disabled lint or weakened assertions.

Browser checks start at 3.1 against built static app, full mode at P5, real-Postgres job at P1. Report unavailable required environments; do not silently omit checks.

## Test layers and generators

Unit rules/time/projection/templates; differential independent reference; goldens written from doc 02 before implementation; properties over valid clinics and separate malformed input cases; real-engine browser journeys; axe plus keyboard/focus/contrast/responsive checks; external benchmark wrappers. Provider mocks/evals begin A2.

Generators are fixture test-only exports. Exercise all implemented rules, 0–8 practitioners, 0–6 rooms, 0–3 equipment, bookings, hours and policies. Keep brute-force optimality instances bounded to <=12 facts without lowering run counts. Generate empty pools explicitly.

## Properties

| ID | Required behavior |
| --- | --- |
| P1 | Bookable iff independent checker finds valid assignment |
| P2 | Returned assignment violates no reference rule |
| P3 | Matrix explanation covers every real row; structural explanation has true missing-resource witness |
| P4 | Each matrix-primary fact uniquely hits some row; structural primary is exactly one true missing dimension |
| P5 | optimal true implies minimum weight and canonical equal-weight tie on bounded matrices; structural cases checked separately |
| P6 | Changed alternative request is bookable and supplied assignment reference-valid |
| P7 | Distinct start/practitioner; costs/categories/order obey diversity, not incorrect global monotonicity |
| P8 | Shuffled inputs yield deep-equal output |
| P9 | Deep-frozen input unchanged; repeated calls equal |
| P10 | Patient serialization contains no staff IDs/params, reason values, raw bookings, other patients or dangling references |
| P11 | Applying actual allowlisted adminFix patches makes original request bookable |
| P12 | Internal references resolve to catalog facts; public references resolve under public schema |
| P13 | Fully blocked segments/context cover eligible starts once/in order; closed dates explicit; count/status match feasibility |
| P14 | Common-cause actual facts suffice per slot; nextAvailable rechecks after range and respects preference/search status |
| P15 | Preview immutable; baseline/modified evaluations equal direct checks at same now |
| P16 | Search respects budget and exhaustive small-domain completion reference; incomplete search never claims absence |

Introduce properties with owning features; earlier tests remain green. Until capabilities land, public outputs use documented disabled fields.

## Reference checker

packages/engine/test/reference directly loops real candidates and checks domain rules, without optimized evaluators, matrix or indexes. No production exports. Review hand-computed cases so differential paths cannot merely share the same mistake.

## Golden and regression corpus

The Riverside goldens cover explanations, wording, alternatives, policy patches and range outcomes. Each has a schema version, ID, named snapshot or overrides, injected clock, request and expected behavior. Explain why any change to an existing expectation is correct in the pull request.

At least 16 edge goldens: DST transition, closing boundary, break edge, exact adjacency, zero buffers, no qualified practitioner, no capable room, patient-limit plus notice, preference plus leave, equipment-only conflict, maintenance midnight, advance boundary, exact notice, exact cap, cancelled booking, equal-cost ties.

Additional regressions: every empty pool, malformed references, equal-weight ties, node fallback, evaluation budget, snapshot truncation, shared-setting patch, projection references, ranges across different bookings, H1/H11 isolation, imports and consumer packaging.

## Review, performance and claims

Assess explanation helpfulness for correctness, clarity, completeness, tone and whether the reader can act on it. Record observations with the audience and scenario. Automated tests cover modeled behavior. Clinical usefulness and developer adoption need external observations.

Use the [benchmark targets](03-engine-algorithms.md#performance-targets). Record the runtime, hardware, warm-up and p50/p95 on S, M and L fixtures. Explain baseline changes with measurements.

The [Node example](../examples/node/README.md) installs packed ESM packages in a clean temporary project and checks schema and template subpaths and package dependencies.

Say tests check sufficient/irredundant explanations and bookable alternatives for modeled inputs. Claim optimal only with flag true. Do not claim universal proof, clinical endorsement, real demand, recovered revenue or semantic proof of AI prose.
