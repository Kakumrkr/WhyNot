# Session 2.1 — Patient and staff output projection

**Goal:** Patient and staff output projection; deliver the behavior below without implementing later cards.
**Branch:** session/2.1-projection
**Milestone:** First release
**Depends on:** [1.6](session-1.6.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/{project,index}.ts
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement separate patient schema projection, allowlisted params/errors, truthful public replacements, ordinal fact IDs and all reference remapping.
- Remove internal request/resource IDs, summaries, traces and fixes from patient output. Preserve public practitioner/time selection data.
- Project current slot outputs; add range projection only when range feature lands. Preserve abstraction coverage without claiming projected optimality.

## Tests and verification

- P10 over random outputs, raw booking/staff reason scans, dangling IDs, dictionary/group references and H1 public unavailable replacement.
- Schema-parse every projected output; idempotent public projection and shuffled-input determinism.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Privacy properties pass 5000 cases; patient schemas reject staff fields; pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Narration/UI, range generation, hashing/secrecy infrastructure.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 2.1 — Patient and staff output projection.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-2.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/2.1-projection.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
