# 05 — Adapters, data and later API

## First release

No API server or DB. Browser adapter owns a validated synthetic snapshot in memory and delegates decisions to engine. Import limit: 256 KiB UTF-8 JSON, 100 practitioners, 100 rooms, 100 equipment units, 5000 bookings, 20000 candidate combinations per request, 31 covered local dates. Oversized inputs are rejected before evaluation with actionable errors. These are playground ingestion limits, not claims that every maximal input meets demo performance targets.

Export a versioned synthetic snapshot envelope with schemaVersion, snapshot and frozen now. Reject malformed/unrecognized versions, invalid references and oversized arrays. No file execution, URL fetch, upload, console payload logging, localStorage persistence or imported-content links. Render imported strings as text.

Curated links encode scenarioId, audience and validated date/service/practitioner selections. Unknown parameters get a visible validation/reset state. Imported data and traces never enter a URL.

## Adapter boundary

Expose engine-shaped evaluate, availability, explainRange, policy preview and scenario/reset operations. Static adapter is synchronous internally; UI may wrap it for pending/error handling. Avoid artificial network infrastructure. Later HTTP adapter implements the same semantic operations; components do not branch business rules by mode.

## Persistence milestone (P1, P3 and P5)

Pin supported Postgres and Drizzle versions at P1. Fastify routes and all wire schemas belong to contracts; instants use explicit-offset ISO. Error envelope is { error: { code, message, details? } }. Validate responses in tests/development. Demo role headers are not authentication and never justify real data use.

| Endpoint | Capability | Session |
| --- | --- | --- |
| GET /api/health, /api/clinic, /api/availability | Health/public configuration/grid | P3 |
| POST /api/explain, /api/explain-range | Projected engine decisions | P3 |
| POST /api/bookings, DELETE /api/bookings/:id | Create / soft cancel with demo ownership guards | P3 |
| GET/POST /api/admin/policies | Immutable policy versions and atomic activation | P3 |
| POST /api/demo/reset | Environment-gated, rate-limited reset | P3 |
| GET /api/admin/evaluations/:id/trace | Stored-input replay, not current-snapshot reconstruction | H1 |
| GET /api/admin/insights | Descriptive aggregates | H2 |
| POST /api/admin/simulate | Independent historical policy replay | H3 |
| POST /api/narrate | Optional experiment, contract decided in A1 | A3 |

No availability cache initially. Introduce only when measurements justify it and include policy, bookings, patient eligibility, service, date, requested practitioner and injected now in any invalidation design.

## Persistence data

Normalized clinic, services, practitioners, rooms, equipment, patients, bookings, time-off, maintenance, immutable policy_versions. Preserve service settings/practitioner caps as versioned policy content when changed by editor; do not overwrite historical inputs.

Evaluations store immutable full input bundles: snapshot, request, now, options, input/schema/engine versions and original result. Include all resources, hours, eligibility, leave, maintenance, existing-booking service settings and search coverage needed for replay. A policyVersion ID or created_at/cancelled_at filters alone are insufficient. P3 captures bundles for its explain calls; H1 extends/query-tests this storage and exposes trace replay.

Store request kind slot/range explicitly. Count range evaluations separately from single-slot attempts. Measure duration in API wrappers, not engine results.

## Booking races

SERIALIZABLE transaction loads snapshot inside transaction, re-evaluates original request, inserts engine assignment or returns projected 409. Retry serialization failures up to three times. On retry exhaustion return contention code and fresh projected evaluation where available, never fabricate a blocking reason.

Postgres btree_gist exclusion constraints on confirmed practitioner/room/equipment overlap are a backstop. Buffers remain engine-owned. Real-Postgres test: ten concurrent attempts for the same sole assignment produce one success/nine conflicts. Cancellation is soft status change. Patients may cancel own fictional bookings, staff any; roles remain demo-only.

PGlite runs portable integration tests without Docker. P1 probes btree_gist support; unsupported feature/concurrency tests run on real Postgres in CI. Never silently skip tests. Use separate scripts for real-Postgres tests; do not assume Vitest supports another runner's grep flags.

## Frozen clock and reset

Default DEMO_DATE Monday and DEMO_NOW Monday 09:00 Europe/London, fixed for all scenarios except explicit scenario overrides. No real-time offset. Seed/reset deterministic and idempotent, with fixture dependency isolated to seed.

## Insights and replay H1–H4

Reported blocking rules count chosen explanations, not every causal blocker or lost bookings. Explanation weights affect attribution. Show total slot evaluations, blocked share and supported-patch feasibility counts with denominators; distinguish ranges, repeated synthetic requests and unique customers.

Replay uses the stored snapshot/now/options and exact engine version. If that engine version is unavailable, return unsupported_version; do not silently substitute. Apply patch to the stored copy and compare results independently. Maximum 2000 evaluations per run; synchronous target <3 seconds on demo history. Unsupported/incomplete records are counted separately, never treated as bookable or no history.

Always label estimate: independent replays ignore knock-on occupancy, demand, clinical suitability and actual conversion. Synthetic history is visibly synthetic. No recovered-booking or revenue claims.

## Implementation guardrails (P/H/A cards)

Formerly the whynot-api skill (folded in by D-072). Use only P/H/A cards, not superseded phase-3 cards. The API orchestrates engine decisions and never recomputes or reorders them.

- Shared request/response schemas live in contracts; validate both in development/tests. Explicit-offset ISO at the boundary, frozen clock helper, actual evaluation bundles, durations measured in wrappers.
- Project before any patient serialization; allowlist errors; no raw trace/fix/booking identifiers in explanations. Staff-only guards and fictional booking ownership for cancellation. Demo headers/role switch are not auth.
- Body-size and rate limits, explicit CORS, safe logs: never log patient names, payloads or narration.
- P1 probes PGlite extensions/concurrency and adds a dedicated real-Postgres CI job where needed; no silently skipped constraints/races. Append-only migrations after merge; normalized source settings and immutable policy versions.
- Booking: SERIALIZABLE → load inside tx → evaluate → insert or projected 409; up to three retries, honest contention after exhaustion. Exclusion constraints are a backstop; buffer rules stay engine-owned. Soft cancel; deterministic reset.
- P3 stores immutable full snapshot/request/now/options/schema/engine-version bundles; H1 traces and H3 replay use them, not current settings or booking timestamps. Unsupported engine version is explicit. Range and slot evaluations are distinct.
- Insights describe reported blockers with denominators, not lost-business causation. Replay estimates are always labelled. The AI endpoint exists only after the A1/A2 decision; keys are read from API configuration only.
