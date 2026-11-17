# Session 1.4 — Practitioner, room and equipment rules

**Goal:** Practitioner, room and equipment rules; deliver the behavior below without implementing later cards.
**Branch:** session/1.4-resource-rules
**Milestone:** First release
**Depends on:** [1.3](session-1.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/engine/src/rules/{practitioner,room,equipment}.ts
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement skill/hours/break/leave/busy/buffer/daily-cap; room capability/maintenance/busy/turnover; equipment type/maintenance/busy.
- Check both existing service after-buffer and requested-service trailing buffer. Direct overlap is busy, not duplicate buffer.
- Use stable booking/window fact IDs and per-resource interval lookup that handles long overlaps, not just immediate predecessor.
- Extend generators to trigger each resource rule; cancelled bookings ignored in conflicts and counts.

## Tests and verification

- Per-rule positive/negative/exact boundary, one-minute before buffer end, requested buffer into next booking, long overlapping intervals.
- Cross-midnight occupancy, missing types, exact cap and cancelled states.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Every catalog decision rule implemented; boundary evidence passes; pnpm verify green.

## Out of scope

- Matrix, explanations, templates, coupled-resource rules.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 1.4 — Practitioner, room and equipment rules. Card: docs/sessions/session-1.4.md
~~~
