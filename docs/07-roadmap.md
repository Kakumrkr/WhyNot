# 07 — Roadmap, milestones and release gates

Approved 2026-11-16. [Active session index](sessions/README.md) is authoritative. First release: reusable appointment engine and static playground; optional persistence/history/AI follow. Do not execute archived phase cards.

| Milestone | Sessions | Gate |
| --- | --- | --- |
| Planning and foundation | 0.0–0.1 | Saved consistent plan; then clean-clone pnpm verify and enforced boundaries |
| Explanation core | 1.1–1.6 | P1–P5/P8/P9/P12, H1–H8 explanation sets, independent checker, core S benchmarks |
| Safe wording and alternatives | 2.1–2.3 | P6/P7/P10/P16, templates both audiences, edge corpus, truthful search status |
| First interactive preview | 3.1–3.3 | Patient/staff journey, inspector, built browser/axe checks, Pages deployment evidence |
| Policy and empty-calendar capability | 4.1–4.4 | Actual verified patches P11/P15, range P13/P14, isolated H9–H11, browser journeys |
| Developer adoption and first release | 5.1–5.2 | Packed consumer example, synthetic imports, security/accessibility/performance and published limitations |
| Optional persistence | P1–P5 | Portable DB + real-Postgres races, API/static parity and reproducible full local mode |
| Optional history | H1–H4 | Immutable replay inputs, truthful aggregates, manually checked estimates and accessible dashboard |
| Optional AI | A1–A3 | Explicit benefit/contract decision, adversarial eval and optional fallback integration; may be declined |

The early preview follows 3.3 rather than waiting for a DB/AI. Small verified cards remain intentional; calendar duration is not a completion criterion.

## First-release checklist

- [ ] 0.0–5.2 implemented, independently reviewed and merged; evidence in PROGRESS.
- [ ] pnpm verify, properties at 5000 in CI, built static browser/axe suites green.
- [ ] H1–H11, E01–E16 and explicit empty-resource/search/patch/privacy regressions green.
- [ ] Every rule and public replacement has appropriate templates; all references resolve.
- [ ] S benchmarks meet doc 03 table; M/L and limitations reported.
- [ ] Clean packed-library consumer works without fixtures, DB, web or provider dependency.
- [ ] Synthetic import/export validated/bounded/in-memory; no payload or staff-detail URL leaks.
- [ ] Static demo observed on desktop/mobile; keyboard/focus/contrast checked.
- [ ] No unresolved blocker/major findings; minor accepted risks explicit.
- [ ] README, GIF/screenshots, runbook, architecture and technical write-up reflect actual behavior.
- [ ] MIT license, no secrets, accurate environment/command documentation.
- [ ] Real helpfulness/adoption feedback recorded or conspicuously marked pending; no fabricated approval.
- [ ] Release notes prepared; tag v1.0.0 only after release PR is merged.

Technical readiness is separate from usefulness validation. External adoption evidence remains a goal, not a manufactured release artifact.

## Change control

Record a decision before modifying architecture, rules or expected outcomes. Update affected specs, cards, skills and progress together. Write unresolved issues in QUESTIONS, implement only unambiguous work, and never silently weaken tests. Record regular checkpoint commits and mandatory end-of-session push in every handoff.
