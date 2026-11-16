# Session 1.2 — Time handling and minimal fixtures

**Goal:** Time handling and minimal fixtures; deliver the behavior below without implementing later cards.
**Branch:** session/1.2-time-fixtures
**Milestone:** First release
**Depends on:** [1.1](session-1.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/time.ts
- packages/engine/test/time.test.ts
- packages/fixtures/src/{builders,generate}.ts
- packages/fixtures/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement UTC-minute conversion, explicit-offset parsing, local-date arithmetic, half-open intervals and local-midnight grid starts with Luxon isolated.
- Reject unsupported ambiguous/nonexistent recurring boundaries explicitly; explicit request offsets disambiguate folds. Split overnight schedules into day intervals.
- Create deterministic minimal valid builders and test-only fast-check generators; freeze demo now. Distinguish authored snapshots from random cases.
- Use a DST-observing London and non-DST Kolkata zone; no engine actual clock or Date.

## Tests and verification

- Midnight/DST folds/gaps, closing/break adjacency, integer validation, grid/duration differences and exact notice/advance arithmetic.
- Generator outputs schema-valid; seeded fixtures repeat.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Time semantics match doc 03 without silent DST shifts; all imports/purity checks green.
- [ ] pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Rules, full Riverside/hero goldens, alternatives.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 1.2 — Time handling and minimal fixtures.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-1.2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/1.2-time-fixtures.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
