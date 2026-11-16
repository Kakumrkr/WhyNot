# 01 — Architecture

## Principles

The engine decides feasibility, explanations, alternatives, ordering, groups and policy fixes. Apps/templates render. The engine is pure: no I/O, actual clock, randomness, environment, logging, timers, network or Node built-ins. Same inputs produce deep-equal output. Shared types come from Zod schemas; patient data is projected before rendering. Templates ship first. No new infrastructure without approved decisions.

## First-release flow

~~~mermaid
flowchart LR
  UI[Static React playground] --> Adapter[Browser adapter]
  Adapter --> Engine[Pure appointment engine]
  Fixtures[Synthetic scenario or validated import] --> Adapter
  Engine --> Projection[Audience projection]
  Projection --> Templates[Deterministic templates]
  Templates --> UI
~~~

The adapter owns in-memory snapshot, frozen now, scenario and audience. It calls the engine, projects outputs and renders templates. Components never invent reasons or reorder alternatives. Inspector explicitly receives staff trace. Bundled fictional data is publicly inspectable; projection demonstrates display/API discipline, not confidentiality of static fixture assets.

Links contain curated scenario ID and safe selections only. Imports are validated, size-limited synthetic JSON kept in memory; never uploaded, logged, embedded in URLs or silently persisted.

## Layout

| Area | Purpose | Introduced |
| --- | --- | --- |
| packages/contracts | Schemas and inferred types | 0.1 skeleton; 1.1 domain |
| packages/engine | Time, rules, candidates, matrix, explanations, alternatives, projection, preview, range | Phase 1 onward |
| packages/narrator | Browser-safe deterministic templates/formatting | 0.1 skeleton; 2.2 behavior |
| packages/fixtures | Synthetic clinic/scenarios and separate test generators | 1.2 onward |
| packages/engine/test/reference | Independent naive checker; no production exports | 1.5 |
| apps/web | React playground and browser adapter | 0.1 minimal scaffold; Phase 3 |
| examples/node | Own-data integration, no Riverside dependency | README scaffold in 0.1; runnable in 5.1 |
| apps/api | Fastify/DB/transactions, absent from first scaffold | P1 onward |
| tools/eval-narration | Optional AI experiment, absent from first release | A2 |

## Dependencies and exports

Engine imports only contracts and Luxon (Luxon only in src/time.ts); relative imports inside engine are allowed. Production cannot import reference checker/test generators.

Templates import contracts and formatting helpers, never DB/runtime engine decisions. Intl may format display values; timezone conversion stays in engine/time.ts.

Fixtures may use contracts/engine for synthetic data. Production fixture imports are restricted to the static adapter and later seed; property generators have test-only entry points. Consumer libraries/examples do not depend on fixtures.

Public runtime functions become exported in their owning sessions: isBookable, evaluate, projectForAudience, applyPolicyChanges, previewPolicyChanges, explainRange, catalog/version. No partially valid public results. Built schema/template subpaths work in Node/browser. No tests, generators, provider clients or secrets in browser entry points.

## Stack and modes

First release: strict TypeScript ESM, pnpm workspaces, Zod, Luxon, React, Vite, React Router, Tailwind, Vitest, fast-check, Playwright and axe. TanStack Query is the only allowed server-state library when asynchronous adapters need one; synchronous in-memory UI does not require it. Pin compatible supported stable versions in 0.1 (D-043), including a supported Node LTS with a minimum of 22. Do not copy obsolete versions from superseded cards.

Static GitHub Pages is the first release. Full local mode begins in P1–P5: Fastify, Drizzle, supported PostgreSQL, PGlite portable tests, real Postgres concurrency/unsupported-feature checks and Docker Compose. Recharts begins with H4 insights. Hosting and AI model choices are deferred.

No API/DB/provider scaffolds, chart dependencies, placeholder success checks or empty future routes in 0.1.

## Cross-cutting rules

- Integer UTC epoch minutes internally; explicit-offset ISO at external boundaries.
- Frozen demo date/now by default; user changes are explicit inputs.
- Measure latency only in benchmark/app wrappers, never Evaluation.
- Invalid snapshot/request: structured invalid_request; business refusal: blocked; invariant failure: throw.
- Deterministic engineVersion, policyVersionId, evaluatedAt and schema version; ruleVersion on facts.
- Later API invokes engine, projects data, captures complete evaluation inputs and measures latency externally.
