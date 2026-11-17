# Session 1.1 — Appointment and output contracts

**Goal:** Appointment and output contracts; deliver the behavior below without implementing later cards.
**Branch:** session/1.1-contracts
**Milestone:** First release
**Depends on:** [0.1](session-0.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/**
- packages/contracts/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Define snapshot/request/time/resource/policy schemas and infer types. Explicit snapshot coverage and confirmed/cancelled booking states.
- Define 23 internal rule IDs and separate public replacements; Fact/Explanation basis, groups, Assignment, Alternative, SearchReport, Meta and valid result unions.
- Define separate PatientEvaluation/StaffEvaluation, range request/results, typed PolicyPatch/Preview, synthetic snapshot envelope, CostWeights and options.
- Validate duplicate IDs, invalid references, nonfinite/noninteger instants and invalid policies with structured errors; use functions/refinements without importing engine.
- Publish schema/version entry points only; no runtime engine behavior or HTTP/provider schemas.

## Tests and verification

- Accept minimal valid snapshots and all result variants; reject malformed references, dates, wrong public/staff fields and invalid patch paths/values.
- Catalog ID count/uniqueness; public result rejects staff-only fields; schema inference typecheck.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] All documented contracts represented and tested; no duplicate inferred types outside contracts.
- [ ] pnpm verify green.

## Out of scope

- Engine decisions, complete Riverside fixtures, HTTP endpoints, provider interfaces.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.1 — Appointment and output contracts. Card: docs/sessions/session-1.1.md
~~~
