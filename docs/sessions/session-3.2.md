# Session 3.2 — Patient and staff explanation journey

**Goal:** Patient and staff explanation journey; deliver the behavior below without implementing later cards.
**Branch:** session/3.2-explanation-journey
**Milestone:** First release
**Depends on:** [3.1](session-3.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- docs/design/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Connect service/practitioner/date/start selection to engine availability and evaluate via adapter; unavailable starts remain explainable buttons.
- Show patient grouped templates and explicit alternative changes/search status; staff shows all candidate blockers separately.
- Alternative selection changes request and re-evaluates; label bookable demonstration without claiming persisted booking.
- Provide pending/empty/error/success and dialog focus/aria-live; reset scenario and audience consistently.

## Tests and verification

- H1/H3/H6/H7 journeys use actual engine fixtures; chosen alternative evaluates bookable.
- Privacy scan of patient rendered state; keyboard/dialog/focus; mobile screenshot and axe.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Core journey works without server; alternatives/status match engine; browser CI and pnpm verify green.

## Out of scope

- Empty-week explanations, policy editing, actual booking, inspector visualization.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 3.2 — Patient and staff explanation journey. Card: docs/sessions/session-3.2.md
~~~
