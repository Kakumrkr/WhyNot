# Session 0.1 — Foundation and architectural boundaries

**Goal:** Foundation and architectural boundaries; deliver the behavior below without implementing later cards.
**Branch:** session/0.1-foundation
**Milestone:** First release
**Depends on:** [0.0](session-0.0.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-testing.
**Review:** one fresh whynot-review before merge.

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
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Clean installation and full verification green locally and CI; supported versions and commands recorded.
- [ ] All boundary samples demonstrate enforcement; no runtime domain behavior/API scaffold.

## Out of scope

- Domain rules/contracts, design system, DB/API/Docker, AI, Playwright suites before browser behavior.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 0.1 — Foundation and architectural boundaries. Card: docs/sessions/session-0.1.md
~~~
