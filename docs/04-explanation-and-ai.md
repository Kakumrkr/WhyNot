# 04 — Explanations, projection and wording

## Contracts

Zod schemas in contracts define shared types. Required capabilities:

- Fact: internal stable ID, catalog rule ID/version, kind, subject, validated rule parameters, optional window, visibility, relaxableBy.
- Explanation: primary IDs, deterministic groups, per-practitioner summaries, facts, optimal boolean and basis (matrix or missing_resource).
- Alternative: changed BookingRequest, rechecked Assignment, category, cost and explicit changes.
- SearchReport: status disabled/complete/budget_exhausted/window_limited, searched from/to instants, evaluated count. Complete means exhausted configured finite domain, not all future time.
- AdminFix: supporting fact IDs, typed concrete changes, verified viaCandidate, cost. Minimum is over supported generated patches.
- Meta: engineVersion, policyVersionId, evaluatedAt equal to injected now; no runtime measurements.
- StaffEvaluation: bookable/blocked/invalid_request; blocked includes explanation, alternatives, search, adminFix, meta and optional trace.
- PatientEvaluation: separate union with public explanation/groups, safe alternatives/search/meta; no adminFix, perCandidateSummary, raw candidates, internal subject IDs or trace.
- PolicyPatch: typed allowed entity/field/value operations, no arbitrary object paths. PolicyPreview: concrete changes, baseline and modified evaluations without mutating the input.
- RangeExplanation: invalid_request/has_availability/fully_blocked variants, bookableCount, commonCause/context IDs, segments with member starts and fact references, nextAvailable, nextSearch, facts/meta. has_availability has empty segments/commonCause/context and no next search.

Start schema version 1 before publication; breaking published changes need a bump/decision. Before owning sessions, advanced fields have explicit disabled/null values and their functions are not public. Do not expose malformed placeholder results.

## Grouping

Engine groups request, per-practitioner, capability-context and resources facts. Primary retains full sufficiency evidence; grouping is not deletion. Staff summaries use each practitioner's candidate of lowest total violation weight then canonical IDs, listing all its blockers. A concise explanation and all violations are labelled separately.

## Patient projection

projectForAudience(output, audience, { requesterPatientId }) is pure and mandatory before patient rendering/serialization.

1. Allowlist fields per rule. Replace staff time-off/break detail with public practitioner-unavailable facts. Remove reason, internal staff rule IDs and sensitive params.
2. Busy facts may identify public practitioner/window, never booking IDs, another patient's identity or service.
3. Replace room/equipment capability details with generic resource-unavailable context retaining coverage references. If none qualifies, render service unavailable here. Never silently discard necessary evidence.
4. Remove fixes, raw candidates, summaries, traces, internal resource/patient IDs and raw requests. Safe alternatives retain public practitioner IDs, times and changes needed for selection.
5. Canonically sort projected facts and rebuild every ID/reference using evaluation-local ordinal IDs, encoding no raw source ID. No hashing dependency or security claim about non-cryptographic hashing.
6. Use a separate public rule-ID schema including practitioner-unavailable/resource-unavailable replacements; these are presentation abstractions, not raw catalog violations.

All references resolve. Test serialized privacy and source-to-projection coverage. Redaction preserves truth/sufficiency at the public abstraction level; do not claim projected weight optimality. Allowlist invalid-request details too; never echo arbitrary input.

## First-release templates

One template per catalog rule per audience, plus synthetic public facts, groups, alternatives, previews and ranges. Use already projected inputs and locale/timezone display helpers only. No lookups or decision computation.

TemplateNarrator is synchronous/deterministic with source template and fact-linked sentences. Async provider contracts are deferred. Patient wording is polite, specific, actionable. Staff wording includes precise setting changes. Buffers and eligibility previews are hypothetical options requiring judgment, never automatically applied recommendations.

Time changes cannot resolve eligibility/referral failures. Static next-step copy may suggest requesting a referral or considering an assessment; that is not a verified alternative.

Range wording describes appointment start times, not uninterrupted occupancy or a single appointment spanning a merged range.

Search wording:
- complete + empty: no alternatives found in stated searched window;
- budget_exhausted: search stopped at limit; openings may remain;
- window_limited: more snapshot coverage needed;
- disabled: alternatives not searched.

## Optional AI A1–A3

No first-release provider calls, cached narrations or enablement gate. A1 compares constrained approved wording selection with free prose and records the output contract before implementation.

For free prose, schema/citation/number/name/coverage/privacy/length checks are heuristic: they can miss reversed meaning. Never claim semantic proof or use an unqualified AI wording verified badge.

Adversarial evaluations include reversed referral requirements, negation, invented implications, forged citations and leaks. Passing is evidence, not proof. Templates remain fallback. Keys stay server-side. Check current official APIs/models when this milestone begins.
