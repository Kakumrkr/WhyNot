# Session 4.1 — Verified policy patch engine

**Goal:** Verified policy patch engine; deliver the behavior below without implementing later cards.
**Branch:** session/4.1-policy-preview
**Milestone:** First release
**Depends on:** [3.3](session-3.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge including the correctness checklist.

## Files and interfaces

- packages/engine/src/{adminFix,policy,evaluate,index}.ts
- packages/engine/test/**
- packages/fixtures/scenarios/**
- packages/engine/bench/**
- packages/narrator/src/**
- packages/narrator/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement typed applyPolicyChanges and previewPolicyChanges with copied snapshots and recursive fix generation disabled.
- Generate concrete/coalesced candidate patches; actual re-evaluation before returning minimum supported verified fix.
- Correct service target for previous booking buffer versus requested trailing buffer; enforce allowlist/referral/occupancy exclusions.
- Wire default adminFix generation, safe staff template changes and P11/P15. Add H1/H3/H4/H5 actual-setting expectations.
- Extend benchmark baseline to full evaluate including alternatives/fixes; preserve S <=400ms.

## Tests and verification

- Patch rechecks original request; shared settings/multiple neighbors, invalid/conflicting changes, actual cap count+1 and buffer thresholds.
- No patch for physical-only refusal; frozen input unchanged; patient projection strips fixes; 5000-run P11/P15.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Only actually bookable concrete fixes returned; preview matches direct evaluation; pnpm verify green.

## Out of scope

- Persist/apply policy, medical recommendation, broad optimizer, UI controls.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 4.1 — Verified policy patch engine. Card: docs/sessions/session-4.1.md
~~~
