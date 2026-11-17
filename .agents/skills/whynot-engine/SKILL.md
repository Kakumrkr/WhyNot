---
name: whynot-engine
description: Implement WhyNot contracts, pure engine rules, explanations, alternatives, projection, policy previews, ranges and deterministic templates (plus later optional AI wording). Excludes API orchestration and UI.
---

# Engine work

Read docs 02/03/04 and active card. All shared schemas are contracts Zod, infer types. Pure engine imports only contracts, local modules and Luxon (time.ts only); no actual clock, logging, process, timers, I/O or Node built-ins. Runtime timing stays outside results.

Canonical codepoint IDs/order, injected UTC-minute now, frozen inputs. Follow doc 03 time/grid/DST and validation rules. 23 internal catalog IDs include resource-missing; public synthetic replacements use separate schema.

Rule changes need catalog/version, check, meaningful boundary tests, generated coverage, golden and both-audience templates when template subsystem exists. Earlier rule sessions defer templates explicitly to 2.2.

Missing pools return structural evidence, not fake candidates. Matrix facts factor by G/P/R/E. Explanation is sufficient/irredundant; optimal only on completed B&B. Keep canonical equal-weight ties; always assert invariants and throw on bugs.

Alternatives are actual changed requests, rechecked; bounded search metadata is part of contract. Diversity is not global sorted-top-k. Concrete policy patches target actual settings, coalesce changes and must re-evaluate the original request. No relax-by-deleting-facts shortcut.

Projection uses separate public contracts and remaps every reference; no raw staff identifiers. Range commonCause contains actual FactIds and per-slot sufficiency; merged start windows never imply one continuous booking.

Use whynot-testing and independent test/reference checker. Benchmark externally per doc 03 with `pnpm bench` on the local machine that owns the committed baseline (D-071). Update baseline only with card permission and evidence. No production export of generators/reference code.

## Templates (2.2) and later optional AI wording (A1–A3)

Read doc 04. First release uses synchronous deterministic TemplateNarrator, not provider calls. One template per 23-rule/audience plus synthetic projected facts/groups/alternatives/policy/range. Tests iterate actual catalog and public schema.

Use already projected facts and formatting helpers only; no engine decisions, DB lookups or raw staff inputs for patient wording. Cite actual references. No time change guidance falsely presented as bookable alternative. Incomplete searches get honest copy.

A1 defines benefit and output contract before A2 provider work. Constrained approved wording is recommended; free prose requires explicit limits. Citation/number/name/deny-list checks can miss reversed meaning and negation; never claim semantic proof.

For A2/A3, check current official provider API docs. Keys/config injected from API; browser-safe template entry points cannot import provider. Project before model input, cap budgets/timeouts, fail to templates, isolate audience cache keys if caching is approved.

Adversaries include reversed referral requirement, negation, fake citation, invented action/time/name, leakage and transport/budget failure. No lowering check strictness merely to hit a pass-rate. Live eval without key is incomplete, not passed. Static demo remains template-only.
