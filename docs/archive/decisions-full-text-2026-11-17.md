# Decision log — full text of condensed entries (archived 2026-11-17)

Verbatim original text of entries condensed in docs/08-decisions.md by D-072. The condensed entries are authoritative; this is history.

**D-064 · Persist through verification, independent review, merge and handoff.**
Clarifies D-055/D-059: opening a PR is a checkpoint, not completion of session
ownership. Each implementer owns one selected card through green checks, fresh
independent review, corrections, confirmed merge, post-merge checks and a durable
handoff. Recoverable failures and complexity remain work on that card. Two failed
attempts trigger diagnosis and an evidence note, not an automatic end of session.
Do not ask the user to start the same card again merely because tests, CI or review
require fixes. New commits require fresh review of the exact head and base.

Human merge remains the default. Do not merge without explicit user authorization,
bypass protections or self-claim independent review. While waiting, retain the
branch/PR and monitor merge status when the session can remain active. Only actual
GitHub merge evidence and successful required post-merge checks release the next
card; stop after the selected card and after 5.2 until a follow-on is selected.

External blockers or hard runtime limits require a coherent pushed checkpoint,
truthful incomplete status and the exact branch, PR, phase, evidence, remaining
work and continuation prompt. This preserves context for resumption; it does not
promise execution beyond the host's limits. Never mark red checks complete.

The user withdrew cloud automation and scheduling. Remove the unactivated hosted
plan and requested schedule; no cloud executor, trigger, API billing or automatic
session pickup is part of this decision. Keep session completion and recovery
guidance in [the session workflow](09-codex-workflow.md). This maintenance does not
start Session 1.3 or change application behavior.

_Why:_ prior sessions stopped at recoverable failures or PR creation and left the
user to restart work. _Rejected:_ treating complexity or a fixed retry count as
completion; weakening checks; starting later cards before merge.

**D-065 · Standing authorization to merge completed sessions and corrective PRs.**
The user explicitly reapproved merging to main at the end of every selected
session, including further fix PRs needed to finish that session. This supersedes
the human-merge default in D-064 and earlier no-automatic-merge wording in
D-055/D-059. The implementer must use this standing authorization without asking
again for each merge, unless the user revokes it or the work exceeds the selected
card and its necessary corrections.

Implement on a session branch, push all commits and open/update a PR. Merge the
exact independently reviewed head only after all required local and GitHub
checks pass, findings are resolved, and repository protections are satisfied.
Never push directly to main, bypass protections or self-claim independent review.
If the base changes, reconcile and refresh review/check evidence as needed before
merging. Confirm GitHub's actual merge SHA and wait for required CI on main.

Any session-related failure before merge remains work on the same PR. A failure
discovered after merge requires a correction branch from current main, meaningful
verification, a fresh independent review and a new PR merged under the same
authorization. Repeat until the selected card and its required post-merge checks
are green. Do not close the session as complete at PR creation or while known
session failures remain. Preserve honest incomplete checkpoints only for genuine
external blockers or hard host limits, as required by D-064.

Save a concise next-session handoff with branch/PR, implemented/reviewed/merged
status, verification, remaining issues and exact next prompt. Record actual merge
and post-merge CI evidence durably in the PR; the next session reconciles PROGRESS
from that evidence rather than creating an endless chain of handoff-only PRs.
This authority does not select another card, start Session 1.3 here, reinstate
cloud scheduling or authorize new paid services. Stop after the selected card;
follow-on milestones after 5.2 still require human selection.

**D-067 · Complete the core performance gate using factorized boolean feasibility.**
The first external S benchmark measured isBookable p95 4.43 ms, exceeding the
unchanged 2 ms gate. Its boolean-only path need not construct the full Cartesian
matrix or rank a witness. After complete input validation, check globals and the
existence of a zero-violation member in each independent practitioner/room/equipment
dimension, including requested-practitioner facts and structural emptiness. This
is exactly the factorization specified in doc 03. evaluate retains the real matrix
and canonical load-ranked witness. Reuse conversions for identical booking start
minutes within one validation call only; no persistent cache or infrastructure.
These bounded corrections may touch feasibility.ts and validateRequest.ts in
Session 1.6. Retain every existing independent differential/property check, and
measure again without changing targets or removing scenarios.

The same core-gate work may touch matrix.ts: canonicalize the fact dictionary once
and sort its numeric indices per row, preserving exact fact-ID output order.
Explanation reduction processes deduplicated rows by size and compares only kept
minimal rows, avoiding quadratic comparisons against rows already dominated.
These are local algorithm changes with unchanged canonical output, bounded search
and assertions; brute-force and shuffled-input properties remain independent gates.

A second measured S isBookable p95 was 2.60 ms. Profiling found booking-date
conversion dominates validation. An internal batch helper in time.ts resolves the
zone once per call and retains safe-instant, supported-year and sub-minute-offset
guards for every distinct confirmed start. It adds no public export, clock or
persistent cache; local-date equivalence is checked independently at boundaries.
Batch conversion formats each distinct start with an explicit Gregorian calendar,
Latin digits, en-US locale and requested timezone. The date/era and seconds are
decoded together; nonzero local seconds reject historical fractional-minute
offsets. Unexpected formatter representation throws instead of guessing. DST
folds/gaps retain their actual instant's date. The individual Luxon localDate
helper remains the independent equivalence path.
Validation also resolves shared schedule boundaries once per affected date and
passes validated working intervals to practitioner.ts rather than repeating those
conversions during rule checks. Boolean checks may return after the first skill
or hours violation; full evaluation still collects all facts.

The corrected Linux run on EPYC 9V74 passed at 1.76 ms, while EPYC 7763 still
missed at 2.18 ms. Retain the target and repair that remaining cost. Reuse the
already validated UTC-encoded calendar when resolving batch schedule boundaries;
preserve every gap/fold/year check. Extend internal stop-at-first behavior to
leave/break, room capability/maintenance and equipment type/maintenance, avoiding
unused occupancy work for the boolean path. Full matrix checks still collect all
facts. This permits bounded edits to room.ts/equipment.ts as part of D-067, with
unchanged rule versions, expectations and independent differential gates.
For ordinary schedule boundaries, short-circuit Luxon's ambiguity search when its
two wall-time +/- one-day offset probes are equal: both subsequent candidate
instants are necessarily identical. Otherwise retain getPossibleOffsets unchanged.
This removes duplicate offset work with the same gap/fold result; generated
comparison against Luxon's full getPossibleOffsets path checks the shortcut.

**D-068 · Use the native canonical timezone catalog for schema validation.**
Profiling still attributes substantial S cost to repeated construction of an Intl
formatter just to validate the same canonical timezone. The snapshot contract may
recognize native Intl.supportedValuesOf("timeZone") entries through a static lookup
created at module load. Unlisted aliases/case variants retain the existing
DateTimeFormat fallback, as do runtimes without supportedValuesOf. This is an
immutable runtime capability catalog, not a cache of snapshots/results or evolving
validation state. Input schema, accepted aliases, reference validation and schema
version remain unchanged. The bounded Session 1.6 performance repair may touch
contracts/src/snapshot.ts and its tests. Keep the 2 ms gate and differential checks.

**D-069 · Fix and record the benchmark Node young-generation configuration.**
The latest Linux report has 0.84 ms median but 2.10 ms p95 isBookable on EPYC
9V45, while another runner passes. Allocation/runtime variation remains material
after deterministic source optimizations. Benchmark wrappers use an explicit
`--max-semi-space-size=64` (MiB) so Node's automatic young-generation sizing does
not vary with runner memory limits. Record process.execArgv and V8 heap limit in
every report and require matching flags for relative comparisons. This is a
benchmark-only runtime configuration, not an engine/global cache or deployment
setting. Retain all 300 individual wall-time samples, 1000 warm-ups, p95 calculation
and absolute 2/20 ms gates; no samples, GC pauses or scheduling delays are removed.
Publish final measurements only with these conditions and matching baselines.

**D-070 · Avoid successful-validation diagnostic allocations.**
The explicit heap configuration still missed the S gate on EPYC 7763. Snapshot
validation may reuse each collection's duplicate-detection set for reference
validation and construct booking-reference error paths only on failure. Keep the
same schema, issue order, duplicate/reference paths and messages, including
multiple simultaneous errors. This bounded Session 1.6 correction touches
contracts/src/snapshot.ts and regression tests; no validation is skipped and no
benchmark target or sample changes.

Schedule conversion may also construct a candidate directly from the shared UTC
calendar and the matching wall-time +/- one-day offset probes. Accept it only if
the resulting local date/hour/minute match exactly and the instant is a safe
integer minute. Equal probes make Luxon's ambiguity candidates identical. Any
unequal probe or failed round trip retains the original keepLocalTime/gap/fold
path. This removes intermediate calendar objects without assuming fixed DST or
transition spacing; retain the independent full-Luxon equivalence property.

