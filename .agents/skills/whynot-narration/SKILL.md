---
name: whynot-narration
description: Implement WhyNot deterministic patient/staff templates and, only in optional AI sessions, grounded wording experiments and their evaluations.
---

# Templates and later wording experiments

Read doc 04 and card. First release uses synchronous deterministic TemplateNarrator, not provider calls. One template per 23-rule/audience plus synthetic projected facts/groups/alternatives/policy/range. Tests iterate actual catalog and public schema.

Use already projected facts and formatting helpers only; no engine decisions, DB lookups or raw staff inputs for patient wording. Cite actual references. No time change guidance falsely presented as bookable alternative. Incomplete searches get honest copy.

A1 defines benefit and output contract before A2 provider work. Constrained approved wording is recommended; free prose requires explicit limits. Citation/number/name/deny-list checks can miss reversed meaning and negation; never claim semantic proof.

For A2/A3, check current official API docs using openai-docs. Keys/config injected from API; browser-safe template entry points cannot import provider. Project before model input, cap budgets/timeouts, fail to templates, isolate audience cache keys if caching is approved.

Adversaries include reversed referral requirement, negation, fake citation, invented action/time/name, leakage and transport/budget failure. No lowering check strictness merely to hit a pass-rate. Live eval without key is incomplete, not passed. Static demo remains template-only.
