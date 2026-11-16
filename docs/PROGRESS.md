# PROGRESS

Active roadmap approved 2026-11-16 (D-050–D-059). Sessions 0.1 and 1.1 are independently reviewed and confirmed merged through PRs #2 and #3. Session 1.2 is independently reviewed and confirmed merged through PR #4 at 94f71d918417acd7db02fc8f13578222cf628c87. Workflow automation maintenance is in progress; Session 1.3 has not started. Session 0.0 is confirmed merged; no submitted independent review was found. Do not interpret implemented as merged.

| Session                        | Title                                            | Implemented | Reviewed | Merged  | PR                                              |
| ------------------------------ | ------------------------------------------------ | ----------- | -------- | ------- | ----------------------------------------------- |
| [0.0](sessions/session-0.0.md) | Planning handoff                                 | done        | pending  | done    | [#1](https://github.com/Kakumrkr/WhyNot/pull/1) |
| [0.1](sessions/session-0.1.md) | Foundation and architectural boundaries          | done        | done     | done    | [#2](https://github.com/Kakumrkr/WhyNot/pull/2) |
| [1.1](sessions/session-1.1.md) | Appointment and output contracts                 | done        | done     | done    | [#3](https://github.com/Kakumrkr/WhyNot/pull/3) |
| [1.2](sessions/session-1.2.md) | Time handling and minimal fixtures               | done        | done     | done    | [#4](https://github.com/Kakumrkr/WhyNot/pull/4) |
| [1.3](sessions/session-1.3.md) | Clinic, patient, timing and preference rules     | pending     | pending  | pending | —                                               |
| [1.4](sessions/session-1.4.md) | Practitioner, room and equipment rules           | pending     | pending  | pending | —                                               |
| [1.5](sessions/session-1.5.md) | Candidates, matrix and independent reference     | pending     | pending  | pending | —                                               |
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

### Workflow maintenance — 2026-11-16

- Scope: unattended hosted execution planning, persistent recovery, review/merge lifecycle and durable handoffs. No Session 1.3 or application behavior changes.
- Reconciled Session 1.2: GitHub PR #4 confirms fresh follow-up review, reviewed head 488baa1923d3720df490d749c9d11e34a786955f, successful final-head CI run 43967944890 and merge at 94f71d918417acd7db02fc8f13578222cf628c87 on 2026-11-16T22:15:05Z. Earlier pending notes are historical.
- Branch: session/workflow-cloud-automation. D-064 replaces premature stop-at-PR/two-attempt handoffs with continued ownership and gated merge/handoff. See [automation plan](workflow-automation.md).
- Baseline pnpm verify passed on Node 24.22.3/pnpm 12.21.0: 88 tests/11 files, formatting, lint, types and builds. Final verification, independent review and this maintenance PR's merge remain pending.
- Hosted activation remains pending execution-route, schedule, merge-policy and cost/access setup. No scheduled executor has been created or activated; no unattended run is claimed.
- Next action: finish this maintenance task's configuration and activation gates. Do not start 1.3 in this task. Once maintenance is merged and activation passes, a later authorized trigger may select 1.3 using its full card and verified PR #4 prerequisite.
