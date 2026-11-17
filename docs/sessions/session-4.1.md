# Session 4.1 — Verified policy patch engine

**Goal:** Verified policy patch engine; deliver the behavior below without implementing later cards.
**Branch:** session/4.1-policy-preview
**Milestone:** First release
**Depends on:** [3.3](session-3.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/engine/src/{adminFix,policy,evaluate,index}.ts
- packages/engine/test/**
- packages/fixtures/scenarios/**
- packages/engine/bench/**
- packages/narrator/src/**
- packages/narrator/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement typed applyPolicyChanges and previewPolicyChanges with copied snapshots and recursive fix generation disabled.
- Generate concrete/coalesced candidate patches; actual re-evaluation before returning minimum supported verified fix.
- Correct service target for previous booking buffer versus requested trailing buffer; enforce allowlist/referral/occupancy exclusions.
- Wire default adminFix generation, safe staff template changes and P11/P15. Add H1/H3/H4/H5 actual-setting expectations.
- Extend benchmark baseline to full evaluate including alternatives/fixes; preserve S <=400ms.

## Tests and verification

- Patch rechecks original request; shared settings/multiple neighbors, invalid/conflicting changes, actual cap count+1 and buffer thresholds.
- No patch for physical-only refusal; frozen input unchanged; patient projection strips fixes; 5000-run P11/P15.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Only actually bookable concrete fixes returned; preview matches direct evaluation; pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Persist/apply policy, medical recommendation, broad optimizer, UI controls.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; human merge remains the default, with green checks and fresh review required before merge. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 4.1 — Verified policy patch engine.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-4.1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/4.1-policy-preview.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/09-codex-workflow.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
