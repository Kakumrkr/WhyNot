# Session P1 — Persistence schema and database verification

**Goal:** Persistence schema and database verification; deliver the behavior below without implementing later cards.
**Branch:** session/P1-persistence-schema
**Milestone:** Optional persistence follow-on
**Depends on:** [5.2](session-5.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-testing.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- apps/api/package.json
- apps/api/src/db/**
- apps/api/test/helpers/**
- apps/api/test/db.test.ts
- docker-compose.yml
- .env.example
- .github/workflows/ci.yml
- Root DB scripts
- docs/08-decisions.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Pin supported Postgres/Fastify/Drizzle/PGlite versions; introduce API package only now and migrate normalized clinic/resources/services/patients/bookings/policy/evaluation-input tables.
- Add immutable version data, atomic active-policy uniqueness, confirmed overlap exclusion constraints and needed indexes.
- Probe PGlite btree_gist and transaction concurrency; record Q-2/D-044 evidence. Add dedicated real-Postgres CI script for unsupported features without skipped tests.
- Compose local DB and portable test factory; migrations are append-only after merge.

## Tests and verification

- Fresh/repeated migration, constraints and active policy uniqueness; exclusion conflicts on real Postgres.
- PGlite portable suite without Docker; supported driver schema parity; pnpm verify.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] DB feature split documented; portable and real-PG jobs green.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Seed/routes, historical analytics, actual hosted DB.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Never merge automatically or label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session P1 — Persistence schema and database verification.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-P1.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/P1-persistence-schema.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Finish with evidence, final commit, PR and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
