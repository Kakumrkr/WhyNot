# Session 2.3 — Verified alternatives and truthful search

**Goal:** Verified alternatives and truthful search; deliver the behavior below without implementing later cards.
**Branch:** session/2.3-alternatives
**Milestone:** First release
**Depends on:** [2.2](session-2.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/{alternatives,evaluate}.ts
- packages/engine/test/**
- packages/fixtures/scenarios/**
- packages/engine/bench/**
- packages/narrator/src/**
- packages/narrator/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement finite cost-ordered generators, explicit practitioner changes, dedupe and category diversity per doc 03.
- Wire default 3 results/14 days/3000 evals, disabled option, exact searched coverage and complete/budget/window status.
- Re-evaluate every changed request and assignment; add alternatives/status templates. Add H1–H8 alternative expectations from spec.
- Extend benchmark baseline with alternatives, measured externally; no global-nearest claim for partial/diverse output.

## Tests and verification

- P6/P7/P16 at 5000 runs; exhaustive tiny-domain ordering/status; no duplicates, notice violations, hidden preference relaxations or ambiguous day cost.
- Budget 0/1/limit validation, exhausted/window-limited empty and partial lists; alternatives S p95 <=400ms.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Alternative gate green; statuses and copy agree; pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Policy fixes, range, UI.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 2.3 — Verified alternatives and truthful search.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-2.3.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/2.3-alternatives.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
