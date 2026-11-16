# PROGRESS

Active roadmap approved 2026-11-16 (D-050–D-059). Session 0.1 foundation is implemented on session/0.1-foundation; follow-up review and final CI are pending. Session 0.0 is confirmed merged; no submitted independent review was found. Do not interpret implemented as merged.

| Session                        | Title                                            | Implemented | Reviewed | Merged  | PR                                              |
| ------------------------------ | ------------------------------------------------ | ----------- | -------- | ------- | ----------------------------------------------- |
| [0.0](sessions/session-0.0.md) | Planning handoff                                 | done        | pending  | done    | [#1](https://github.com/Kakumrkr/WhyNot/pull/1) |
| [0.1](sessions/session-0.1.md) | Foundation and architectural boundaries          | done        | pending  | pending | [#2](https://github.com/Kakumrkr/WhyNot/pull/2) |
| [1.1](sessions/session-1.1.md) | Appointment and output contracts                 | pending     | pending  | pending | —                                               |
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

| Gate             | State                                         | Evidence                                                                                           |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Planning 0.0     | implemented and merged; review unrecorded     | [Validation report](validation/session-0.0.md); PR #1 merged at dd7ed80                            |
| Foundation 0.1   | local gate green; follow-up review/CI pending | [Validation report](validation/session-0.1.md); [PR #2](https://github.com/Kakumrkr/WhyNot/pull/2) |
| Core 1.6         | pending                                       | —                                                                                                  |
| Alternatives 2.3 | pending                                       | —                                                                                                  |
| Preview 3.3      | pending                                       | —                                                                                                  |
| Policy/range 4.4 | pending                                       | —                                                                                                  |
| Release 5.2      | pending                                       | —                                                                                                  |
| Optional P/H/A   | not selected                                  | Human selection after first release                                                                |

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
- Independent review: initial fresh-task whynot-review requested changes for browser meta aliases, destructured skipped helpers and source-only smoke imports. All three fixed with regression checks; follow-up review pending. Merge pending until actual GitHub evidence.
- Decision: D-043 resolves Q-1, supported compatible pins and verified MIT owner. No unresolved material questions. Only final review/CI/handoff remain.
- Next eligible card after this PR merges: 1.1; stop here. A later task reconciles actual merge evidence from PR #2 rather than assuming it.

Exact next prompt (do not execute in this session):

```text
$whynot-session
Start Session 1.1 using docs/sessions/session-1.1.md.
Confirm PR #2 is merged and reconcile docs/PROGRESS.md with that evidence.
Follow the full card, commit logical checkpoints, run required checks,
push all changes and open a PR. Do not start another session.
```
