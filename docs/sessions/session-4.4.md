# Session 4.4 — Empty-calendar patient journey

**Goal:** Empty-calendar patient journey; deliver the behavior below without implementing later cards.
**Branch:** session/4.4-empty-calendar
**Milestone:** First release
**Depends on:** [4.3](session-4.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [02-domain-and-rules](../02-domain-and-rules.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge including the UX checklist; milestone gate: green Deep verification run (5000 properties + benchmark).

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- docs/design/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Connect empty day/week state to engine range output; headline/context/segments and truthful next-search status.
- Next-available navigates to verified request; explicit practitioner change if fallback. Keep eligibility next step separate from bookable alternative.
- Use engine count/status, never UI inference/filtering; reset URL/selection consistently.

## Tests and verification

- H9 referral guidance/no false opening, H10 next Monday same practitioner, H11 mixed segments.
- Closed day, has_availability, incomplete search/null handling; keyboard/mobile/axe.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Complete empty-calendar journey; patient view safe; browser CI/pnpm verify green.

## Out of scope

- AI, bookings, historical metrics.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 4.4 — Empty-calendar patient journey. Card: docs/sessions/session-4.4.md
~~~
