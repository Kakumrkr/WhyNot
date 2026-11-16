# PROGRESS

Active roadmap approved 2026-11-16 (D-050–D-059). Session 0.1 foundation is independently reviewed and confirmed merged through PR #2. Session 1.1 contracts are implemented on session/1.1-contracts with verification green; independent review and merge remain pending through PR #3. Session 0.0 is confirmed merged; no submitted independent review was found. Do not interpret implemented as merged.

| Session                        | Title                                            | Implemented | Reviewed | Merged  | PR                                              |
| ------------------------------ | ------------------------------------------------ | ----------- | -------- | ------- | ----------------------------------------------- |
| [0.0](sessions/session-0.0.md) | Planning handoff                                 | done        | pending  | done    | [#1](https://github.com/Kakumrkr/WhyNot/pull/1) |
| [0.1](sessions/session-0.1.md) | Foundation and architectural boundaries          | done        | done     | done    | [#2](https://github.com/Kakumrkr/WhyNot/pull/2) |
| [1.1](sessions/session-1.1.md) | Appointment and output contracts                 | done        | pending  | pending | [#3](https://github.com/Kakumrkr/WhyNot/pull/3) |
| [1.2](sessions/session-1.2.md) | Time handling and minimal fixtures               | pending     | pending  | pending | —                                               |
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
