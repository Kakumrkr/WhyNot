# Session 5.2 — First release, evidence and handoff

**Goal:** First release, evidence and handoff; deliver the behavior below without implementing later cards.
**Branch:** session/5.2-first-release
**Milestone:** First release
**Depends on:** [5.1](session-5.1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [07-roadmap](../07-roadmap.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright, $security-best-practices.
**Review:** one fresh whynot-review before merge including the correctness checklist and UX checklist; milestone gate: local `pnpm test:deep` and `pnpm bench` pass, recorded in the PR.

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
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Technical release checklist has evidence; no open blocker/major correctness findings; public static demo observed.
- [ ] External usefulness status honest; commit/push/PR handoff complete; post-merge tag recorded separately.

## Out of scope

- API/DB, historical dashboard, AI, fabricated user validation, tagging unmerged work.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 5.2 — First release, evidence and handoff. Card: docs/sessions/session-5.2.md
~~~
