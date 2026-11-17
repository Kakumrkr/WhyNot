# PROGRESS

Active roadmap approved 2026-11-16 (D-050–D-059). Sessions 0.1 and 1.1 are independently reviewed and confirmed merged through PRs #2 and #3. Session 1.2 is independently reviewed and confirmed merged through PR #4 at 94f71d918417acd7db02fc8f13578222cf628c87. Session completion guidance maintenance is confirmed merged through PR #5 with green main CI. Session 1.3 is implemented, independently reviewed and confirmed merged through PR #6 at 9f57ed1e988378fe1a92cd45a27256ca1a4af95e with green main CI. Session 1.4 is implemented, independently reviewed and confirmed merged through PR #8 at d8f8a73621be3e99f0d9ab5f3326e950b7ba08a6 with green main CI. Session 0.0 is confirmed merged; no submitted independent review was found. Do not interpret implemented as merged.

| Session                        | Title                                            | Implemented | Reviewed | Merged  | PR                                              |
| ------------------------------ | ------------------------------------------------ | ----------- | -------- | ------- | ----------------------------------------------- |
| [0.0](sessions/session-0.0.md) | Planning handoff                                 | done        | pending  | done    | [#1](https://github.com/Kakumrkr/WhyNot/pull/1) |
| [0.1](sessions/session-0.1.md) | Foundation and architectural boundaries          | done        | done     | done    | [#2](https://github.com/Kakumrkr/WhyNot/pull/2) |
| [1.1](sessions/session-1.1.md) | Appointment and output contracts                 | done        | done     | done    | [#3](https://github.com/Kakumrkr/WhyNot/pull/3) |
| [1.2](sessions/session-1.2.md) | Time handling and minimal fixtures               | done        | done     | done    | [#4](https://github.com/Kakumrkr/WhyNot/pull/4) |
| [1.3](sessions/session-1.3.md) | Clinic, patient, timing and preference rules     | done        | done     | done    | [#6](https://github.com/Kakumrkr/WhyNot/pull/6) |
| [1.4](sessions/session-1.4.md) | Practitioner, room and equipment rules           | done        | done     | done    | [#8](https://github.com/Kakumrkr/WhyNot/pull/8) |
| [1.5](sessions/session-1.5.md) | Candidates, matrix and independent reference     | done        | pending  | pending | —                                               |
| [1.6](sessions/session-1.6.md) | Minimal explanations and core gate               | pending     | pending  | pending | —                                               |
| [2.1](sessions/session-2.1.md) | Patient and staff output projection              | pending     | pending  | pending | —                                               |
| [2.2](sessions/session-2.2.md) | Templates, grouping and helpfulness              | pending     | pending  | pending | —                                               |
| [2.3](sessions/session-2.3.md) | Verified alternatives and truthful search        | pending     | pending  | pending | —                                               |
| [3.1](sessions/session-3.1.md) | Static playground design and shell               | pending     | pending  | pending | —                                               |
| [3.2](sessions/session-3.2.md) | Patient and staff explanation journey            | pending     | pending  | pending | —                                               |
| [3.3](sessions/session-3.3.md) | Inspector and first public preview               | pending     | pending  | pending | —                                               |
| [4.1](sessions/session-4.1.md) | Verified policy patch engine                     | pending     | pending  | pending | —                                               |
| [4.2](sessions/session-4.2.md) | Staff policy playground                          | pending     | pending  | pending | —                                               |
| [4.3](sessions/session-4.3.md) | Range explanations and next-available search     | pending     | pending  | pending | —                                               |
| [4.4](sessions/session-4.4.md) | Empty-calendar patient journey                   | pending     | pending  | pending | —                                               |
| [5.1](sessions/session-5.1.md) | Developer adoption and package validation        | pending     | pending  | pending | —                                               |
| [5.2](sessions/session-5.2.md) | First release, evidence and handoff              | pending     | pending  | pending | —                                               |
| [P1](sessions/session-P1.md)   | Persistence schema and database verification     | pending     | pending  | pending | —                                               |
| [P2](sessions/session-P2.md)   | Seed, frozen clock and snapshot loader           | pending     | pending  | pending | —                                               |
| [P3](sessions/session-P3.md)   | Projected read API and immutable input capture   | pending     | pending  | pending | —                                               |
| [P4](sessions/session-P4.md)   | Transactional booking, policy versions and reset | pending     | pending  | pending | —                                               |
| [P5](sessions/session-P5.md)   | HTTP adapter and full local application          | pending     | pending  | pending | —                                               |
| [H1](sessions/session-H1.md)   | Historical replay inputs and trace access        | pending     | pending  | pending | —                                               |
| [H2](sessions/session-H2.md)   | Descriptive insight aggregates                   | pending     | pending  | pending | —                                               |
| [H3](sessions/session-H3.md)   | Independent historical policy replay             | pending     | pending  | pending | —                                               |
| [H4](sessions/session-H4.md)   | Insights dashboard and historical simulator UI   | pending     | pending  | pending | —                                               |
| [A1](sessions/session-A1.md)   | Optional AI wording experiment design            | pending     | pending  | pending | —                                               |
| [A2](sessions/session-A2.md)   | Provider prototype and adversarial evaluation    | pending     | pending  | pending | —                                               |
| [A3](sessions/session-A3.md)   | Optional narration integration and fallback      | pending     | pending  | pending | —                                               |

## Milestone evidence

| Gate             | State                                          | Evidence                                                                                                          |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Planning 0.0     | implemented and merged; review unrecorded      | [Validation report](validation/session-0.0.md); PR #1 merged at dd7ed80                                           |
| Foundation 0.1   | implemented, independently reviewed and merged | [Validation report](validation/session-0.1.md); [PR #2](https://github.com/Kakumrkr/WhyNot/pull/2), merge d9a1962 |
| Core 1.6         | pending                                        | —                                                                                                                 |
| Alternatives 2.3 | pending                                        | —                                                                                                                 |
| Preview 3.3      | pending                                        | —                                                                                                                 |
| Policy/range 4.4 | pending                                        | —                                                                                                                 |
| Release 5.2      | pending                                        | —                                                                                                                 |
| Optional P/H/A   | not selected                                   | Human selection after first release                                                                               |

## Handoff notes

### Original planning — 2026-11-06 (superseded)

Original 32-card full-stack/AI-first roadmap was documentation only; no implementation.
Old cards are archived. Session IDs have been reassigned: consult active index.

### 0.0 — Planning handoff (2026-11-16)

- Built: revised engine/playground-first specification and D-050–D-059; complete active cards, skills and Codex review guidance.
- Branch: session/0.0-planning-handoff; PR https://github.com/Kakumrkr/WhyNot/pull/1. Checkpoints 3a1bf33 and 7027328 pushed; final HEAD recorded in PR/session response. Documentation gate passed; see validation report.
- Merge evidence: PR #1 merged 2026-11-16T21:02:27Z at dd7ed8064a88d965280a5fee9634929b9c23373c, confirmed via GitHub API. No submitted reviews; independent review remains unrecorded.
- Next: 0.1 foundation; use its complete card and prompt. No application code or dependencies added.

### 0.1 - Foundation (2026-11-16)

- Built: pinned supported workspace, four empty ESM package entry points, minimal React page, strict types, architectural lint tests, real verification commands, locked-install CI, MIT license and PR template. No domain behavior or future infrastructure.
- Branch: session/0.1-foundation; [PR #2](https://github.com/Kakumrkr/WhyNot/pull/2). Stable checkpoint 17360aefbe8abaf8ee82e4913672551710035771 pushed and remote verified. Final HEAD belongs in PR/final response.
- Evidence: pnpm install; second pnpm install --frozen-lockfile; pnpm verify green. Initial CI green at [run 43957545990](https://github.com/Kakumrkr/WhyNot/actions/runs/43957545990). After review fixes: 49 tests across 5 files, native built-package imports and web build green. [Screenshot](validation/session-0.1.png) inspected at 1280x800; no full browser/axe suite claimed before 3.1.
- Independent review: initial fresh-task whynot-review requested changes for browser meta aliases, destructured skipped helpers and source-only smoke imports. All three fixed with regression checks. Fresh follow-up review of baf593438816607ce8b25b90a2f1bef8bc91a4e9 found no remaining issues and independently reran pnpm verify (49 tests) and diff checks. Implementation CI is green at run 43958296672.
- Merge reconciliation in Session 1.1: GitHub PR metadata confirms PR #2 merged 2026-11-16T21:18:45Z at d9a19625c4e679b88591787bd7133ac305618b22. Clean local main was fast-forward checked against origin/main before branching. Final-head CI and post-merge CI links are recorded in PR #2.
- Decision: D-043 resolves Q-1, supported compatible pins and verified MIT owner. No unresolved material questions or foundation work remains.
- Next card: 1.1, selected by the user and implemented below. The original handoff prompt is retained for history.

Exact next prompt (do not execute in this session):

```text
$whynot-session
Start Session 1.1 using docs/sessions/session-1.1.md.
Confirm PR #2 is merged and reconcile docs/PROGRESS.md with that evidence.
Follow the full card, commit logical checkpoints, run required checks,
push all changes and open a PR. Do not start another session.
```

### 1.1 — Appointment and output contracts (2026-11-16)

- Built: strict Zod schemas and inferred types only, exported through the built contracts entry. Snapshot/resources/hours/coverage/confirmed and cancelled bookings; request/options/cost weights; 23 internal rule IDs and separate public replacements; rule-specific fact parameters, matrix/structural explanations/groups/summaries; assignments/alternatives/search/meta; separate staff/patient evaluations; typed policy patches/previews; range requests/results; version-1 synthetic envelope. No engine decisions or later-session implementation.
- Validation evidence: duplicate entity/window/fact IDs, dangling snapshot/request/output references, invalid dates/timezones/hours, nonfinite/noninteger/unsafe minute values, invalid policies, overflow/out-of-coverage requests, patient-only field allowlists, structural explanation constraints, disabled search constraints, trace caps/dictionaries, patch path/value/coalescing checks, preview clock/recursion checks and range member/reference checks. Synthetic envelopes bound resource arrays/bookings and candidate combinations independently of unrestricted engine snapshots.
- Branch: session/1.1-contracts; [PR #3](https://github.com/Kakumrkr/WhyNot/pull/3). Verified implementation checkpoints 0500c30 and e629c10 pushed. Final HEAD and remote equality belong in PR/final response.
- Verification: baseline pnpm verify passed (49 tests). Completed implementation pnpm verify passed on Node 24.22.3 and pnpm 12.21.0: format, lint, strict source/test/package typechecks, 69 tests across 8 files, native built ESM schema import and all package/web builds. New property uses 500 local runs, honoring FC_NUM_RUNS=5000 in CI; failures include fast-check seed/counterexample output. No property failures or golden corrections. git diff --check passed. No browser/PG gate applies to this card; no UI changes or screenshot evidence needed.
- Decision/surprise: D-060 supplies DOM declarations only to contracts because the first Zod import exposed its URL declaration dependency. Strict checking and runtime dependency boundaries remain enabled. The foundation smoke expectation of an empty export list was replaced with native schema/version parsing and absence of future engine functions.
- Final handoff gate: pnpm verify passed again with 69 tests after documentation updates. Non-bootstrap checkPlanning.ps1 passed: 32 cards, ordered dependencies, 250 local links, 8 skills, 3 agent TOML files, 23 rules, archives and whitespace. Live CI results/final HEAD are recorded in PR #3 to avoid self-referential tracked text.
- Scope boundary: this card validates time shapes and safe arithmetic. Local grid/DST/conversion helpers are owned by 1.2; projection by 2.1; patch evaluation by 4.1; range computation by 4.3. Adapter ingestion must additionally enforce 256 KiB before parsing and 31 covered local dates via time helpers. General snapshots deliberately do not inherit playground size caps.
- Unresolved material questions: none. Implemented only; independent review and merge pending. No self-claimed independent review. Stop after 1.1.

#### Session 1.1 review corrections — 2026-11-16

- Fresh-task review of PR #3 at ff59e90 requested changes: weekly schedules could not end at midnight; alternative changes could contradict returned times or contain no-op/repeated fields. Review outcome: changes required, not approved.
- Fixed both findings on the existing branch. D-061 and docs 02/04 record `24:00` as an end-only next-local-midnight boundary and consistent alternative change destinations, including null/any-practitioner semantics. No engine/time conversion or Session 1.2 behavior implemented.
- Added regression checks for split overnight/full-day hours, invalid midnight starts/ends, midnight break facts, contradictory/no-op/repeated changes for both audiences and valid practitioner selection/removal. Targeted regression suite: 3 tests passed; strict workspace/package typechecks passed.
- Final correction gate: pnpm verify passed on the pinned toolchain, including 72 tests across 9 files, formatting, lint, strict types and all package/web builds. Non-bootstrap planning validation and git diff --check also passed.
- Follow-up independent review and merge remain pending. Session 1.2 must first confirm PR #3's merge; these fixes do not constitute independent approval. Final verification/checkpoint/remote evidence is recorded in the PR and session response.

Exact next prompt (fresh review task; do not start 1.2 yet):

```text
$whynot-review
Review Session 1.1, PR #3, against docs/sessions/session-1.1.md and its required specification.
Use fresh context. Inspect the diff, validation evidence and D-060; run applicable checks.
Report findings with severity, file/line, evidence and suggested fix.
Do not edit, post comments, push or merge unless separately instructed.
```

Next eligible implementation only after PR #3 is independently reviewed and merged:

```text
$whynot-session
Start Session 1.2 using docs/sessions/session-1.2.md.
Confirm PR #3 is merged and reconcile docs/PROGRESS.md with that evidence.
Read the full card and required documents/skills. Implement only its Build list.
Commit logical verified checkpoints, run required checks, push all commits,
verify remote HEAD and open a PR. Do not start another session.
```

#### Session 1.1 follow-up review and merge — 2026-11-16

- User explicitly requested review and merge while starting 1.2. Fresh independent whynot-review of b3f4bf3f9b808f4b10e7d2fd975da89459a62813 found no remaining findings and recommended merge. Both prior findings were verified fixed. Reviewer independently ran pnpm verify on Node 24.22.3/pnpm 12.21.0: 72 tests across 9 files, strict types, lint, formatting, native ESM imports and all builds passed. git diff --check main...HEAD passed; no review edits.
- Review result recorded on PR #3 using authenticated GitHub CLI; latest-head CI run 43963452093 succeeded. Connector write calls returned integration-access 403; native CLI completed the authorized review/merge.
- GitHub API confirmed PR #3 closed and merged at 384e9e3455cdef475dd4b977906bf10f8b3a8c62. Clean main was fast-forwarded to origin/main before creating Session 1.2. Earlier pending-review/merge notes above are historical.

### 1.2 — Time handling and minimal fixtures (2026-11-16)

- Built: UTC-minute/explicit-offset parsing and formatting; local-date and exact elapsed arithmetic; half-open overlap/containment; local-midnight grids; end-only 24:00, weekly materialization and overnight splitting. London fold/gap recurring boundaries return structured unsupported_wall_time issues; explicit offsets select fold instants. Grid enumeration omits gaps and retains both fold occurrences. Historical sub-minute offsets are rejected to preserve integer-minute semantics.
- Fixtures: fresh authored minimal builders, fixed demoNow = 29913660 (2026-11-16 09:00 London), distinct test-only fast-check generation with 0–8 practitioners, 0–6 rooms, 0–3 equipment, hours/policies and confirmed/cancelled bookings. Seed 12012026 repeats exactly. London/Kolkata and empty pools are exercised. No random generators or fast-check in built package exports. No full Riverside/hero scenarios, rules, alternatives or UI changes.
- Branch: session/1.2-time-fixtures; [PR #4](https://github.com/Kakumrkr/WhyNot/pull/4). Verified implementation checkpoint 6c9240d pushed. Final HEAD and remote equality belong in PR/final response.
- Verification: baseline pnpm verify passed (72 tests); implementation pnpm verify passed (87 tests across 11 files), including formatting, lint/import/purity guards, strict types, native built ESM imports and all package/web builds. Targeted time/fixture suite passed (15 tests). Properties retain 500 local runs and FC_NUM_RUNS=5000 in CI with default seed/counterexample failure output. No property failures or golden corrections. Initial new-test epoch typo was corrected against an independent UTC calculation. No browser/PostgreSQL gate applies; no UI/screenshot evidence required.
- Decision: D-062 supplies DOM declarations required by Zod in the first engine/fixture contract consumers, without runtime changes or weakened strict/purity checks. Luxon is isolated in time.ts; explicitly anchored construction avoids implicit clock reads. A throwing actual-clock spy verifies that behavior. Test generators intentionally live under fixtures/test/generate.ts instead of the card's src/generate.ts suggestion, preserving the test-only boundary.
- Clean-checkout correction: CI run 43965880208 exposed missing built contracts declarations before root typechecking; local build artifacts had concealed the prerequisite. D-063 records building library declarations in dependency order at the start of pnpm typecheck. Strict checks and native package resolution remain enabled. Removed only ignored workspace dist outputs and reran pnpm verify to validate the clean-output path. Final-head CI evidence belongs in PR #4/session response; the earlier failed run is retained as evidence of the corrected issue.
- Handoff validation: non-bootstrap checkPlanning.ps1 passed (32 cards, ordered dependencies, 250 local links, 8 skills, 3 agent TOML files, 23 rules, archives/whitespace); git diff --check passed. No generated outputs or tool files are committed.
- Scope boundary: helpers report structured issues for later evaluation validation; no evaluate/isBookable/rules are implemented. Notice/advance tests cover arithmetic only; rule decisions begin 1.3. No new dependencies or infrastructure.
- Unresolved material questions: none. Implemented only; independent review and merge pending. Next eligible implementation is Session 1.3 after PR #4's review/merge. Stop after 1.2.

#### Session 1.2 independent review corrections — 2026-11-16

- User explicitly requested independent review and merge. Fresh review of e3eef275766fb72586d62a0ff1f21fa9b4f9dfcd found one major issue: Luxon invalid constructors consult Settings.now, so unsupported instants/zones threw when the actual clock was disabled. Reviewer independently passed pnpm verify (87 tests/11 files), planning checks and diff checks; changes were required before merge.
- Added a regression that first reproduced the actual-clock read, then rejected invalid timezone/timestamp ranges before Luxon construction. Checked UTC-encoded calendar-day arithmetic also avoids invalid construction on huge day shifts. Existing date, DST and error semantics remain unchanged. The clock-disabled regression covers invalid instants/zones, large/overflowing local-day shifts, next-midnight overflow, folds and gaps. No golden corrections or new dependencies.
- Follow-up independent review and final-head checks remain pending until recorded in PR #4/session response. Merge is explicitly authorized by the user after successful review/checks; no later session is started here.

Exact next prompt (fresh review task):

```text
$whynot-review
Review Session 1.2, PR #4, against docs/sessions/session-1.2.md and its required specification.
Use fresh context. Inspect the full diff, D-062 and validation evidence; run applicable checks.
Report findings with severity, file/line, evidence and suggested fix.
Do not edit, post comments, push or merge unless separately instructed.
```

Next implementation only after PR #4 is independently reviewed and merged:

```text
$whynot-session
Start Session 1.3 using docs/sessions/session-1.3.md.
Confirm PR #4 is merged and reconcile docs/PROGRESS.md with that evidence.
Read the full card and required documents/skills. Implement only its Build list.
Commit logical verified checkpoints, run required checks, push all commits,
verify remote HEAD and open a PR. Do not start another session.
```

### Session completion guidance maintenance — 2026-11-16

- Scope: persistent ownership through failures, verification, independent review, merge monitoring and durable handoff. No Session 1.3 or application behavior changes.
- Reconciled Session 1.2: PR #4 confirms fresh follow-up review of 488baa1923d3720df490d749c9d11e34a786955f, successful final-head CI run 43967944890 and merge at 94f71d918417acd7db02fc8f13578222cf628c87 on 2026-11-16T22:15:05Z. Earlier pending notes are historical.
- Branch: session/workflow-cloud-automation (existing branch name retained); [PR #5](https://github.com/Kakumrkr/WhyNot/pull/5). Previous checkpoint 24d612983d490618226a830c1b7cfbc96a4ef4e5 was pushed and verified. Final HEAD and current verification/review evidence belong in PR #5 and the session response.
- User cancelled cloud automation and scheduling. Removed the unactivated automation guide, requested daily schedule and setup questions. No executor, schedule, cloud resource or API credential was created, so no hosted resource needs disabling. D-064 covers session completion only; its earlier human-merge default is superseded by the later D-065 standing authorization below.
- Retained: fix recoverable failures and review findings instead of asking to restart the card; green required gates, fresh review of changed heads, pushed checkpoints, merge evidence and exact continuation/handoff notes. Hard runtime limits and genuine external blockers must be recorded honestly rather than claimed complete.
- Current cleanup passed pnpm verify on Node 24.22.3/pnpm 12.21.0 (88 tests/11 files, formatting, lint, strict types and builds), planning validation (32 cards, 254 links, 8 skills, 3 agent configurations, 23 rules) and git diff --check. Fresh review and final-head CI evidence belong in PR #5; maintenance remains unmerged.
- Next: finish verification and fresh review of this documentation cleanup, then merge under D-065 standing authorization and verify main CI. Session 1.3 remains pending and is not started by this task.

#### Standing merge authorization — 2026-11-16

- User explicitly reapproved merging every selected session to main through a PR after independent review and green gates, including further corrective PRs if checks fail after merge. D-065 records this durable authorization; future sessions need no repeated merge approval.
- Updated AGENTS, session/review skills, workflow, README and all 32 active cards, including final completion checkboxes. Cloud automation remains cancelled. Session 1.3 remains unstarted.
- This authorization update passed pnpm verify (88 tests/11 files), planning validation (32 cards, 254 links) and git diff --check. Fresh exact-head review and final CI evidence belong in PR #5. Merge and post-merge evidence will be recorded there after success; do not infer merge from this note.
- Exact next prompt after confirmed PR #5 merge and main CI: Start Session 1.3 using its full card, reconcile PROGRESS from PR #5 evidence, confirm merged prerequisites, and use D-065 to complete its verification/review/merge/correction/handoff loop. Do not execute that prompt in this maintenance task.

#### Completion guidance maintenance merge reconciliation — 2026-11-16

- GitHub confirms PR #5 merged at 68935b41a93b8a750915b69be76699ba8bc9aab7 on 2026-11-17T00:38:00Z. Required main CI passed at [run 43989192471](https://github.com/Kakumrkr/WhyNot/actions/runs/43989192471). Earlier pending maintenance notes are historical.
- Clean main matched origin/main before creating Session 1.3. PR #4's prerequisite merge at 94f71d918417acd7db02fc8f13578222cf628c87 was independently confirmed through live GitHub metadata.

### 1.3 — Clinic, patient, timing and preference rules (2026-11-16)

- Built: all 23 internal catalog entries with exact v1 metadata; nine internal request-related checks covering clinic closure/hours, notice/advance, returning/referral eligibility, patient daily limits, practitioner preference and first-missing-dimension structural evidence. No public evaluate/isBookable or later resource checks. Only catalog/version are new package exports.
- Validation: contracts parse untrusted input before checks, reject unknown references, unsafe arithmetic, off-grid/local-grid and coverage errors, and materialize affected clinic/working/break schedules to reject unsupported DST boundaries. Safe errors do not echo input. Daily counts use confirmed booking starts on the clinic date; cancellations and other patients do not count.
- Grounding: sorted, escaped key/value pairs include subject, rule parameters and optional windows. Catalog controls visibility/relaxability, including staff-only raw evidence; patient projection remains owned by 2.1. No claim of patient-safe serialization before projection exists.
- Branch: session/1.3-request-rules; [PR #6](https://github.com/Kakumrkr/WhyNot/pull/6). Verified implementation checkpoint 40d1a2e829ee214bd082c976e988a102de8f8062 was pushed with remote HEAD equality confirmed. Final HEAD belongs in PR/final response.
- Verification: baseline pnpm verify passed (88 tests); implementation pnpm verify passed (106 tests/16 files), followed by a passing fixed generator coverage check. Final gate includes 107 tests. Tests cover each rule's positive/negative/boundary cases, exact elapsed advance across both DST changes, local midnight, closing/adjacent/split hours, cancelled bookings, explicit empty pools versus dangling references, catalog integrity and collision-resistant grounding. Generated properties retain 500 local/5000 CI runs, default seed/counterexample failure output, frozen-input preservation, repeated determinism and shuffled-input equality. Independent arithmetic expectations check generated timing, eligibility and daily counts; a fixed corpus reaches all nine implemented rules.
- Scope: generator extensions stay in fixtures/test/generate.ts, consistent with 1.2's test-only boundary. No new dependencies, golden corrections, UI changes, browser/PG gates or material specification changes. Initial lint caught one unused test import, which was removed while splitting tests into small focused files. No unresolved material questions.
- Status: implemented; fresh independent review, final-head CI and merge pending. Evidence will be recorded on PR #6. Do not start 1.4 before completion under D-065.

Exact continuation if interrupted before merge:

```text
$whynot-session
Resume Session 1.3 on session/1.3-request-rules, PR #6.
Implementation is complete; read current PROGRESS, QUESTIONS and the full card.
Continue final verification, fresh exact-head whynot-review, fixes, green CI and D-065 merge.
Confirm main CI and persist the durable handoff. Do not start 1.4 in this task.
```

Next prompt only after confirmed PR #6 merge and green main CI:

```text
$whynot-session
Start Session 1.4 using docs/sessions/session-1.4.md.
Confirm PR #6 is merged and reconcile PROGRESS with its evidence.
Read the full card and required documents/skills; implement only its Build list.
Complete verification, fresh independent review, pushed commits, PR merge and main CI under D-065.
Persist the durable handoff and stop before Session 1.5.
```

#### Session 1.3 independent review correction — 2026-11-16

- Fresh-task whynot-review of 5604e8ed5b222d3851d2d9c06d88ccc91f2dd046 against base 68935b41a93b8a750915b69be76699ba8bc9aab7 found one major verification issue: CI's required 5000-run property took about 9.6 seconds and exceeded Vitest's default five-second test timeout. [Run 43993033975](https://github.com/Kakumrkr/WhyNot/actions/runs/43993033975) failed with 106 passing tests and one timeout. No assertion failure or shrunk counterexample occurred; no additional implementation findings were reported.
- Gave only that correctness property an explicit 30-second timeout, retaining all assertions and the 500-local/5000-CI counts. The 1.6 benchmark gate is unchanged. The targeted 5000-run property passed locally in 5.82 seconds. Follow-up full verification, fresh changed-head review and CI remain required before merge.
- Reviewer independently passed pnpm verify (107 tests/16 files), planning validation and diff checks on the earlier head. That review requested changes and is not approval of the correction.

#### Session 1.3 final review, merge and completion — 2026-11-16

- Follow-up independent whynot-review of 44a4da7ba88fe486aa39d575aeb6a6dd202e430f against base 68935b41a93b8a750915b69be76699ba8bc9aab7 found no remaining findings and recommended merge once required CI passed. Reviewer independently ran FC_NUM_RUNS=5000 pnpm verify: 107 tests across 16 files, formatting, lint, strict types and all builds passed. Planning validation, diff checks and local/remote/live-PR head equality passed. No assertions or run counts were reduced; no review edits.
- Final-head CI passed at [run 43993482817](https://github.com/Kakumrkr/WhyNot/actions/runs/43993482817) and [run 43993488286](https://github.com/Kakumrkr/WhyNot/actions/runs/43993488286). Under D-065, PR #6 merged the exact reviewed head through GitHub without bypassing protections. GitHub confirms merge at 9f57ed1e988378fe1a92cd45a27256ca1a4af95e on 2026-11-17T01:12:10Z.
- Required post-merge main CI passed at [run 43993740038](https://github.com/Kakumrkr/WhyNot/actions/runs/43993740038). Clean local main was fast-forwarded to that merge before creating session/1.3-completion-handoff for this evidence reconciliation. No application changes or further behavior corrections were needed after merge.
- Session 1.3 is implemented, independently reviewed and merged; earlier pending-review/merge notes are historical. Its Done when criteria are satisfied. Final handoff reconciliation verification/review/PR evidence belongs in its PR and the final response. No unresolved material questions or unpushed implementation commits remain.
- Next eligible card: Session 1.4, practitioner/room/equipment rules, using the exact prompt above. Session 1.4 has not started and must be a separate task.

### 1.4 - Practitioner, room and equipment rules (2026-11-16)

- Built: all fourteen resource catalog checks: practitioner skill/hours/break/leave/busy/buffer/daily cap; room capability/maintenance/busy/turnover; equipment type/maintenance/busy. Checks are internal, without matrix/evaluation/explanation/template or coupled-resource behavior. Existing catalog metadata and public exports are unchanged.
- Occupancy: sorted per-resource interval lookup uses prefix maximum ends to retain nested long overlaps. Both existing-service and requested-service trailing buffers/turnover are checked; a direct overlap emits busy alone for that booking. Stable facts identify actual bookings/windows and the service whose buffer applies. Confirmed starts count on clinic dates; cancelled bookings are ignored. Validation additionally rejects unsafe buffered endpoints before interval arithmetic.
- Branch: session/1.4-resource-rules; [PR #8](https://github.com/Kakumrkr/WhyNot/pull/8). Verified implementation checkpoint 4ec74a2 pushed. Final HEAD and remote equality belong in PR/final response.
- Prerequisite: live GitHub metadata confirms PR #6 merged at 9f57ed1e988378fe1a92cd45a27256ca1a4af95e; clean main was current at e3a99a8 (PR #7 completion handoff) before branching.
- Verification: existing 107-test suite passed; implementation pnpm verify passed on Node 24.22.3/pnpm 12.21.0 (122 tests across 19 files, formatting, lint, strict types, native ESM smoke checks and builds). Thirteen authored tests cover exact adjacency, one-minute overlaps/buffer endpoints, requested buffers reaching next bookings, separate service settings, zero buffers, missing capabilities/types, long overlaps, local midnight, adjacent/split working hours, breaks, leave/maintenance windows, default/override/zero/exact caps, cancellations and safe arithmetic. Generated independent arithmetic checks cover every resource rule, frozen-input preservation, repeated equality and shuffled/nested input order. The fixed seed 14014026 corpus reaches all fourteen rules. New property passed 5000 runs in 16.42 seconds; local default remains 500 and CI 5000, with failure seeds/counterexamples retained by fast-check. No property failures or golden corrections.
- Planning validation passed (32 cards, 254 local links, 8 skills, 3 agent configurations, 23 rules); git diff --check passed. No UI/screenshot/browser/PostgreSQL gate applies. No dependencies or specification semantics changed. Generators remain in fixtures/test/generate.ts, preserving the test-only boundary established in 1.2/1.3.
- Status: implemented; fresh independent review, required CI and merge pending. No unresolved material questions. Continue this card through review/merge/main CI under D-065; stop before 1.5.

Exact continuation if interrupted:

```text
$whynot-session
Resume Session 1.4 on session/1.4-resource-rules, PR #8.
Read PROGRESS, QUESTIONS and docs/sessions/session-1.4.md fully.
Continue fresh exact-head whynot-review, resolve findings, verify and push every commit.
Merge under D-065 only after green required checks and independent review.
Confirm main CI and persist the durable handoff; do not start Session 1.5 here.
```

Next prompt only after confirmed Session 1.4 merge and green main CI:

```text
$whynot-session
Start Session 1.5 using docs/sessions/session-1.5.md.
Confirm Session 1.4 prerequisite PRs are merged and reconcile PROGRESS with evidence.
Read the full card and required documents/skills; implement only its Build list.
Complete verification, fresh independent review, pushed commits, PR merge and main CI under D-065.
Persist the durable handoff and stop before Session 1.6.
```

#### Session 1.4 final review, merge and completion - 2026-11-16

- Fresh-task independent whynot-review of 4b0fa3a2ad660dfdaa08ad3d0f3aa79459a384f0 against base e3a99a888f051b0b6bd30764082f0299becb031e found no findings and recommended merge after required CI. Reviewer independently passed FC_NUM_RUNS=5000 pnpm verify on Node 24.22.3/pnpm 12.21.0: 122 tests across 19 files, formatting, lint, strict types, native ESM checks and builds. Planning validation and diff checks passed. No review edits or corrections were needed; local/remote/live PR heads matched.
- Final-head CI passed at [run 43996683171](https://github.com/Kakumrkr/WhyNot/actions/runs/43996683171) and [run 43996690832](https://github.com/Kakumrkr/WhyNot/actions/runs/43996690832). [Review evidence](https://github.com/Kakumrkr/WhyNot/pull/8#issuecomment-6935144162) records exact head and checks. D-065 authorized merging this exact reviewed head through PR #8 without bypassing protections. GitHub confirms merge at d8f8a73621be3e99f0d9ab5f3326e950b7ba08a6 on 2026-11-17T01:37:32Z.
- Required post-merge main CI passed at [run 43996996433](https://github.com/Kakumrkr/WhyNot/actions/runs/43996996433). Clean local main was fast-forwarded to this merge before creating session/1.4-completion-handoff for evidence reconciliation. No application changes or post-merge behavior corrections were needed.
- Session 1.4 is implemented, independently reviewed and merged; earlier pending-review/merge notes are historical. Its Done when criteria are satisfied. Final handoff reconciliation PR, reviewed head and CI evidence belong in that PR/final response. All implementation commits are pushed; no unresolved material questions remain.
- Next eligible card is Session 1.5, candidates/matrix/independent reference, using the exact next prompt above. Session 1.5 has not started and requires a separate user-selected task.

### 1.5 — Candidates, matrix and independent reference (2026-11-17)

- Built: canonical real candidate enumeration, factorized global/practitioner/room/equipment violation matrix, first-missing-dimension structural evidence without invented rows, and public boolean isBookable. Internal witness selection uses confirmed local-date practitioner load, then Unicode codepoint practitioner/room/equipment IDs. Requested practitioners remain hard constraints. No public evaluate, explanations or alternatives from later cards.
- Independent specification oracle lives only in engine/test/reference: direct candidate and booking loops, separate Luxon calendar conversion and minute-by-minute schedule coverage; no optimized rules, matrix, validator or interval index imports. Mixed generated cases include feasible and blocked outcomes. Existing fixtures/test/generate.ts remains test-only, as established by D-062; no production generator/checker exports or dependencies were added.
- Branch: session/1.5-feasibility. Local verified implementation checkpoint: b8e6c8743f76529a15db7af0a46d1100c519c81c, based on main 5ab8ad93f5e28dec77ba042eda1e9f3bc5594c54. No remote session branch or PR exists: publication is blocked (Q-1.5-WRITE). All session commits are currently unpushed; final local HEAD belongs in the final response.
- Prerequisite evidence: live GitHub confirms PR #8 merged at d8f8a73621be3e99f0d9ab5f3326e950b7ba08a6 and completion PR #9 merged at 5ab8ad93f5e28dec77ba042eda1e9f3bc5594c54. Main CI passed at https://github.com/Kakumrkr/WhyNot/actions/runs/43997751257. No incomplete predecessor branch was found.
- Verification: isolated untouched main passed pnpm verify (122 tests). Implementation FC_NUM_RUNS=5000 pnpm verify passed on Node 24.22.3/pnpm 12.21.0: 128 tests across 20 files, formatting, lint, strict typechecks, native built ESM smoke imports and all package/web builds. P1/P2/P8/P9 check independent feasibility and witnesses, rule sets for every real row, frozen-input preservation, repeatability and shuffled resource/nested-input order. Authored cases cover all eight empty-pool combinations, incompatible resources, null equipment, preference, confirmed/cancelled local-day load, Unicode ties, invalid inputs, midnight coverage and exact/one-minute buffer boundaries. No property failures, golden corrections, specification changes or UI/browser/PostgreSQL gates.
- Environment diagnosis: the first verification overlapped the implementation export change, so it is not baseline evidence; a separate untouched checkout supplied the baseline above. Sandboxed native smoke subprocesses failed with EPERM; the unchanged smoke tests and full implementation gate passed outside that sandbox. The 5000-case differential test takes about two minutes with concurrent checks; its 300-second behavioral-test timeout preserves all run counts/assertions and changes no performance target.
- Status: implemented and locally verified; fresh independent review is in progress. Git push and connected-app branch creation both return HTTP 403, including after the user reconnected GitHub. Repository reads work and repository metadata reports push permission; the selected-repository installation must still grant effective write access. No remote HEAD equality, PR CI, merge or post-merge CI is claimed. Required planning PowerShell validator is unavailable in this environment; no planning-validator success is claimed. git diff --check passed.
- Remaining phase: finish independent review and any fixes, restore GitHub write access, push all local commits, verify remote HEAD, open the Session 1.5 PR, pass required CI, merge the exact reviewed head under D-065 and confirm main CI. Save final completion evidence before releasing 1.6. Stop at this external blocker if access is not restored; do not mark the session complete.

Exact continuation for this same card:

```text
$whynot-session
Resume Session 1.5 on session/1.5-feasibility in /workspace/WhyNot.
Read current PROGRESS, QUESTIONS and docs/sessions/session-1.5.md.
Implementation and the 5000-run local gate are complete; check final review evidence in the latest handoff.
Resolve Q-1.5-WRITE, push every local commit and verify remote HEAD equality.
Open the PR, finish fresh exact-head review and green required CI, merge under D-065,
confirm main CI and persist the durable completion handoff. Do not start Session 1.6 here.
```

Next prompt only after confirmed Session 1.5 merge and green main CI:

```text
$whynot-session
Start Session 1.6 using docs/sessions/session-1.6.md.
Confirm Session 1.5 is independently reviewed and merged with green main CI.
Read the full card and required documents/skills; implement only its Build list.
Complete verification, fresh independent review, pushed commits, PR merge and main CI under D-065.
Persist the durable handoff and stop before Session 2.1.
```
