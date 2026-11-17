# Session H4 — Insights dashboard and historical simulator UI

**Goal:** Insights dashboard and historical simulator UI; deliver the behavior below without implementing later cards.
**Branch:** session/H4-history-ui
**Milestone:** Optional historical insights follow-on
**Depends on:** [H3](session-H3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- apps/web/package.json
- docs/design/**
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Display descriptive KPIs/filters and accessible tables/charts; add Recharts only now.
- Connect suggested changes to independent historical simulator; show before/after examples, unsupported counts and permanent estimate label.
- Keep single-request policy preview distinct from historical batch results; visibly mark synthetic data.

## Tests and verification

- Hand-built aggregate rendering, empty/error states, simulation estimate always visible.
- No causal/revenue wording, axe/table equivalents, mobile/focus; full/static mode capabilities labelled.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Dashboard evidence, browser CI and pnpm verify green.

## Out of scope

- Auth, production analytics, AI dependency.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session H4 — Insights dashboard and historical simulator UI. Card: docs/sessions/session-H4.md
~~~
