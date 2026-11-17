# Session A3 — Optional narration integration and fallback

**Goal:** Optional narration integration and fallback; deliver the behavior below without implementing later cards.
**Branch:** session/A3-ai-integration
**Milestone:** Optional AI experiment
**Depends on:** [A2](session-A2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-ui, $whynot-narration, $whynot-testing, $openai-docs, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/api/src/**
- apps/api/test/**
- apps/web/src/**
- apps/web/e2e/**
- docs/runbook.md
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Proceed only with A2 go decision; otherwise record not selected. Implement explicit optional full-mode narration using A1 output contract.
- Projected inputs, server-side caps/cache if justified in decision, fallback on every transport/check/budget failure; no secrets/client provider.
- Label wording source/limitations accurately; static release remains template-only and all staff tools work with AI disabled.

## Tests and verification

- Provider off/timeout/invalid/adversarial/over-budget all yield templates; no cross-audience cache leakage.
- Browser source label, accessibility, API privacy, full/static regression; pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Only approved optional behavior enabled; limitations and rollback-off switch documented.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Changing engine decisions, AI bookings, unqualified semantic verification badges.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; human merge remains the default, with green checks and fresh review required before merge. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session A3 — Optional narration integration and fallback.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-A3.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/A3-ai-integration.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/09-codex-workflow.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
