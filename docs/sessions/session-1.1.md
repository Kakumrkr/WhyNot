# Session 1.1 — Appointment and output contracts

**Goal:** Appointment and output contracts; deliver the behavior below without implementing later cards.
**Branch:** session/1.1-contracts
**Milestone:** First release
**Depends on:** [0.1](session-0.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/contracts/src/**
- packages/contracts/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Define snapshot/request/time/resource/policy schemas and infer types. Explicit snapshot coverage and confirmed/cancelled booking states.
- Define 23 internal rule IDs and separate public replacements; Fact/Explanation basis, groups, Assignment, Alternative, SearchReport, Meta and valid result unions.
- Define separate PatientEvaluation/StaffEvaluation, range request/results, typed PolicyPatch/Preview, synthetic snapshot envelope, CostWeights and options.
- Validate duplicate IDs, invalid references, nonfinite/noninteger instants and invalid policies with structured errors; use functions/refinements without importing engine.
- Publish schema/version entry points only; no runtime engine behavior or HTTP/provider schemas.

## Tests and verification

- Accept minimal valid snapshots and all result variants; reject malformed references, dates, wrong public/staff fields and invalid patch paths/values.
- Catalog ID count/uniqueness; public result rejects staff-only fields; schema inference typecheck.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] All documented contracts represented and tested; no duplicate inferred types outside contracts.
- [ ] pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Engine decisions, complete Riverside fixtures, HTTP endpoints, provider interfaces.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 1.1 — Appointment and output contracts.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-1.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/1.1-contracts.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
