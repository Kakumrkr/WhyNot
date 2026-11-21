# PROGRESS

Keep this file short. Sessions read only "Current state" and the table; update both in the session branch before merge (docs/09 §Handoff). Full history to 2026-11-17 is in [the archive](archive/progress-history-2026-11-17.md) and is not required reading.

## Current state

- **Next card after this PR merges:** [P5 — HTTP adapter and full local application](sessions/session-P5.md). Use the starter prompt on that card. D-076 sets the order P1 → P3 → P5.
- **Last confirmed session merge at handoff:** P1 via [PR #26](https://github.com/Kakumrkr/WhyNot/pull/26) at `c57fcf8`.
- **Open question:** [Q-2.2-capability-context](QUESTIONS.md#q-22-capability-context) tracks the affirmative H1 and H11 qualification lists.
- **External validation:** Clinical usefulness and developer adoption are pending. See the [first-release evidence](reviews/session-5.2-release.md).
- **Workflow:** D-071/D-072 apply from 2.1 onward: affected tests while working, `pnpm verify` once, one push, one review, merge, handoff in the same PR. Milestone gates run `pnpm test:deep` + `pnpm bench` locally.

## Status

| Session                        | Title                                          | Implemented | Reviewed    | Merged | PR                                                |
| ------------------------------ | ---------------------------------------------- | ----------- | ----------- | ------ | ------------------------------------------------- |
| [0.0](sessions/session-0.0.md) | Planning handoff                               | done        | done in 5.2 | done   | [#1](https://github.com/Kakumrkr/WhyNot/pull/1)   |
| [0.1](sessions/session-0.1.md) | Foundation and architectural boundaries        | done        | done        | done   | [#2](https://github.com/Kakumrkr/WhyNot/pull/2)   |
| [1.1](sessions/session-1.1.md) | Appointment and output contracts               | done        | done        | done   | [#3](https://github.com/Kakumrkr/WhyNot/pull/3)   |
| [1.2](sessions/session-1.2.md) | Time handling and minimal fixtures             | done        | done        | done   | [#4](https://github.com/Kakumrkr/WhyNot/pull/4)   |
| [1.3](sessions/session-1.3.md) | Clinic, patient, timing and preference rules   | done        | done        | done   | [#6](https://github.com/Kakumrkr/WhyNot/pull/6)   |
| [1.4](sessions/session-1.4.md) | Practitioner, room and equipment rules         | done        | done        | done   | [#8](https://github.com/Kakumrkr/WhyNot/pull/8)   |
| [1.5](sessions/session-1.5.md) | Candidates, matrix and independent reference   | done        | done        | done   | [#10](https://github.com/Kakumrkr/WhyNot/pull/10) |
| [1.6](sessions/session-1.6.md) | Minimal explanations and core gate             | done        | done        | done   | [#12](https://github.com/Kakumrkr/WhyNot/pull/12) |
| [2.1](sessions/session-2.1.md) | Patient and staff output projection            | done        | done        | done   | [#14](https://github.com/Kakumrkr/WhyNot/pull/14) |
| [2.2](sessions/session-2.2.md) | Templates, grouping and helpfulness            | done        | done        | done   | [#15](https://github.com/Kakumrkr/WhyNot/pull/15) |
| [2.3](sessions/session-2.3.md) | Verified alternatives and truthful search      | done        | done        | done   | [#16](https://github.com/Kakumrkr/WhyNot/pull/16) |
| [3.1](sessions/session-3.1.md) | Static playground design and shell             | done        | done        | done   | [#17](https://github.com/Kakumrkr/WhyNot/pull/17) |
| [3.2](sessions/session-3.2.md) | Patient and staff explanation journey          | done        | done        | done   | [#18](https://github.com/Kakumrkr/WhyNot/pull/18) |
| [3.3](sessions/session-3.3.md) | Inspector and first public preview             | done        | done        | done   | [#19](https://github.com/Kakumrkr/WhyNot/pull/19) |
| [4.1](sessions/session-4.1.md) | Verified policy patch engine                   | done        | done        | done   | [#21](https://github.com/Kakumrkr/WhyNot/pull/21) |
| [4.2](sessions/session-4.2.md) | Range explanations and next-available search   | done        | done        | done   | [#22](https://github.com/Kakumrkr/WhyNot/pull/22) |
| [4.3](sessions/session-4.3.md) | Policy playground and empty-calendar journey   | done        | done        | done   | [#23](https://github.com/Kakumrkr/WhyNot/pull/23) |
| [5.1](sessions/session-5.1.md) | Developer adoption and package validation      | done        | done        | done   | [#24](https://github.com/Kakumrkr/WhyNot/pull/24) |
| [5.2](sessions/session-5.2.md) | First release, evidence and handoff            | done        | —           | done   | [#25](https://github.com/Kakumrkr/WhyNot/pull/25) |
| [P1](sessions/session-P1.md)   | Database foundation, seed and snapshot loader  | done        | done        | done   | [#26](https://github.com/Kakumrkr/WhyNot/pull/26) |
| [P3](sessions/session-P3.md)   | API, input capture and transactional booking   | done        | —           | —      | [#27](https://github.com/Kakumrkr/WhyNot/pull/27) |
| [P5](sessions/session-P5.md)   | HTTP adapter and full local application        | —           | —           | —      | —                                                 |
| [H1](sessions/session-H1.md)   | Historical replay inputs and trace access      | —           | —           | —      | —                                                 |
| [H2](sessions/session-H2.md)   | Descriptive insight aggregates                 | —           | —           | —      | —                                                 |
| [H3](sessions/session-H3.md)   | Independent historical policy replay           | —           | —           | —      | —                                                 |
| [H4](sessions/session-H4.md)   | Insights dashboard and historical simulator UI | —           | —           | —      | —                                                 |
| [A1](sessions/session-A1.md)   | Optional AI wording experiment design          | —           | —           | —      | —                                                 |
| [A2](sessions/session-A2.md)   | Provider prototype and adversarial evaluation  | —           | —           | —      | —                                                 |
| [A3](sessions/session-A3.md)   | Optional narration integration and fallback    | —           | —           | —      | —                                                 |

## Milestone gates

Each gate card runs `pnpm test:deep` (5000 properties) and `pnpm bench` locally against the committed baseline and records both in its PR (D-071/D-072).

| Gate             | State        | Evidence                                                                                                                                           |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core 1.6         | passed       | PR #12 CI ran 5000-run properties and S benchmark (runs 44126309537, 44126295724); baselines in packages/engine/bench/                             |
| Alternatives 2.3 | passed       | Local deep suite passed at 5000 runs per property. S alternatives p95 131.7 ms (400 ms target). Evidence in PR #16.                                |
| Preview 3.3      | local passed | 5000-run properties, built-app browser checks and the S benchmark passed locally. PR #19 tracks CI and deployment.                                 |
| Policy/range 4.3 | local passed | 5,000-run properties, built-app Playwright and the Windows baseline benchmark passed. Evidence in PR #23.                                          |
| Release 5.2      | local passed | 236 standard and deep tests, 68 Chromium checks, Windows S/M/L bench, clean clone and packed consumer. [Evidence](reviews/session-5.2-release.md). |
| Persistence      | selected     | D-076. P1, P3 and P5 remain subject to their card gates.                                                                                           |
| History and AI   | not selected | Human selection after first release.                                                                                                               |

## Carry-forward notes

Facts later sessions need, each one line. Remove a note once it no longer applies.

- D-066: six H1/H5 golden skill entries were corrected to cheaper hours facts; no other hero sets changed.
- D-067–D-070: 1.6 performance repairs (shared time validation, native timezone catalog, benchmark `--max-semi-space-size=64`, no diagnostic allocations on success). Keep the independent Luxon equivalence properties.
- Benchmark baselines: `baseline-win32.json` (owner's machine, authoritative for the S gate) and `baseline-linux.json` (one CI runner, informational).
- engine `time.ts` is ~329 lines by design (all Luxon/timezone code stays there); see packages/engine/README.md.
- Native ESM smoke tests spawn `node` subprocesses; sandboxed runs can fail with EPERM. Rerun them outside the sandbox instead of changing them.

## Last handoff

**P3 — API, input capture and transactional booking.** Includes the former P4 scope under D-076. Fastify exposes the clinic and availability, projected slot/range explanations, booking and cancellation, policy list/activation, and an opt-in fixture reset. Successful bookings return a public cancellation ID distinct from internal evidence. Reset preserves immutable policy and evaluation history.

The 19 new portable tests cover H1–H11 parity/capture, privacy, and mutation behavior. Five new real PostgreSQL tests cover the ten-request sole-assignment race, disjoint-slot buffer and cap races, and bounded retry exhaustion.

P5 should mount `createApp` with the exact browser origin, use `apiResults` from `@whynot/contracts/api` to parse decisions back to engine minutes, and use the returned cancellation ID for `DELETE /api/bookings/:id`. Use `demoWindow` for initial date choices; availability covers dates within known database coverage so verified openings can be followed. See the [API threat model](security/threat-model.md) for headers and reset configuration.
