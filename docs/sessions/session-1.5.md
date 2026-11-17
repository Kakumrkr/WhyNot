# Session 1.5 — Candidates, matrix and independent reference

**Goal:** Candidates, matrix and independent reference; deliver the behavior below without implementing later cards.
**Branch:** session/1.5-feasibility
**Milestone:** First release
**Depends on:** [1.4](session-1.4.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/engine/src/{candidates,matrix,feasibility,index}.ts
- packages/engine/test/reference/**
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Enumerate canonical real candidates; factor G/P/R/E checks and structural-empty results without inventing assignable resources.
- Implement/ export isBookable; choose valid assignment by documented local-day load and canonical IDs. Keep partial evaluate internal.
- Write naive reference directly from spec, without calling optimized rule functions or matrix; test-only and excluded from production exports.
- Add P1/P2/P8/P9 and matrix/reference differential cases with immutable inputs.

## Tests and verification

- Reference and optimized feasibility agree on generated/hand-computed cases; every returned assignment valid.
- Requested practitioner, load ties, shuffled inputs, frozen inputs and every empty-pool case.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Properties pass at 5000 runs; package exports contain no checker; pnpm verify green.

## Out of scope

- Public incomplete Evaluation objects, minimal explanations, alternatives.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.5 — Candidates, matrix and independent reference. Card: docs/sessions/session-1.5.md
~~~
