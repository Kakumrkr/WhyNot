# Session 4.2 — Staff policy playground

**Goal:** Staff policy playground; deliver the behavior below without implementing later cards.
**Branch:** session/4.2-policy-playground
**Milestone:** First release
**Depends on:** [4.1](session-4.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
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

- Implement staff-only patch controls and suggested-fix selection using engine validation, baseline/modified comparison and witness assignment.
- Changes affect in-memory scenario copy; explicit preview/reset; no persistent policy application or altered base fixture.
- Label buffer/eligibility changes hypothetical; show unchanged original request and precise setting delta; patient data comes from projection.
- Keep preview state out of curated share links and reset on scenario change.

## Tests and verification

- H1/H3/H5 preview then reset; H4 hypothetical eligibility copy; no fix physical conflict.
- Invalid patch input/errors, state isolation, patient switch, keyboard/mobile/axe.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Before/after equals engine outputs; reset restores baseline; browser CI and pnpm verify green.

## Out of scope

- DB editor, historical simulation, safety recommendations, chart dashboard.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 4.2 — Staff policy playground. Card: docs/sessions/session-4.2.md
~~~
