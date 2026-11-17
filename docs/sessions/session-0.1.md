# Session 0.1 — Foundation and architectural boundaries

**Goal:** Foundation and architectural boundaries; deliver the behavior below without implementing later cards.
**Branch:** session/0.1-foundation
**Milestone:** First release
**Depends on:** [0.0](session-0.0.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- Root manifests/configs/LICENSE/.env.example/.gitignore
- .github/workflows/ci.yml
- .github/pull_request_template.md
- packages/{contracts,engine,narrator,fixtures}/{package.json,tsconfig.json,src/index.ts,test/**}
- apps/web/{package.json,tsconfig.json,index.html,vite.config.ts,src/**}
- examples/node/README.md
- docs/08-decisions.md
- AGENTS.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Inspect available Node/pnpm; select supported Node LTS >=22 and mutually compatible stable pnpm/TS/Zod/Luxon/React/Vite/Vitest/ESLint versions. Record D-043 and resolve Q-1.
- Scaffold pnpm workspace packages, minimal React page and example README only. Root private ESM; named exports; strict, noUncheckedIndexedAccess and exactOptionalPropertyTypes.
- Wire format/check, lint, typecheck, test, build and verify in that order; no passing placeholder bench/e2e commands.
- Enforce engine purity, imports, fixture entry-point exceptions, browser secret boundaries, no any and no skipped/focused tests; test intentionally invalid samples without lint suppressions.
- Create MIT LICENSE using verified repository-owner identity (ask only if unavailable); PR template, .env.example with no premature provider settings; CI locked install/verify with FC_NUM_RUNS=5000.
- Replace AGENTS command target table with exact current working commands; do not add future DB/API/provider infrastructure.

## Tests and verification

- Meaningful package smoke imports, web build; ESLint programmatic samples fail for forbidden imports/globals and pass for allowed relative/time imports.
- pnpm install then pnpm verify; second frozen-lockfile install; CI same commands. No domain tests or redundant VERSION assertions across every package.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Clean installation and full verification green locally and CI; supported versions and commands recorded.
- [ ] All boundary samples demonstrate enforcement; no runtime domain behavior/API scaffold.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Domain rules/contracts, design system, DB/API/Docker, AI, Playwright suites before browser behavior.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; human merge remains the default, with green checks and fresh review required before merge. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 0.1 — Foundation and architectural boundaries.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-0.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/0.1-foundation.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/09-codex-workflow.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
