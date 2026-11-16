---
name: whynot-testing
description: Write or repair WhyNot unit, property, differential, golden, browser, database and package-consumer checks; preserve independent expectations and honest verification.
---

# Testing

Read doc 06 and active feature spec. New behavior needs meaningful tests. Never change goldens to fit output, skip/focus/todo suites, suppress type/lint errors or lower property counts. Corrections require decision-log entry and explicit PR disclosure.

fast-check default 500 locally, FC_NUM_RUNS=5000 in CI. Print failure seed; save shrunk case as regular unit regression. Deep-freeze inputs. Generators are test-only fixture exports; structural-empty pools are generated, not filtered away. Tiny brute-force P5 bounds fact count, not run count.

Reference checker lives in engine/test/reference and directly implements domain rules independently of optimized checks. Test it on hand-computed cases. No runtime imports/exports.

P1–P16 activate with owning features. Check structural explanation branches separately from matrix irredundancy. Verify actual setting patches, completion metadata, privacy references, range membership and canonical ties.

Goldens follow doc 02 before engine runs; named isolated overrides preserve H1/H11. Add planned template/alternative/patch expectations when their sessions land.

Time cases: half-open equality, midnight, DST fold/gap, offset disambiguation, local grid, notice/advance/buffer exact boundaries. No mocks of engine in UI/API; only later provider responses mocked.

Browser: built app, role/label selectors, real scenarios, desktop/mobile, keyboard/focus and axe. API: PGlite portable tests, separate real-PG scripts/jobs for unavailable extensions and concurrency; no silent skips.

Pack libraries into a clean temporary consumer; do not rely on workspace links. Benchmark timings outside engine. Report required environment/tool failures, never manufacture passing results.

0.0 uses documentation checks before tooling exists; 0.1 onward full pnpm verify for completion, browser/PG gates as introduced.
