---
name: whynot-engine
description: Implement WhyNot contracts or pure appointment-engine rules, explanations, alternatives, projection, policy previews and ranges. Excludes API orchestration and UI.
---

# Engine work

Read docs 02/03/04 and active card. All shared schemas are contracts Zod, infer types. Pure engine imports only contracts, local modules and Luxon (time.ts only); no actual clock, logging, process, timers, I/O or Node built-ins. Runtime timing stays outside results.

Canonical codepoint IDs/order, injected UTC-minute now, frozen inputs. Follow doc 03 time/grid/DST and validation rules. 23 internal catalog IDs include resource-missing; public synthetic replacements use separate schema.

Rule changes need catalog/version, check, meaningful boundary tests, generated coverage, golden and both-audience templates when template subsystem exists. Earlier rule sessions defer templates explicitly to 2.2.

Missing pools return structural evidence, not fake candidates. Matrix facts factor by G/P/R/E. Explanation is sufficient/irredundant; optimal only on completed B&B. Keep canonical equal-weight ties; always assert invariants and throw on bugs.

Alternatives are actual changed requests, rechecked; bounded search metadata is part of contract. Diversity is not global sorted-top-k. Concrete policy patches target actual settings, coalesce changes and must re-evaluate the original request. No relax-by-deleting-facts shortcut.

Projection uses separate public contracts and remaps every reference; no raw staff identifiers. Range commonCause contains actual FactIds and per-slot sufficiency; merged start windows never imply one continuous booking.

Use whynot-testing and independent test/reference checker. Benchmark changes externally per doc 03. Update baseline only with card permission and evidence. No production export of generators/reference code.
