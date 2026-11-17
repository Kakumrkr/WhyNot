# Session 2.3 — Verified alternatives and truthful search

**Goal:** Verified alternatives and truthful search; deliver the behavior below without implementing later cards.
**Branch:** session/2.3-alternatives
**Milestone:** First release
**Depends on:** [2.2](session-2.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge including the correctness checklist; milestone gate: local `pnpm test:deep` and `pnpm bench` pass, recorded in the PR.

## Files and interfaces

- packages/engine/src/{alternatives,evaluate}.ts
- packages/engine/test/**
- packages/fixtures/scenarios/**
- packages/engine/bench/**
- packages/narrator/src/**
- packages/narrator/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement finite cost-ordered generators, explicit practitioner changes, dedupe and category diversity per doc 03.
- Wire default 3 results/14 days/3000 evals, disabled option, exact searched coverage and complete/budget/window status.
- Re-evaluate every changed request and assignment; add alternatives/status templates. Add H1–H8 alternative expectations from spec.
- Extend benchmark baseline with alternatives, measured externally; no global-nearest claim for partial/diverse output.

## Tests and verification

- P6/P7/P16 at 5000 runs; exhaustive tiny-domain ordering/status; no duplicates, notice violations, hidden preference relaxations or ambiguous day cost.
- Budget 0/1/limit validation, exhausted/window-limited empty and partial lists; alternatives S p95 <=400ms.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Alternative gate green; statuses and copy agree; pnpm verify green.

## Out of scope

- Policy fixes, range, UI.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 2.3 — Verified alternatives and truthful search. Card: docs/sessions/session-2.3.md
~~~
