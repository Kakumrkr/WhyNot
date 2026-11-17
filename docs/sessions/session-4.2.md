# Session 4.2 — Range explanations and next-available search

**Goal:** Range explanations and next-available search; deliver the behavior below without implementing later cards.
**Branch:** session/4.2-range-engine
**Milestone:** First release
**Depends on:** [4.1](session-4.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge including the correctness checklist.

## Files and interfaces

- packages/engine/src/{range,project,index}.ts
- packages/engine/test/**
- packages/fixtures/src/**
- packages/fixtures/scenarios/**
- packages/narrator/src/**
- packages/narrator/test/**
- packages/engine/bench/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement range validation, start listing/count, closed-date representation, signatures, segments/context and actual common-cause fact IDs.
- Bounded forward next-available search preserves requested practitioner first and reports incomplete search accurately.
- Extend audience projection/templates for ranges with all references consistent; wording describes start windows rather than one continuous booking.
- Author isolated H9–H11 snapshots/goldens; never modify H1 openings. Extend benchmark baseline.

## Tests and verification

- P13/P14 plus privacy/determinism at 5000 cases; member-start coverage, closed dates, any availability, merged different booking windows.
- Common cause suffices at each start; nextAvailable rechecks; window/budget boundaries; H1–H11 unchanged; S <=300/1500ms day/week.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Range gate green including H1/H11 coexistence; all earlier properties and pnpm verify green.

## Out of scope

- Range UI, appointments outside supported model, API.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 4.2 — Range explanations and next-available search. Card: docs/sessions/session-4.2.md
~~~
