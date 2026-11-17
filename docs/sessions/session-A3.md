# Session A3 — Optional narration integration and fallback

**Goal:** Optional narration integration and fallback; deliver the behavior below without implementing later cards.
**Branch:** session/A3-ai-integration
**Milestone:** Optional AI experiment
**Depends on:** [A2](session-A2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Helpful external skills (optional, never blocking):** $openai-docs, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/api/src/**
- apps/api/test/**
- apps/web/src/**
- apps/web/e2e/**
- docs/runbook.md
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Proceed only with A2 go decision; otherwise record not selected. Implement explicit optional full-mode narration using A1 output contract.
- Projected inputs, server-side caps/cache if justified in decision, fallback on every transport/check/budget failure; no secrets/client provider.
- Label wording source/limitations accurately; static release remains template-only and all staff tools work with AI disabled.

## Tests and verification

- Provider off/timeout/invalid/adversarial/over-budget all yield templates; no cross-audience cache leakage.
- Browser source label, accessibility, API privacy, full/static regression; pnpm verify.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Only approved optional behavior enabled; limitations and rollback-off switch documented.

## Out of scope

- Changing engine decisions, AI bookings, unqualified semantic verification badges.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session A3 — Optional narration integration and fallback. Card: docs/sessions/session-A3.md
~~~
