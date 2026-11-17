# Session P5 — HTTP adapter and full local application

**Goal:** HTTP adapter and full local application; deliver the behavior below without implementing later cards.
**Branch:** session/P5-full-mode
**Milestone:** Optional persistence follow-on
**Depends on:** [P4](session-P4.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- apps/api/src/**
- docs/runbook.md
- README.md
- .github/workflows/ci.yml
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement typed HTTP adapter with same engine semantics; TanStack Query for real server state; keep static mode functional.
- Add explicit booking confirmation/cancel in full mode only; on conflict show fresh engine explanation without invented just-taken claim for every error.
- Provide full local commands/DB setup and parity e2e. Hosting remains optional and requires concrete human choice before provider work.

## Tests and verification

- H1/H3/H7/H9/H10 in both modes; booking success/409/cancel and client schema rejection.
- Static assets/no-secrets intact; full local clean run, axe/mobile and pnpm verify.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Full local and static browser CI green; runbook reproducible.

## Out of scope

- Mandatory hosted full stack, analytics, AI.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P5 — HTTP adapter and full local application. Card: docs/sessions/session-P5.md
~~~
