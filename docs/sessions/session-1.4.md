# Session 1.4 — Practitioner, room and equipment rules

**Goal:** Practitioner, room and equipment rules; deliver the behavior below without implementing later cards.
**Branch:** session/1.4-resource-rules
**Milestone:** First release
**Depends on:** [1.3](session-1.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/rules/{practitioner,room,equipment}.ts
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement skill/hours/break/leave/busy/buffer/daily-cap; room capability/maintenance/busy/turnover; equipment type/maintenance/busy.
- Check both existing service after-buffer and requested-service trailing buffer. Direct overlap is busy, not duplicate buffer.
- Use stable booking/window fact IDs and per-resource interval lookup that handles long overlaps, not just immediate predecessor.
- Extend generators to trigger each resource rule; cancelled bookings ignored in conflicts and counts.

## Tests and verification

- Per-rule positive/negative/exact boundary, one-minute before buffer end, requested buffer into next booking, long overlapping intervals.
- Cross-midnight occupancy, missing types, exact cap and cancelled states.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Every catalog decision rule implemented; boundary evidence passes; pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Matrix, explanations, templates, coupled-resource rules.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 1.4 — Practitioner, room and equipment rules.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-1.4.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/1.4-resource-rules.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
