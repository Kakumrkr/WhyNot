# Session P3 — Projected read API and immutable input capture

**Goal:** Projected read API and immutable input capture; deliver the behavior below without implementing later cards.
**Branch:** session/P3-api-read
**Milestone:** Optional persistence follow-on
**Depends on:** [P2](session-P2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing. API/DB guardrails: doc 05 §Implementation guardrails.
**Helpful external skills (optional, never blocking):** $security-threat-model.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/{app,demoRole}.ts
- apps/api/src/routes/**
- apps/api/test/**
- docs/security/threat-model.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Build Fastify app factory, Zod request/response schemas and health/clinic/availability/explain/explain-range routes.
- Parse demo role/requester, apply audience projection before serialization; body/rate limits, CORS, safe error envelope and PII-free logs.
- Store immutable full input bundle and original result/version for every explanation; keep range/slot kinds separate; API durations outside engine.
- Write threat model for synthetic/demo boundaries and client-controlled roles.

## Tests and verification

- H1–H11 API outputs agree with isolated engine scenarios; schema validation and patient privacy scans.
- Malformed/unknown inputs, rate/size failures, role parsing, capture fidelity and grid parity.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Read routes and capture green on portable DB; no raw staff leakage; pnpm verify.

## Out of scope

- Booking mutations, insights/cache, narrator endpoint.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session P3 — Projected read API and immutable input capture. Card: docs/sessions/session-P3.md
~~~
