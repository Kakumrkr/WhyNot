# Session P2 — Seed, frozen clock and snapshot loader

**Goal:** Seed, frozen clock and snapshot loader; deliver the behavior below without implementing later cards.
**Branch:** session/P2-persistence-loader
**Milestone:** Optional persistence follow-on
**Depends on:** [P1](session-P1.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Review:** one fresh whynot-review before merge.

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
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Portable integration/pnpm verify green; seed/reset procedure documented.

## Out of scope

- Historical request generation, routes, real-time demo offsets.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P2 — Seed, frozen clock and snapshot loader. Card: docs/sessions/session-P2.md
~~~
