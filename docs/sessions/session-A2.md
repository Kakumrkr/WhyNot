# Session A2 — Provider prototype and adversarial evaluation

**Goal:** Provider prototype and adversarial evaluation; deliver the behavior below without implementing later cards.
**Branch:** session/A2-ai-evaluation
**Milestone:** Optional AI experiment
**Depends on:** [A1](session-A1.md) — merged; [P5](session-P5.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-engine, $whynot-testing.
**Helpful external skills (optional, never blocking):** $openai-docs, $security-best-practices.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- packages/contracts/src/**
- packages/narrator/src/server/**
- packages/narrator/test/**
- tools/eval-narration/**
- docs/reviews/**
- docs/08-decisions.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Require A1 selected contract and P5 server environment; check current official provider APIs and choose model via eval evidence.
- Implement server-only prototype using already projected facts, bounded timeout/retry/call budget and template fallback.
- Evaluate schema/citation/token checks alongside meaning-reversal adversaries and real comparison to templates; no requirement to loosen checks to pass.
- Record measured cost/latency/quality, residual risks and explicit go/no-go; never expose keys or add provider to static bundle.

## Tests and verification

- Recorded/malformed/adversarial responses, negation, invented actions, staff data leaks, transport timeout and budget failure.
- Live eval only with available authorized key; no key => report live eval incomplete, not successful.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Prototype tests green; evidence-backed enable/decline decision; pnpm verify.

## Out of scope

- Automatic launch, unsupported universal honesty claims, browser provider.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session A2 — Provider prototype and adversarial evaluation. Card: docs/sessions/session-A2.md
~~~
