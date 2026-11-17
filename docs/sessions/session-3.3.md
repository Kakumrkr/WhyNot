# Session 3.3 — Inspector and first public preview

**Goal:** Inspector and first public preview; deliver the behavior below without implementing later cards.
**Branch:** session/3.3-inspector-preview
**Milestone:** First release
**Depends on:** [3.2](session-3.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge including the UX checklist; milestone gate: green Deep verification run (5000 properties + benchmark).

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- .github/workflows/pages.yml
- apps/web/vite.config.ts
- README.md
- docs/reviews/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Build staff candidate/fact matrix with explanation coverage, other violations, reduction/node/optimal status and capped-trace flags.
- Show alternative costs/categories/search limits; accessible table and collapsible resource sections.
- Create GitHub Pages static build/deploy workflow with correct repository base, safe route/link behavior and no provider assets.
- Update README preview instructions/link once actual deployment is observed; collect real feedback without inventing outside validation.

## Tests and verification

- H1 highlighted buffer/leave/context columns agree with trace; optimal false/truncation status rendered.
- Built static deep links and relative assets, mobile/keyboard/axe; deployed URL if Pages available.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] First usable preview and inspector evidence; pnpm verify/browser CI green.
- [ ] If Pages settings require human access, report exact deployment prerequisite; never fabricate a live URL.

## Out of scope

- Policy/range features, API hosting, release tag.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 3.3 — Inspector and first public preview. Card: docs/sessions/session-3.3.md
~~~
