# Session H2 — Descriptive insight aggregates

**Goal:** Descriptive insight aggregates; deliver the behavior below without implementing later cards.
**Branch:** session/H2-history-insights
**Milestone:** Optional historical insights follow-on
**Depends on:** [H1](session-H1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/routes/**
- apps/api/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement bounded staff insights: slot totals/blocked share, reported primary-rule counts and verified-fix feasibility counts with denominators.
- Separate range requests and repeated synthetic evaluations; document explanation-weight attribution bias.
- No lost revenue/recovered booking causal language; return explicit empty-data results.

## Tests and verification

- Hand-built small history aggregates and role/validation tests; selected-rule counts differ from all violations deliberately.
- Filter boundaries, empty history and slot/range separation; pnpm verify.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Aggregates hand-checked and truthful contracts documented.

## Out of scope

- UI charts, causal attribution, policy replay.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session H2 — Descriptive insight aggregates. Card: docs/sessions/session-H2.md
~~~
