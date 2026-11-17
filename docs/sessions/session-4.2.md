# Session 4.2 — Staff policy playground

**Goal:** Staff policy playground; deliver the behavior below without implementing later cards.
**Branch:** session/4.2-policy-playground
**Milestone:** First release
**Depends on:** [4.1](session-4.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/web/src/**
- apps/web/e2e/**
- docs/design/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement staff-only patch controls and suggested-fix selection using engine validation, baseline/modified comparison and witness assignment.
- Changes affect in-memory scenario copy; explicit preview/reset; no persistent policy application or altered base fixture.
- Label buffer/eligibility changes hypothetical; show unchanged original request and precise setting delta; patient data comes from projection.
- Keep preview state out of curated share links and reset on scenario change.

## Tests and verification

- H1/H3/H5 preview then reset; H4 hypothetical eligibility copy; no fix physical conflict.
- Invalid patch input/errors, state isolation, patient switch, keyboard/mobile/axe.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Before/after equals engine outputs; reset restores baseline; browser CI and pnpm verify green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- DB editor, historical simulation, safety recommendations, chart dashboard.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; human merge remains the default, with green checks and fresh review required before merge. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 4.2 — Staff policy playground.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-4.2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/4.2-policy-playground.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/09-codex-workflow.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
