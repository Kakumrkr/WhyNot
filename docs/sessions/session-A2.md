# Session A2 — Provider prototype and adversarial evaluation

**Goal:** Provider prototype and adversarial evaluation; deliver the behavior below without implementing later cards.
**Branch:** session/A2-ai-evaluation
**Milestone:** Optional AI experiment
**Depends on:** [A1](session-A1.md) — merged; [P5](session-P5.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-narration, $whynot-testing, $openai-docs, $security-best-practices.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/contracts/src/**
- packages/narrator/src/server/**
- packages/narrator/test/**
- tools/eval-narration/**
- docs/reviews/**
- docs/08-decisions.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Require A1 selected contract and P5 server environment; check current official provider APIs and choose model via eval evidence.
- Implement server-only prototype using already projected facts, bounded timeout/retry/call budget and template fallback.
- Evaluate schema/citation/token checks alongside meaning-reversal adversaries and real comparison to templates; no requirement to loosen checks to pass.
- Record measured cost/latency/quality, residual risks and explicit go/no-go; never expose keys or add provider to static bundle.

## Tests and verification

- Recorded/malformed/adversarial responses, negation, invented actions, staff data leaks, transport timeout and budget failure.
- Live eval only with available authorized key; no key => report live eval incomplete, not successful.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Prototype tests green; evidence-backed enable/decline decision; pnpm verify.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Automatic launch, unsupported universal honesty claims, browser provider.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session A2 — Provider prototype and adversarial evaluation.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-A2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/A2-ai-evaluation.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
