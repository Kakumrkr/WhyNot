# Session 2.1 — Patient and staff output projection

**Goal:** Patient and staff output projection; deliver the behavior below without implementing later cards.
**Branch:** session/2.1-projection
**Milestone:** First release
**Depends on:** [1.6](session-1.6.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/engine/src/{project,index}.ts
- packages/engine/test/**
- packages/fixtures/src/generate.ts
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Implement separate patient schema projection, allowlisted params/errors, truthful public replacements, ordinal fact IDs and all reference remapping.
- Remove internal request/resource IDs, summaries, traces and fixes from patient output. Preserve public practitioner/time selection data.
- Project current slot outputs; add range projection only when range feature lands. Preserve abstraction coverage without claiming projected optimality.

## Tests and verification

- P10 over random outputs, raw booking/staff reason scans, dangling IDs, dictionary/group references and H1 public unavailable replacement.
- Schema-parse every projected output; idempotent public projection and shuffled-input determinism.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Privacy properties pass 5000 cases; patient schemas reject staff fields; pnpm verify green.

## Out of scope

- Narration/UI, range generation, hashing/secrecy infrastructure.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 2.1 — Patient and staff output projection. Card: docs/sessions/session-2.1.md
~~~
