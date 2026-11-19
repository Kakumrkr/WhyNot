# 03 — Engine algorithms

## Public API and validation

Public functions: evaluate(snapshot, request, options), isBookable(snapshot, request, now), projectForAudience, applyPolicyChanges, previewPolicyChanges, explainRange; catalog/version exports. Signatures/types are schemas in contracts; output shapes are specified in doc 04.

EvaluateOptions contains injected now, alternatives false or { max: 3, searchDays: 14, budgetEvals: 3000 }, optional positive CostWeights, trace boolean and includeAdminFix boolean. Search disabled is explicit. includeAdminFix defaults false until 4.1 and true thereafter. During 1.6 public evaluate defaults alternatives to false; 2.3 changes the default to the stated search. Record capability/default transitions in package docs until first publication.

Validate snapshot structure and references before rules: IDs unique, booking resources/services exist, positive durations/grid, nonnegative buffers/caps/notice, finite integer instants, ordered covered window. Unknown request entities, off-grid start, appointment outside coverage, or unsupported wall-time boundary return invalid_request. isBookable returns false for invalid inputs; evaluate returns structured errors. No unparsed input echo.

Start grid is aligned to local midnight in clinic time, not UTC modulo arithmetic. Durations may differ from grid size. Intervals are half-open. Weekly hours cannot span midnight; express them as separate dated/day intervals. Explicit instants may span midnight. Request instants carry offsets at boundaries; DST folds are resolved by that offset. Nonexistent or ambiguous recurring schedule boundaries must return a structured invalid_request on the affected date rather than silently shifting; time helpers report this condition. maxAdvanceDays uses elapsed days of 1440 minutes; local daily counts use clinic dates.

## Candidates and missing resources

A real candidate is (practitioner, room, required equipment unit or null) at [start, start + duration). Enumerate all resources including unqualified ones; no equipment requirement means exactly one null choice. Sort by canonical IDs using codepoint comparisons.

If practitioners or rooms are empty, or equipment is required and its entire pool is empty, return blocked with basis missing_resource and one resource-missing fact for the first missing dimension in practitioner/room/equipment order. No candidate or assignment is invented. The structural explanation has optimal true (single structural cause), no adminFix and no time alternatives capable of restoring missing resources. Reference feasibility still returns false. Hitting-set irredundancy/optimality properties apply to nonempty real matrices; structural explanations have separate sufficiency/nonempty-cause assertions. Nonempty but incompatible pools use ordinary skill/capability/type facts.

## Violation matrix and feasibility

V(a) = G union P(p) union R(r) union E(e).
G contains clinic, patient and timing violations. P includes qualification, availability, occupancy, buffers, caps and request-practitioner. R/E contain capability/type, maintenance, occupancy and turnover as applicable.

Compute per-resource families once. Index intervals sorted by start; overlap lookup must account for long intervals starting earlier, not inspect only one predecessor. Ignore cancelled bookings.

Bookable iff some real candidate has no violations. Choose lowest confirmed practitioner booking count on the local date, then practitioner/room/equipment IDs among candidates satisfying the request. A requested practitioner is a hard preference until an explicit alternative changes it.

For requested [s,e) and existing [bs,be):
- overlap yields busy;
- otherwise buffer if bs <= s < be + existingService.bufferAfterMin, or s <= bs < e + requestedService.bufferAfterMin;
- turnover uses analogous room-specific service settings.
Do not return busy and buffer for the same direct overlap.

## Minimal explanation

For a nonempty blocked matrix, primary is a hitting set of all V(a). It is sufficient if every row is hit and irredundant if each selected fact uniquely hits at least one row. Removing a reason only makes the simplified explanation model satisfiable; it does not necessarily fix the real snapshot.

Minimize summed positive catalog weight, then the lexicographic sequence of sorted fact IDs:
1. Dedupe rows and remove strict supersets; use canonical fact indices/bitsets.
2. Include forced singleton facts.
3. Branch on smallest unhit row, then (weight, factId); lower bound sums minimum weights of greedily selected disjoint unhit rows.
4. Do not prune equal-weight branches until canonical tie preference is accounted for. Safe default: prune only when bound is strictly greater than best weight.
5. Cap at 50,000 search nodes. If exhausted, greedy weight/coverage with ID ties, then descending weight/ID deletion until irredundant; optimal false.
6. Assert sufficiency and irredundancy for every return; throw on invariant failure in all runtimes. No logging in engine.

Facts factorize by resource dimension in this model. Multiple necessary reasons typically block different practitioners or different rooms. Do not invent coupled-resource stories or claim tests constitute a general proof. The independent checker remains deliberately naive.

Groups and per-practitioner summaries follow doc 04. Trace contains real candidate rows, fact references, selected/reduced coverage, search nodes and evaluated alternatives, with deterministic caps (500 rows and 3000 alternative trace entries) and explicit truncation flags. Truncation never changes decisions.

## Alternatives

Finite search domain: grid starts within the snapshot and requested local date plus/minus searchDays; skip starts before now + notice. Explore the original practitioner constraint plus explicit requests for other practitioners. Do not relax eligibility, change service/patient, or create policy changes.

Categories are disjoint: different local date = other-day; same date with changed requested practitioner = other-practitioner; otherwise same-day. With no original practitioner preference, keep any-practitioner semantics and let canonical assignment select the resource. No undefined baseline-practitioner penalty.

Cost defaults:
- 1 per 15 minutes of absolute local time-of-day difference;
- 6 per absolute local calendar-day difference;
- 8 if an explicitly requested practitioner changes;
- 0.1 if alternative instant precedes requested instant.

Use time-of-day difference even across dates; do not count total elapsed days again in minute cost. The divisor remains 15, independent of grid. At DST folds, instant breaks equal wall-cost ties. Order by cost, start instant, practitioner ID, room ID, equipment ID. Weights configurable and finite/positive except earlier penalty may be zero.

Merge finite generators in cost order. Deduplicate (start, assigned practitioner). Recheck each result/assignment using engine rules. Select cheapest result first; then cheapest results from categories not represented, then cheapest remaining. This can produce nonmonotonic cost across diversity selections; return selection order and category honestly. Do not claim global top-three after diversity or an incomplete search.

Stop at budgetEvals. SearchReport status:
- disabled when not requested;
- budget_exhausted if candidates remain after evaluation cap;
- window_limited if requested domain exceeds supplied snapshot, unless budget_exhausted already applies;
- complete only if the whole configured domain was evaluated.

Return exact searched coverage and evaluation count. Empty results never prove no openings outside that window. Doc 04 defines corresponding wording.

## Policy patches and verified fixes

applyPolicyChanges validates typed allowlisted changes and copies the snapshot. Allowed fields: policy notice, advance window, patient daily limit; service after-buffer, turnover, returning-only eligibility to any; practitioner daily cap. Never relax qualifications, referral requirements, physical occupancy or actual leave.

previewPolicyChanges returns baseline and patched evaluations of the original request at the same now, with includeAdminFix false internally to prevent recursion. No persistent apply action in first release.

Generate candidate patches only for candidates whose violations are all admin-relaxable. Calculate threshold values: notice down to actual lead; advance up to ceiling elapsed days; daily limit/cap at least current count + 1; buffers/turnover down to the largest nonnegative value fitting adjacent intervals. Target the existing booking's service setting for its trailing buffer, and the requested service setting for its own trailing buffer. Coalesce shared settings to satisfy every relevant constraint, reject conflicting/invalid patches.

Apply each patch and re-evaluate against all rules. Discard proposals that fail, including newly introduced conflicts. Choose minimum sum of catalog weights for the distinct supported violations addressed, then fewer changed settings, canonical setting/value order and candidate IDs. Return concrete changes and a valid witness assignment. Minimality is over these generated patches, not arbitrary policy transformations. If none verified, adminFix null.

## Range explanation

RangeRequest: patientId, serviceId, optional practitionerId, fromDate, days 1–7. Validate before scanning. List grid starts whose full appointment fits clinic opening intervals. A closed date has an explicit closed-day segment with no invented slot. If any start is bookable, return has_availability with count and empty explanation fields.

An open date with no fitting start contributes no segment (D-074). Count a start covered by overlapping opening entries once, assigning it to the first containing opening by start then end.

For fully blocked ranges, evaluate slots without alternatives/admin fixes. Signature is sorted (ruleId, subject.id) pairs. Merge consecutive starts on the same date and opening interval with equal signatures. Retain memberStarts, all fact IDs and windows. Segment [from,to) denotes starts; to = last start + grid, not last appointment end. Closed dates use a dedicated closedDay flag/date and no time bounds.

For each signature pair present in every slot, collect its actual fact instances. Common cause is the union of those facts only if their per-slot subsets alone cover every row at every slot. Return real FactIds from the dictionary, never signature pairs in ID fields. Otherwise commonCause empty and invariant capability facts become context; segment facts plus context retain each slot's evidence. Closed-day structural facts participate via their own structural sufficiency check.

Next available searches strictly after the requested date range, forward at most 14 days and 3000 evaluations by default, preserving requested practitioner. The injected clock may be supplied as a minute or with smaller bounds via RangeOptions. If a practitioner was requested, exhaust that search first; only then try others, recording the changed preference. Return incomplete status instead of skipping ahead on a truncated preferred-practitioner search. Every returned nextAvailable is re-evaluated; a verified earliest opening completes the search. Use nextSearch metadata for null/incomplete results. Snapshot coverage must include this forward domain.

## Performance targets

Measure wrappers externally; record runtime, hardware, dataset and warm-up.

| Operation | S dataset p95 target |
| --- | --- |
| isBookable | <= 2 ms |
| evaluate without alternatives/admin fix | <= 20 ms |
| evaluate with alternatives and supported admin fix | <= 400 ms |
| Day availability | <= 100 ms |
| Range one day / seven days | <= 300 ms / 1500 ms |

S = Riverside, M = 3x resources/2x bookings, L = 10x resources. S targets are gates; M/L report scaling. Baseline introduced in 1.6, extended as operations land. `pnpm bench` on the machine owning the committed baseline enforces the S gates and flags >50% S regression; shared CI runners report only (D-071); baseline updates require explicit card authorization and measured justification. No weakened targets to pass.
