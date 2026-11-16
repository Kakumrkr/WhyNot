# 00 — Product brief

## Promise

**Understand why a booking fails, find what works, and inspect what a policy change would do.**

WhyNot is an open-source TypeScript appointment engine and a reference playground for the fictional Riverside Family Clinic. It serves developers embedding scheduling logic, clinic staff evaluating explanations, and reviewers inspecting the engineering. Adoption and clinical usefulness remain unvalidated.

## Where it helps

Ordinary availability grids work when a convenient opening exists. WhyNot helps when a patient encounters an empty day, staff must reconstruct interacting blockers, or a developer needs explainable decisions rather than a boolean.

The engine returns a valid assignment or a sufficient, irredundant explanation, verified alternatives, and a staff-only policy preview. Minimal means each selected fact is necessary to that explanation; changing one selected rule alone need not make the real request feasible.

## Existing work and differentiation

Checked during planning on 2026-11-16:

- [Cal.com](https://cal.com/help/availabilities/troubleshoot-your-availability) documents unavailable-slot reasons, whole-day explanations, and suggested setting changes. Do not describe it as merely a single-reason troubleshooter.
- [Timefold](https://docs.timefold.ai/timefold-solver/latest/constraints-and-score/score-calculation) supports constraint justifications; its Java/Kotlin solver is open source. Do not attribute every platform feature to the open-source distribution.
- [clingo-explaid](https://github.com/potassco/clingo-explaid) explains unsatisfiability in answer-set programs.

No individual feature is claimed unprecedented. The intended contribution is the combination: a pure browser/Node appointment engine, minimal blockers, rechecked alternatives, audience projection, concrete policy previews, and an inspectable product. Absence of an exact equivalent has not been established.

VouchDesk is a separate planning-stage project for reconstructing historical booking incidents from external evidence. WhyNot computes decisions from a supplied model. Keep them separate; do not add forensic capture or connectors.

## First public release

- Single appointment, one clinic timezone, one practitioner, one room, optionally one equipment unit.
- Existing appointment rules plus explicit missing-resource explanations.
- Patient/staff views, curated scenarios, day/week explanations and next-available navigation.
- Up to three ranked, diverse, re-evaluated alternatives with changes and search-completion status.
- Hypothetical staff policy patches applied to copied inputs and re-evaluated before presentation.
- Inspector showing violations, explanation coverage, optimization status and search costs.
- In-memory policy playground with reset. Selecting an alternative evaluates it; the static demo does not pretend to persist bookings.
- Consumable engine/contracts/template exports and a Node example that does not import Riverside.
- Validated synthetic snapshot import/export kept in memory: no input upload, logging, persistence or imported-data share links.
- GitHub Pages static demo with no server, account, DB, model key or narration calls.

## Follow-on milestones and exclusions

Persistence and race-safe booking; then immutable history, descriptive insights and independent replay; then optional AI wording experiments. See [roadmap](07-roadmap.md).

Out of scope: real auth/patient data, payments, notifications, calendar sync, multiple clinics, recurring/group appointments, third-party integrations, general constraint framework, coupled-resource rules and AI decisions.

## Quality and usefulness

| Measure | Acceptance |
| --- | --- |
| Correctness evidence | Properties, independent differential checker, H1–H11, at least 16 edge goldens, search/patch/privacy regressions |
| Performance | Authoritative target table in doc 03; timing outside engine |
| Helpfulness | Correct, clear, complete enough, kind, actionable; target no score below 4/5 |
| Integration | Clean consumer runs packaged Node example without web, DB or model |
| Demo | A visitor follows a curated failure, explanation and alternative in under a minute |
| Adoption evidence | Outside developer tries integration; scheduling practitioner assesses representative scenarios |

Technical readiness and usefulness validation are separate. Publish an unvalidated technical preview if reviewers are unavailable; never fabricate approval. Record feedback and adapt subsequent work.

## Honest limitations

The engine explains the supplied model, not unwritten practice. Ranking reflects explicit preferences and bounded search. Policy patches are hypotheses, not clinical recommendations. Future replay cannot establish recovered bookings, revenue or abandonment causation. Property tests are evidence, not universal mathematical proof. Heuristic AI checks cannot prove prose meaning.
