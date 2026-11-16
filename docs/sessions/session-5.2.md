# Session 5.2 — First release, evidence and handoff

**Goal:** First release, evidence and handoff; deliver the behavior below without implementing later cards.
**Branch:** session/5.2-first-release
**Milestone:** First release
**Depends on:** [5.1](session-5.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [07-roadmap](../07-roadmap.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing, $ui-ux-pro-max, $playwright, $security-best-practices.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- README.md
- docs/{integration,runbook,writeup,video-script}.md
- docs/reviews/**
- docs/security/**
- apps/web/**
- packages/**
- .github/workflows/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Audit first-release checklist; fix only evidenced correctness/accessibility/security/performance issues, not add features.
- Review imported content handling, dependency/package boundary exposure, logs, no secrets/provider code and first-release threat boundaries.
- Re-run/record S/M/L measurements with no unapproved baseline reset; finish edge/regression corpus and browser coverage.
- Document clean-clone static dev/build/runbook; README live link/GIF/screenshots, algorithm write-up, 2-minute script and limitations.
- Record real helpfulness/adoption review or explicit pending status; distinguish technical readiness. Prepare release notes; tag v1.0.0 only after this PR is merged and required review passes.

## Tests and verification

- pnpm verify, full static browser/axe/keyboard/mobile suites, packed consumer and clean clone.
- All H1–H11/E01–E16 plus P1–P16 relevant branches; security findings resolved or explicit accepted minor risks; no blockers.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Technical release checklist has evidence; no open blocker/major correctness findings; public static demo observed.
- [ ] External usefulness status honest; commit/push/PR handoff complete; post-merge tag recorded separately.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- API/DB, historical dashboard, AI, fabricated user validation, tagging unmerged work.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064: retain ownership through fixes, fresh review, confirmed merge and durable handoff; automatic merge requires explicit recorded authorization and green current-head gates. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session 5.2 — First release, evidence and handoff.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-5.2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/5.2-first-release.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Follow D-064 and docs/workflow-automation.md through confirmed merge and durable handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
