# Session H3 — Independent historical policy replay

**Goal:** Independent historical policy replay; deliver the behavior below without implementing later cards.
**Branch:** session/H3-history-simulator
**Milestone:** Optional historical insights follow-on
**Depends on:** [H2](session-H2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/api.ts
- packages/engine/src/simulate.ts
- packages/engine/test/**
- apps/api/src/routes/**
- apps/api/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement engine-owned pure batch comparison using stored snapshots/now/options and applyPolicyChanges, excluding unsupported versions.
- Add bounded staff simulation endpoint <=2000 requests; independent replay estimate, eligible/newly feasible/still blocked/unsupported counts.
- Do not mutate bookings/history or assume new bookings consume time in later requests.

## Tests and verification

- Hand-computed history with buffer/notice change matches new feasibility counts; all comparisons use historical inputs.
- Unsupported records counted explicitly; batch caps/validation/privacy; demo target <3 seconds; pnpm verify.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Replay estimates match manual example and preserve inputs; limits documented.

## Out of scope

- Sequential demand simulation, recovered revenue claims, persistent automatic patch.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session H3 — Independent historical policy replay. Card: docs/sessions/session-H3.md
~~~
