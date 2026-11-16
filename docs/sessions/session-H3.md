# Session H3 — Independent historical policy replay

**Goal:** Independent historical policy replay; deliver the behavior below without implementing later cards.
**Branch:** session/H3-history-simulator
**Milestone:** Optional historical insights follow-on
**Depends on:** [H2](session-H2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/contracts/src/api.ts
- packages/engine/src/simulate.ts
- packages/engine/test/**
- apps/api/src/routes/**
- apps/api/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement engine-owned pure batch comparison using stored snapshots/now/options and applyPolicyChanges, excluding unsupported versions.
- Add bounded staff simulation endpoint <=2000 requests; independent replay estimate, eligible/newly feasible/still blocked/unsupported counts.
- Do not mutate bookings/history or assume new bookings consume time in later requests.

## Tests and verification

- Hand-computed history with buffer/notice change matches new feasibility counts; all comparisons use historical inputs.
- Unsupported records counted explicitly; batch caps/validation/privacy; demo target <3 seconds; pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Replay estimates match manual example and preserve inputs; limits documented.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Sequential demand simulation, recovered revenue claims, persistent automatic patch.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session H3 — Independent historical policy replay.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-H3.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/H3-history-simulator.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
