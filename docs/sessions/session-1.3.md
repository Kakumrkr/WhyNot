# Session 1.3 — Clinic, patient, timing and preference rules

**Goal:** Clinic, patient, timing and preference rules; deliver the behavior below without implementing later cards.
**Branch:** session/1.3-request-rules
**Milestone:** First release
**Depends on:** [1.2](session-1.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/engine/src/{catalog,factId,validateRequest}.ts
- packages/engine/src/rules/{clinic,patient,timing,preference}.ts
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Register all 23 internal catalog entries with exact weights/visibility/relaxability; public replacements are not internal rules.
- Implement clinic closed/hours, notice/advance, eligibility/referral/daily-limit, request-practitioner and resource-missing structural checks.
- Canonical grounded IDs encode sorted keys; raw staff facts restricted by visibility; invalid inputs return errors before rule evaluation.
- Extend generators for every implemented rule; keep individual checks pure and internal.

## Tests and verification

- Violated/not violated/boundary per rule, elapsed-day advance, local-date daily count, cancelled booking ignored.
- Explicit empty pools versus dangling references; fact ID stability and catalog integrity.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [x] Catalog matches doc 02; all request-rule checks tested; pnpm verify green.

## Out of scope

- Resource checks, public evaluate, explanation search, templates not yet implemented.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.3 — Clinic, patient, timing and preference rules. Card: docs/sessions/session-1.3.md
~~~
