# First-release evidence

This record covers the WhyNot release candidate on November 21, 2026. Clinical usefulness and developer adoption are **pending external review**. No scheduling practitioner ratings or outside developer integration observations have been recorded. The following checks establish technical readiness for the modeled fictional scenarios. [Helpfulness criteria](session-2.2-helpfulness.md)

## Verification results

| Check                                      | Result                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm verify`                              | Passed format, lint, types, 236 tests in 35 files, and production build                                                                          |
| `pnpm test:deep`                           | 236 tests passed with 5,000 cases per property                                                                                                   |
| Built Playwright suite                     | 66 passed across desktop 1280 px and mobile 390 px, with no serious or critical axe findings on checked surfaces                                 |
| Clean clone                                | Frozen lockfile install, `pnpm dev` before any library build, production build and preview passed. Both servers rendered H1 in Chromium          |
| Packed consumer                            | Three tarballs installed outside the checkout. Allowlisted entries and files, TypeScript declarations, ESM loading and the Harbor example passed |
| `pnpm audit --prod --audit-level moderate` | No known vulnerabilities reported                                                                                                                |

## Scope and coverage

- **Correctness.** Hero goldens H1–H11, edge goldens E01–E16, and properties P1–P16 cover modeled feasibility, explanation coverage, order, rechecks, privacy and reference integrity. Regression tests cover empty resources, search and trace limits, actual policy patches, and local dates and DST transitions. Narrator coverage checks the rule catalog and audience-specific templates. [Testing specification](../06-testing-and-accuracy.md)
- **Playground.** Built Chromium journeys cover desktop 1280 px and mobile 390 px. The suites exercise keyboard and focus, serious and critical axe findings, patient/staff switching, the inspector, alternatives, policy and range states, import/export and the repository-path deep link. The release adds a delayed-read regression on Back. [Desktop staff inspector](media/staff-inspector-desktop.png) · [Mobile patient explanation](media/patient-mobile.png) · [Alternative walkthrough](media/check-alternative.gif)
- **Public preview.** Chromium observed the deployed playground at both widths on November 21. The H1 Staff deep link expanded a candidate matrix, switching to Patient removed the inspector, and reload kept that view. The JavaScript and CSS loaded from the Pages repository path. [Public H1 Staff link](https://kakumrkr.github.io/WhyNot/?scenarioId=H1&audience=staff)
- **Package and safety boundaries.** The static app uses fictional data, requires no environment variables, and serves no appointment-writing endpoint. The repository is MIT licensed. The release security review records the import, privacy and packaging checks and their limits. [Security review](../security/first-release.md) · [License](../../LICENSE)
- **Session history.** Session 5.1 merged in PR #24. The documentation-only 0.0 bootstrap merged with saved planning validation. Its PR has no independent review record, and the historical status remains unchanged. [PR #24](https://github.com/Kakumrkr/WhyNot/pull/24) · [Planning PR #1](https://github.com/Kakumrkr/WhyNot/pull/1)

## Local performance

`pnpm bench` passed the absolute S targets and the committed Windows regression gates. The baseline was kept. The machine used Windows x64, AMD Ryzen 7 7800X3D with 16 logical CPUs, 31 GiB RAM, Node 24.22.3 with `--max-semi-space-size=64`, and pnpm 12.21.0. S is Riverside. M has three times the resources and twice the bookings. L has ten times the resources and the original booking count. Slot checks rotate H1–H8 and range checks rotate H9–H11. [Benchmark harness](../../packages/engine/bench/run.mjs) · [Windows baseline](../../packages/engine/bench/baseline-win32.json)

Each cell is p50 / p95 in milliseconds. Slot checks used 1,000 warm-up and 300 timed calls. Searches used 40 warm-up and 120 timed calls, and ranges used 6 warm-up and 24 timed calls.

| Operation                                       |              S |              M |              L | S p95 target |
| ----------------------------------------------- | -------------: | -------------: | -------------: | -----------: |
| `isBookable`                                    |    0.78 / 1.03 |    1.23 / 1.68 |    1.07 / 1.86 |            2 |
| `evaluate` without alternatives or policy fixes |    1.72 / 2.98 |   4.28 / 10.17 | 24.34 / 155.96 |           20 |
| `evaluate` with alternatives                    | 65.54 / 128.19 | 41.44 / 275.61 | 71.47 / 731.28 |          400 |
| `evaluate` with alternatives and policy fixes   | 68.58 / 145.09 | 47.56 / 276.72 | 95.03 / 721.40 |          400 |
| One-day range                                   |  38.00 / 46.45 | 13.06 / 108.85 | 33.97 / 262.71 |          300 |
| Seven-day range                                 |  16.66 / 32.29 |  20.66 / 85.63 | 58.44 / 269.12 |        1,500 |

The S day-availability check measured opening the H1–H8 patient selections through `staticAdapter.open` under Node and Vite's SSR module loader. That call constructs the day grid, checks each listed start and formats the selection before any React rendering or deferred slot and range evaluations. After 60 warm-up calls, 300 samples measured **38.31 / 46.43 ms** against the **100 ms** p95 target.

M and L describe scaling with these cases. Dense imported clinics can have different timings. Vite reported its 500 kB chunk warning. The production build uses about 150 kB gzip for JavaScript and 2.3 kB gzip for CSS.

## External review to collect

Ask a scheduling practitioner to try the H1 patient explanation, H9 referral case and H11 mixed start windows. Collect correctness, clarity, completeness, kindness and actionability ratings with scenario and audience notes. Ask a developer outside the project to run the Harbor example from a clean clone, then describe which record mappings or output limits required clarification. Record actual dates and observations when available. [Walkthrough](../video-script.md) · [Node example](../../examples/node/README.md)
