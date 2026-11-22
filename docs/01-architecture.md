# Architecture

## Principles

The engine decides feasibility, explanations, alternatives, ordering, groups and policy fixes. Apps/templates render. The engine is pure: no I/O, actual clock, randomness, environment, logging, timers, network or Node built-ins. Same inputs produce deep-equal output. Shared types come from Zod schemas; patient data is projected before rendering. Templates ship first. No new infrastructure without approved decisions.

## Static playground flow

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

| Area | Purpose |
| --- | --- |
| [packages/contracts](../packages/contracts) | Shared schemas and inferred TypeScript types |
| [packages/engine](../packages/engine) | Scheduling rules, explanations, alternatives, projection, policy previews and time ranges |
| [packages/narrator](../packages/narrator) | Deterministic wording and formatting |
| [packages/fixtures](../packages/fixtures) | Fictional clinic scenarios and test generators |
| [packages/engine/test/reference](../packages/engine/test/reference) | Independent checker that the tests compare with the engine |
| [apps/web](../apps/web) | React playground with static and full local modes |
| [examples/node](../examples/node) | Packaged Node integration with a separate fictional clinic |
| [apps/api](../apps/api) | Fastify HTTP adapter, PostgreSQL persistence and booking transactions |

## Dependencies and exports

Engine imports only contracts and Luxon (Luxon only in src/time.ts); relative imports inside engine are allowed. Production cannot import reference checker/test generators.

Templates import contracts and formatting helpers, never DB/runtime engine decisions. Intl may format display values; timezone conversion stays in engine/time.ts.

Fixtures may use contracts and the engine for synthetic data. Production fixture imports are restricted to the static adapter and database seed. Property generators have test-only entry points. Consumer libraries and examples do not depend on fixtures.

The [integration guide](integration.md) lists package entry points and how to use them. Built schema and template subpaths work in Node and in the browser. Keep tests, generators and secrets out of browser entry points.

## Deployment modes

The static React/Vite playground runs the engine in the browser and is deployed to GitHub Pages. Full local mode uses the same engine through a Fastify API, Drizzle and PostgreSQL. PGlite supports portable database tests, and PostgreSQL covers concurrency and database extensions. [Runbook](runbook.md)

## Cross-cutting rules

- Integer UTC epoch minutes internally; explicit-offset ISO at external boundaries.
- Frozen demo date/now by default; user changes are explicit inputs.
- Measure latency only in benchmark/app wrappers, never Evaluation.
- Invalid snapshot/request: structured invalid_request; business refusal: blocked; invariant failure: throw.
- Deterministic engineVersion, policyVersionId, evaluatedAt and schema version; ruleVersion on facts.
- The API invokes the engine, projects data, captures complete evaluation inputs and measures latency outside the engine.
