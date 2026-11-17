# Session 1.2 — Time handling and minimal fixtures

**Goal:** Time handling and minimal fixtures; deliver the behavior below without implementing later cards.
**Branch:** session/1.2-time-fixtures
**Milestone:** First release
**Depends on:** [1.1](session-1.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/engine/src/time.ts
- packages/engine/test/time.test.ts
- packages/fixtures/src/{builders,generate}.ts
- packages/fixtures/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement UTC-minute conversion, explicit-offset parsing, local-date arithmetic, half-open intervals and local-midnight grid starts with Luxon isolated.
- Reject unsupported ambiguous/nonexistent recurring boundaries explicitly; explicit request offsets disambiguate folds. Split overnight schedules into day intervals.
- Create deterministic minimal valid builders and test-only fast-check generators; freeze demo now. Distinguish authored snapshots from random cases.
- Use a DST-observing London and non-DST Kolkata zone; no engine actual clock or Date.

## Tests and verification

- Midnight/DST folds/gaps, closing/break adjacency, integer validation, grid/duration differences and exact notice/advance arithmetic.
- Generator outputs schema-valid; seeded fixtures repeat.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Time semantics match doc 03 without silent DST shifts; all imports/purity checks green.
- [ ] pnpm verify green.

## Out of scope

- Rules, full Riverside/hero goldens, alternatives.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.2 — Time handling and minimal fixtures. Card: docs/sessions/session-1.2.md
~~~
