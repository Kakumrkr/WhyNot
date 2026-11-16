---
name: whynot-api
description: Implement WhyNot persistence, snapshot loading, Fastify routes, transactions, immutable evaluation history and later API integration. Not part of first-release scaffold.
---

# Persistence/API

Use only P/H/A cards, not superseded phase-3 cards. Read docs 01/05 plus relevant engine/public-output contracts. API orchestrates decisions, never recomputes/reorders them.

Shared request/response schemas in contracts. Validate both in development/tests. Explicit-offset ISO boundary conversion, frozen clock helper, actual evaluation bundles and external duration measurements. Demo headers/role switch are not auth.

Project before patient serialization, allowlist errors, no raw trace/fix/booking identifiers from explanations. Staff-only guards and fictional booking ownership for cancellation. Body/rate limits, CORS, safe logs; no patient names/payload/narration logging.

P1 probes PGlite extensions/concurrency and adds dedicated real-PG CI where needed; no silently skipped constraints/races. Append migrations after merge; normalized source settings and immutable policy versions.

Booking: SERIALIZABLE -> load inside tx -> evaluate -> insert or projected 409. Up to three retries, honest contention after exhaustion. Exclusion constraints are backstop, buffer rules stay engine-owned. Soft cancel, deterministic reset.

P3 stores immutable full snapshot/request/now/options/schema/engine-version bundles. H1 traces and H3 replay use them, not current hours/leave/settings or booking timestamp guesses. Unsupported engine version is explicit. Range/slot evaluations distinct.

Insights describe reported blockers/denominators, not lost business causation. Independent replay estimate is always labelled. AI endpoint only after A1/A2 decision; keys read API config only.
