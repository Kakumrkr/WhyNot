# Session 4.3 — Policy playground and empty-calendar journey

**Goal:** Staff policy playground and the empty-calendar patient journey (formerly cards 4.2 and 4.4, merged by D-072); deliver the behavior below without implementing later cards.
**Branch:** session/4.3-policy-and-range-ui
**Milestone:** First release
**Depends on:** [4.2](session-4.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge including the UX checklist; milestone gate: local `pnpm test:deep` and `pnpm bench` pass, recorded in the PR.

Two independent UI features on finished engine outputs. Commit them as two checkpoints (policy playground first, then empty calendar) so a context limit can resume at the second.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- docs/design/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

Policy playground (staff):

- Implement staff-only patch controls and suggested-fix selection using engine validation, baseline/modified comparison and witness assignment.
- Changes affect in-memory scenario copy; explicit preview/reset; no persistent policy application or altered base fixture.
- Label buffer/eligibility changes hypothetical; show unchanged original request and precise setting delta; patient data comes from projection.
- Keep preview state out of curated share links and reset on scenario change.

Empty-calendar journey (patient and staff):

- Connect empty day/week state to engine range output; headline/context/segments and truthful next-search status.
- Next-available navigates to verified request; explicit practitioner change if fallback. Keep eligibility next step separate from bookable alternative.
- Use engine count/status, never UI inference/filtering; reset URL/selection consistently.

## Tests and verification

- H1/H3/H5 preview then reset; H4 hypothetical eligibility copy; no fix physical conflict.
- Invalid patch input/errors, state isolation, patient switch, keyboard/mobile/axe.
- H9 referral guidance/no false opening, H10 next Monday same practitioner, H11 mixed segments.
- Closed day, has_availability, incomplete search/null handling; keyboard/mobile/axe.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Before/after equals engine outputs; reset restores baseline; browser CI and pnpm verify green.
- [ ] Complete empty-calendar journey; patient view safe; browser CI/pnpm verify green.

## Out of scope

- DB editor, historical simulation, safety recommendations, chart dashboard, AI, bookings, historical metrics.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 4.3 — Policy playground and empty-calendar journey. Card: docs/sessions/session-4.3.md
~~~
