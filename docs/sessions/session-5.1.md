# Session 5.1 — Developer adoption and package validation

**Goal:** Developer adoption and package validation; deliver the behavior below without implementing later cards.
**Branch:** session/5.1-developer-package
**Milestone:** First release
**Depends on:** [4.3](session-4.3.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-ui, $whynot-testing.
**Helpful external skills (optional, never blocking):** $ui-ux-pro-max, $playwright.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/{contracts,engine,narrator}/package.json
- examples/node/**
- docs/integration.md
- apps/web/src/**
- apps/web/e2e/**
- packages/engine/test/**
- README.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Finalize ESM/schema/template exports, files lists and TSDoc, excluding reference checker/generators/tests/provider code.
- Build Node example from its own small snapshot using public functions; explain record mapping, supported limits and rule-extension workflow.
- Add validated synthetic snapshot JSON import/export envelope, ingestion limits per doc 05, in-memory-only reset and safe text rendering.
- Document model/time/search/policy limitations; no plugin framework or invented general-domain claims.

## Tests and verification

- Pack libraries and install/run in clean temporary consumer outside workspace linkage; validate all promised exports.
- Malformed/oversized/invalid-reference imports, unknown versions, strings as text; no network/persistence/URL leak; browser tests.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Independent developer example works; package contents clean; pnpm verify/browser CI green.

## Out of scope

- npm publication without release approval, third-party adapters, automatic data migration.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 5.1 — Developer adoption and package validation. Card: docs/sessions/session-5.1.md
~~~
