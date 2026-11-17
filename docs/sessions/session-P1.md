# Session P1 — Persistence schema and database verification

**Goal:** Persistence schema and database verification; deliver the behavior below without implementing later cards.
**Branch:** session/P1-persistence-schema
**Milestone:** Optional persistence follow-on
**Depends on:** [5.2](session-5.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Review:** one fresh whynot-review before merge.

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
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] DB feature split documented; portable and real-PG jobs green.

## Out of scope

- Seed/routes, historical analytics, actual hosted DB.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P1 — Persistence schema and database verification. Card: docs/sessions/session-P1.md
~~~
