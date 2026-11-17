# Session 4.3 — Range explanations and next-available search

**Goal:** Range explanations and next-available search; deliver the behavior below without implementing later cards.
**Branch:** session/4.3-range-engine
**Milestone:** First release
**Depends on:** [4.2](session-4.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-narration, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/{range,project,index}.ts
- packages/engine/test/**
- packages/fixtures/src/**
- packages/fixtures/scenarios/**
- packages/narrator/src/**
- packages/narrator/test/**
- packages/engine/bench/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement range validation, start listing/count, closed-date representation, signatures, segments/context and actual common-cause fact IDs.
- Bounded forward next-available search preserves requested practitioner first and reports incomplete search accurately.
- Extend audience projection/templates for ranges with all references consistent; wording describes start windows rather than one continuous booking.
- Author isolated H9–H11 snapshots/goldens; never modify H1 openings. Extend benchmark baseline.

## Tests and verification

- P13/P14 plus privacy/determinism at 5000 cases; member-start coverage, closed dates, any availability, merged different booking windows.
- Common cause suffices at each start; nextAvailable rechecks; window/budget boundaries; H1–H11 unchanged; S <=300/1500ms day/week.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Session PR and any necessary correction PRs merged under D-065; required main CI green and durable handoff saved.

- [ ] Range gate green including H1/H11 coexistence; all earlier properties and pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Range UI, appointments outside supported model, API.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064/D-065: standing user authorization permits merging this session and necessary correction PRs after green checks and fresh independent review. Confirm merge and main CI; repair post-merge failures through another reviewed PR before declaring completion. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 4.3 — Range explanations and next-available search.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-4.3.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/4.3-range-engine.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Use D-065 standing authorization to merge after green checks and fresh review; confirm main CI.
Fix post-merge failures through a new reviewed correction PR and merge again before completion.
Follow D-064/D-065 and docs/09-codex-workflow.md; save the durable next-session handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
