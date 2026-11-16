# Session 3.1 — Static playground design and shell

**Goal:** Static playground design and shell; deliver the behavior below without implementing later cards.
**Branch:** session/3.1-playground-shell
**Milestone:** First release
**Depends on:** [2.3](session-2.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

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

- Verify design and browser skills before UI work; install only through a verified current source if needed, never guessed global commands.
- Record calm accessible clinic tokens/typography as D-045 resolving Q-3; create minimal reusable controls/focus behavior.
- Implement shell, curated scenario picker, audience switch, frozen clock, validated URL selections, browser adapter and synthetic-only disclosure.
- Use normal React state for synchronous inputs; TanStack Query only if actual asynchronous adapter handling needs it.
- Introduce real Playwright/axe suites against built static app and CI; no future page placeholders or API client dependence.

## Tests and verification

- Shell desktop1280/mobile390, keyboard/focus, URL invalid/reset behavior and scenario/audience selection.
- Built-app Playwright and axe; no serious/critical violations; pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Usable accessible static shell with tokens and browser CI; screenshots captured.
- [ ] D-045 recorded; no network/model/DB needed.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Booking persistence, range UI, policy controls, AI, finished explanation panel.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 3.1 — Static playground design and shell.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-3.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/3.1-playground-shell.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
