# Adapters, data and local API

## Static playground

No API server or DB. Browser adapter owns a validated synthetic snapshot in memory and delegates decisions to engine. Import limit: 256 KiB UTF-8 JSON, 100 practitioners, 100 rooms, 100 equipment units, 5000 bookings, 20000 candidate combinations per request, 31 covered local dates. Oversized inputs are rejected before evaluation with actionable errors. These are playground ingestion limits, not claims that every maximal input meets demo performance targets.

Export a versioned synthetic snapshot envelope with schemaVersion, snapshot and frozen now. Reject malformed/unrecognized versions, invalid references and oversized arrays. No file execution, URL fetch, upload, console payload logging, localStorage persistence or imported-content links. Render imported strings as text.

Curated links encode scenarioId, audience and validated date/service/practitioner selections. Unknown parameters get a visible validation/reset state. Imported data and traces never enter a URL.

## Adapter boundary

Expose engine-shaped evaluate, availability, explainRange, policy preview and scenario/reset operations. The static adapter is synchronous internally. The HTTP adapter implements the same scheduling operations for full mode. Components render engine decisions in either mode.

## Local persistence

Fastify routes use shared wire schemas from `@whynot/contracts/api`. Instants use explicit-offset ISO. The error envelope is `{ error: { code, message, details? } }`. Validate responses in tests. Demo role headers select fictional roles and provide no authentication.

| Endpoint | Capability |
| --- | --- |
| GET /api/health, /api/clinic, /api/availability | Health, public configuration and start grid |
| POST /api/explain, /api/explain-range | Projected engine decisions |
| POST /api/bookings, DELETE /api/bookings/:id | Create and soft-cancel with demo ownership guards |
| GET /api/bookings/:id | Recheck a confirmed booking through its cancellation handle |
| GET/POST /api/admin/policies | Immutable policy versions and atomic activation |
| POST /api/admin/policies/preview | Staff-only hypothetical policy comparison |
| POST /api/demo/reset | Environment-gated, rate-limited reset |
| GET /api/admin/evaluations/:id/trace | Replay an evaluation from its stored inputs |
| GET /api/admin/insights | Descriptive aggregates |
| POST /api/admin/simulate | Independent historical policy replay |

## Persistence data

Normalized clinic, services, practitioners, rooms, equipment, patients, bookings, time-off, maintenance, immutable policy_versions. Preserve service settings/practitioner caps as versioned policy content when changed by editor; do not overwrite historical inputs.

Explain routes store immutable bundles with the snapshot, request, clock, options, input/schema/engine versions and original result. The snapshot includes the resources, hours, eligibility, leave, maintenance, existing-booking service settings and search coverage needed for replay. Trace and simulation routes use these captured inputs.

Store request kind slot/range explicitly. Count range evaluations separately from single-slot attempts. Measure duration in API wrappers, not engine results.

## Booking races

SERIALIZABLE transaction loads snapshot inside transaction, re-evaluates original request, inserts engine assignment or returns projected 409. Retry serialization failures up to three times. On retry exhaustion return contention code and fresh projected evaluation where available, never fabricate a blocking reason.

Postgres btree_gist exclusion constraints on confirmed practitioner/room/equipment overlap are a backstop. Buffers remain engine-owned. Real-Postgres test: ten concurrent attempts for the same sole assignment produce one success/nine conflicts. Cancellation is soft status change. Patients may cancel own fictional bookings, staff any; roles remain demo-only.

PGlite runs portable integration tests without Docker. CI runs cases that require concurrent connections or `btree_gist` against real PostgreSQL. See the [runbook](runbook.md#verify-full-mode) for the local command.

## Frozen clock and reset

Default DEMO_DATE Monday and DEMO_NOW Monday 09:00 Europe/London, fixed for all scenarios except explicit scenario overrides. No real-time offset. Seed/reset deterministic and idempotent, with fixture dependency isolated to seed.

The local full app can select isolated curated fixtures at `/api/demo/H1` through `/api/demo/H11` (D-081). A booking or reset affects only the selected scope. Unscoped endpoints use base Riverside.

Riverside persists its original demo request window separately from known search coverage. The full snapshot includes the default alternative lookback, the forward alternative and range horizons, and the maximum appointment tail (D-080). A narrow loader window is useful for fixture parity and cannot assert coverage beyond the database bounds.

`GET /api/clinic` returns both `demoWindow` and `coverage`. The full date picker starts with the demo window and can follow verified openings within coverage (D-081).

## Insights and replay

Reported blocking rules count chosen explanations, not every causal blocker or lost bookings. Explanation weights affect attribution. Show total slot evaluations, blocked share and supported-patch feasibility counts with denominators; distinguish ranges, repeated synthetic requests and unique customers.

Replay uses the stored snapshot/now/options and exact engine version. If that engine version is unavailable, return unsupported_version; do not silently substitute. Apply patch to the stored copy and compare results independently. Maximum 2000 evaluations per run; synchronous target <3 seconds on demo history. Unsupported/incomplete records are counted separately, never treated as bookable or no history.

Always label estimate: independent replays ignore knock-on occupancy, demand, clinical suitability and actual conversion. Synthetic history is visibly synthetic. No recovered-booking or revenue claims.

## Implementation guardrails

The API orchestrates engine decisions and never recomputes or reorders them.

- Shared request/response schemas live in contracts; validate both in development/tests. Explicit-offset ISO at the boundary, frozen clock helper, actual evaluation bundles, durations measured in wrappers.
- Project before any patient serialization; allowlist errors; no raw trace/fix/booking identifiers in explanations. Staff-only guards and fictional booking ownership for cancellation. Demo headers/role switch are not auth.
- Body-size and rate limits, explicit CORS, safe logs: never log patient names, payloads or narration.
- Test PGlite extensions and concurrency against real PostgreSQL where needed. Keep migrations append-only after merge, normalize source settings and preserve immutable policy versions.
- Booking: SERIALIZABLE → load inside tx → evaluate → insert or projected 409; up to three retries, honest contention after exhaustion. Exclusion constraints are a backstop; buffer rules stay engine-owned. Soft cancel; deterministic reset.
- Store immutable snapshot, request, clock, options, schema and engine version bundles. Trace and replay use those bundles. Count unsupported engine versions explicitly and distinguish range and slot evaluations.
- Report insight counts with their denominators and label replay results as estimates.
