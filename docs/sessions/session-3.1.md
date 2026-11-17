# Session 3.1 — Static playground design and shell

**Goal:** Static playground design and shell; deliver the behavior below without implementing later cards.
**Branch:** session/3.1-playground-shell
**Milestone:** First release
**Depends on:** [2.3](session-2.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- apps/web/playwright.config.ts
- apps/web/package.json
- apps/web/AGENTS.md
- docs/design/design-system.md
- docs/08-decisions.md
- .github/workflows/ci.yml
- Root e2e script
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Add @playwright/test and @axe-core/playwright as pinned dev dependencies (Playwright's Chromium download/cache per its docs). Design skills are optional; do not spend the session installing them.
- Record calm accessible clinic tokens/typography as the next free doc 08 decision (D-072 is taken; use D-073 or later) resolving Q-3; create minimal reusable controls/focus behavior.
- Implement shell, curated scenario picker, audience switch, frozen clock, validated URL selections, browser adapter and synthetic-only disclosure.
- Use normal React state for synchronous inputs; TanStack Query only if actual asynchronous adapter handling needs it.
- Introduce real Playwright/axe suites against built static app and CI; no future page placeholders or API client dependence.

## Tests and verification

- Shell desktop1280/mobile390, keyboard/focus, URL invalid/reset behavior and scenario/audience selection.
- Built-app Playwright and axe; no serious/critical violations; pnpm verify.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Usable accessible static shell with tokens and browser CI; screenshots captured.
- [ ] Design-token decision recorded; no network/model/DB needed.

## Out of scope

- Booking persistence, range UI, policy controls, AI, finished explanation panel.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 3.1 — Static playground design and shell. Card: docs/sessions/session-3.1.md
~~~
