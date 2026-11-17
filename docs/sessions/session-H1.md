# Session H1 — Historical replay inputs and trace access

**Goal:** Historical replay inputs and trace access; deliver the behavior below without implementing later cards.
**Branch:** session/H1-history-capture
**Milestone:** Optional historical insights follow-on
**Depends on:** [P5](session-P5.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/db/**
- apps/api/src/routes/**
- apps/api/src/seed/**
- apps/api/test/**
- docs/runbook.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Extend/query-test P3 input bundles and expose staff trace replay from original snapshot/now/options/version.
- Return unsupported_version or incomplete evidence for unavailable versions/legacy partial bundles; never use current snapshot silently.
- Generate visibly synthetic independent history from deterministic input bundles, with distinct slot/range records.

## Tests and verification

- Change current hours/leave/service/policy/eligibility after capture; original replay unchanged.
- Unknown engine version, missing coverage, access guards; captured seeded requests deterministic.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Immutable replay fidelity proven, portable/PG checks and pnpm verify green.

## Out of scope

- Broad event-sourcing infrastructure, metrics, external connectors.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session H1 — Historical replay inputs and trace access. Card: docs/sessions/session-H1.md
~~~
