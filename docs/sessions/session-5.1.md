# Session 5.1 — Developer adoption and package validation

**Goal:** Developer adoption and package validation; deliver the behavior below without implementing later cards.
**Branch:** session/5.1-developer-package
**Milestone:** First release
**Depends on:** [4.4](session-4.4.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/{contracts,engine,narrator}/package.json
- examples/node/**
- docs/integration.md
- apps/web/src/**
- apps/web/e2e/**
- packages/engine/test/**
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Finalize ESM/schema/template exports, files lists and TSDoc, excluding reference checker/generators/tests/provider code.
- Build Node example from its own small snapshot using public functions; explain record mapping, supported limits and rule-extension workflow.
- Add validated synthetic snapshot JSON import/export envelope, ingestion limits per doc 05, in-memory-only reset and safe text rendering.
- Document model/time/search/policy limitations; no plugin framework or invented general-domain claims.

## Tests and verification

- Pack libraries and install/run in clean temporary consumer outside workspace linkage; validate all promised exports.
- Malformed/oversized/invalid-reference imports, unknown versions, strings as text; no network/persistence/URL leak; browser tests.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Independent developer example works; package contents clean; pnpm verify/browser CI green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- npm publication without release approval, third-party adapters, automatic data migration.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 5.1 — Developer adoption and package validation.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-5.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/5.1-developer-package.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
