# Session 1.6 — Minimal explanations and core gate

**Goal:** Minimal explanations and core gate; deliver the behavior below without implementing later cards.
**Branch:** session/1.6-explanations
**Milestone:** First release
**Depends on:** [1.5](session-1.5.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/{explain,evaluate,index}.ts
- packages/engine/test/**
- packages/engine/bench/**
- packages/fixtures/src/clinic.ts
- packages/fixtures/scenarios/H*.json
- packages/fixtures/src/generate.ts
- Root bench script
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement reduction, forced facts, bounded B&B, canonical equal-weight ties, greedy+irredundant fallback and always-on assertions.
- Public evaluate returns valid bookable/blocked/invalid_request; alternatives/search disabled, adminFix null, groups empty until owning sessions.
- Build deterministic Riverside and isolated H1–H8 overrides; author explanation expectations from doc 02 before running implementation.
- Create explanation trace/candidate coverage; groups get completed 2.2. Add external S/M/L benchmarks and initial baseline with runtime/hardware metadata.
- Implement P3/P4/P5/P12 including structural basis; keep earlier properties.

## Tests and verification

- 5000-run properties, <=12-fact brute-force optimum/ties, forced tiny-node fallback, actual missing-resource witness.
- H1–H8 explanation sets; isBookable <=2ms/evaluate no alternatives <=20ms S p95.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Core gate green, benchmarks recorded, no invariant failure swallowed; pnpm verify green.
- [ ] No goldens changed merely to fit output.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Alternatives, concrete fixes, templates, UI.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 1.6 — Minimal explanations and core gate.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-1.6.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/1.6-explanations.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
