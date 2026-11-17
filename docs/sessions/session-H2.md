# Session H2 — Descriptive insight aggregates

**Goal:** Descriptive insight aggregates; deliver the behavior below without implementing later cards.
**Branch:** session/H2-history-insights
**Milestone:** Optional historical insights follow-on
**Depends on:** [H1](session-H1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/routes/**
- apps/api/test/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement bounded staff insights: slot totals/blocked share, reported primary-rule counts and verified-fix feasibility counts with denominators.
- Separate range requests and repeated synthetic evaluations; document explanation-weight attribution bias.
- No lost revenue/recovered booking causal language; return explicit empty-data results.

## Tests and verification

- Hand-built small history aggregates and role/validation tests; selected-rule counts differ from all violations deliberately.
- Filter boundaries, empty history and slot/range separation; pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Session PR and any necessary correction PRs merged under D-065; required main CI green and durable handoff saved.

- [ ] Aggregates hand-checked and truthful contracts documented.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- UI charts, causal attribution, policy replay.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064/D-065: standing user authorization permits merging this session and necessary correction PRs after green checks and fresh independent review. Confirm merge and main CI; repair post-merge failures through another reviewed PR before declaring completion. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session H2 — Descriptive insight aggregates.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-H2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/H2-history-insights.
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
