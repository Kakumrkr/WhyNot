# Session A1 — Optional AI wording experiment design

**Goal:** Optional AI wording experiment design; deliver the behavior below without implementing later cards.
**Branch:** session/A1-ai-design
**Milestone:** Optional AI experiment
**Depends on:** [5.2](session-5.2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [08-decisions](../08-decisions.md).
**Required skills:** $whynot-session, $whynot-engine.
**Helpful external skills (optional, never blocking):** $openai-docs.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- docs/04-explanation-and-ai.md
- docs/06-testing-and-accuracy.md
- docs/08-decisions.md
- docs/reviews/ai-experiment.md
- docs/sessions/session-A2.md
- docs/sessions/session-A3.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Compare constrained approved wording selection with free prose using patient/staff template examples; define proposed measurable benefit.
- Record one selected output contract and exact allowed claims before provider code; default recommendation constrained choices rendered deterministically.
- Specify adversarial meaning/negation/privacy eval, fallback, projected-only input, budgets, provider handling and baseline comparison.
- Resolve Q-4's usefulness/output-mode decision; if no expected benefit, record experiment declined and A2/A3 not selected.

## Tests and verification

- Manual contract/eval consistency and examples including reversed referral meaning.
- Documentation-only validation plus pnpm verify because tooling now exists; no model request needed.
- Gates: see docs/09-codex-workflow.md (pnpm verify; built-app browser checks from 3.1; real-Postgres checks from P1).
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [ ] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [ ] Decision complete A2/A3 design or explicit declined experiment; no semantic-proof claim.

## Out of scope

- Provider client, model enablement, unbounded free-prose rollout.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session A1 — Optional AI wording experiment design. Card: docs/sessions/session-A1.md
~~~
