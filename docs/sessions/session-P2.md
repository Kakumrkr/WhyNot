# Session P2 — Seed, frozen clock and snapshot loader

**Goal:** Seed, frozen clock and snapshot loader; deliver the behavior below without implementing later cards.
**Branch:** session/P2-persistence-loader
**Milestone:** Optional persistence follow-on
**Depends on:** [P1](session-P1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/api/src/{seed,clock,snapshotLoader}/**
- apps/api/test/**
- .env.example
- docs/runbook.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Idempotently seed base clinic from fixture entry point; preserve isolated scenario selections for API tests without combining contradictory overrides.
- Implement frozen DEMO_NOW/DEMO_DATE and bounded snapshot coverage including alternative/range horizons and adjacent buffers.
- Round-trip complete engine inputs with resource/service settings; no fabricated historical reconstruction.

## Tests and verification

- Seed twice gives same domain rows; loaded snapshots equal fixture inputs for selected windows.
- Clock deterministic; long adjacent booking/buffer coverage; invalid references rejected.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Portable integration/pnpm verify green; seed/reset procedure documented.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Historical request generation, routes, real-time demo offsets.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session P2 — Seed, frozen clock and snapshot loader.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-P2.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/P2-persistence-loader.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
