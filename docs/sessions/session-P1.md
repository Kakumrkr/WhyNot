# Session P1 — Database foundation, seed and snapshot loader

**Goal:** Set up and verify persistence, seed the demo clinic and load complete engine snapshots with a frozen clock.
**Branch:** session/P1-persistence-foundation
**Milestone:** Optional persistence follow-on
**Depends on:** [5.2](session-5.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [01-architecture](../01-architecture.md), [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- apps/api/package.json
- apps/api/src/db/**
- apps/api/src/{seed,clock,snapshotLoader}/**
- apps/api/test/**
- docker-compose.yml
- .env.example
- .github/workflows/ci.yml
- Root DB scripts
- docs/runbook.md
- packages/fixtures/src/scenarios.ts for the D-079 H8 fixture correction.
- docs/08-decisions.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Pin supported Postgres/Fastify/Drizzle/PGlite versions; introduce API package only now and migrate normalized clinic/resources/services/patients/bookings/policy/evaluation-input tables.
- Add immutable version data, atomic active-policy uniqueness, confirmed overlap exclusion constraints and needed indexes.
- Probe PGlite btree_gist and transaction concurrency; record Q-2 evidence in doc 08. Add a dedicated real-Postgres CI script for cross-connection checks without skipped tests.
- Compose local DB and portable test factory; migrations are append-only after merge.
- Idempotently seed base clinic from fixture entry point; preserve isolated scenario selections for API tests without combining contradictory overrides.
- Implement frozen DEMO_NOW/DEMO_DATE and bounded snapshot coverage including alternative/range horizons and adjacent buffers.
- Round-trip complete engine inputs with resource/service settings; no fabricated historical reconstruction.

## Tests and verification

- Fresh/repeated migration, constraints and active policy uniqueness; exclusion conflicts on real Postgres.
- PGlite portable suite without Docker; supported driver schema parity; pnpm verify.
- Seed twice gives same domain rows; loaded snapshots equal fixture inputs for selected windows.
- Clock deterministic; long adjacent booking/buffer coverage; invalid references rejected.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] DB feature split documented; portable and real-PG jobs green.
- [ ] Portable seed and snapshot integration checks pass; seed/reset procedure documented.

## Out of scope

- Routes, historical analytics or request generation, actual hosted DB, real-time demo offsets.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P1 — Database foundation, seed and snapshot loader. Card: docs/sessions/session-P1.md
~~~
