# Session P4 — Transactional booking, policy versions and reset

**Goal:** Transactional booking, policy versions and reset; deliver the behavior below without implementing later cards.
**Branch:** session/P4-api-bookings
**Milestone:** Optional persistence follow-on
**Depends on:** [P3](session-P3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Helpful external skills (optional, never blocking):** $security-best-practices.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/routes/**
- apps/api/src/db/**
- apps/api/test/**
- .github/workflows/ci.yml
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement SERIALIZABLE booking re-evaluation/insertion, bounded retries and honest 409/contended responses.
- Soft cancel with fictional owner/staff guards; immutable versioned policy changes atomically activate; env-gated rate-limited reset.
- Use concrete engine policy patch validation; capture before/after policy inputs without overwriting history.

## Tests and verification

- Ten real-PG simultaneous requests for sole assignment -> one success/nine conflicts; buffers/caps survive transaction race.
- Cancel ownership, repeated reset, policy activation and patient-safe 409; security review.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Real-PG and portable suites plus pnpm verify green; no red race checks.

## Out of scope

- Auth, payments, applying arbitrary clinical recommendations, historical dashboard.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P4 — Transactional booking, policy versions and reset. Card: docs/sessions/session-P4.md
~~~
