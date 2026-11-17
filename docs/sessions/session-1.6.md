# Session 1.6 — Minimal explanations and core gate

**Goal:** Minimal explanations and core gate; deliver the behavior below without implementing later cards.
**Branch:** session/1.6-explanations
**Milestone:** First release
**Depends on:** [1.5](session-1.5.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge including the correctness checklist; milestone gate: local `pnpm test:deep` and `pnpm bench` pass, recorded in the PR.

## Files and interfaces

- packages/engine/src/{explain,evaluate,index}.ts
- packages/engine/test/**
- packages/engine/bench/**
- packages/fixtures/src/clinic.ts
- packages/fixtures/scenarios/H*.json
- packages/fixtures/src/generate.ts
- Root bench script
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement reduction, forced facts, bounded B&B, canonical equal-weight ties, greedy+irredundant fallback and always-on assertions.
- Public evaluate returns valid bookable/blocked/invalid_request; alternatives/search disabled, adminFix null, groups empty until owning sessions.
- Build deterministic Riverside and isolated H1–H8 overrides; author explanation expectations from doc 02 before running implementation.
- Create explanation trace/candidate coverage; groups get completed 2.2. Add external S/M/L benchmarks and initial baseline with runtime/hardware metadata.
- Implement P3/P4/P5/P12 including structural basis; keep earlier properties.

## Tests and verification

- 5000-run properties, <=12-fact brute-force optimum/ties, forced tiny-node fallback, actual missing-resource witness.
- H1–H8 explanation sets; isBookable <=2ms/evaluate no alternatives <=20ms S p95.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Core gate green, benchmarks recorded, no invariant failure swallowed; pnpm verify green.
- [ ] No goldens changed merely to fit output.

## Out of scope

- Alternatives, concrete fixes, templates, UI.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.6 — Minimal explanations and core gate. Card: docs/sessions/session-1.6.md
~~~
