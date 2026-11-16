# Session P5 — HTTP adapter and full local application

**Goal:** HTTP adapter and full local application; deliver the behavior below without implementing later cards.
**Branch:** session/P5-full-mode
**Milestone:** Optional persistence follow-on
**Depends on:** [P4](session-P4.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- apps/api/src/**
- docs/runbook.md
- README.md
- .github/workflows/ci.yml
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement typed HTTP adapter with same engine semantics; TanStack Query for real server state; keep static mode functional.
- Add explicit booking confirmation/cancel in full mode only; on conflict show fresh engine explanation without invented just-taken claim for every error.
- Provide full local commands/DB setup and parity e2e. Hosting remains optional and requires concrete human choice before provider work.

## Tests and verification

- H1/H3/H7/H9/H10 in both modes; booking success/409/cancel and client schema rejection.
- Static assets/no-secrets intact; full local clean run, axe/mobile and pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Full local and static browser CI green; runbook reproducible.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Mandatory hosted full stack, analytics, AI.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session P5 — HTTP adapter and full local application.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-P5.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/P5-full-mode.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
