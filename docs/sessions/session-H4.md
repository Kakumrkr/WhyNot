# Session H4 — Insights dashboard and historical simulator UI

**Goal:** Insights dashboard and historical simulator UI; deliver the behavior below without implementing later cards.
**Branch:** session/H4-history-ui
**Milestone:** Optional historical insights follow-on
**Depends on:** [H3](session-H3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- apps/web/package.json
- docs/design/**
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Display descriptive KPIs/filters and accessible tables/charts; add Recharts only now.
- Connect suggested changes to independent historical simulator; show before/after examples, unsupported counts and permanent estimate label.
- Keep single-request policy preview distinct from historical batch results; visibly mark synthetic data.

## Tests and verification

- Hand-built aggregate rendering, empty/error states, simulation estimate always visible.
- No causal/revenue wording, axe/table equivalents, mobile/focus; full/static mode capabilities labelled.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Dashboard evidence, browser CI and pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Auth, production analytics, AI dependency.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session H4 — Insights dashboard and historical simulator UI.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-H4.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/H4-history-ui.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
