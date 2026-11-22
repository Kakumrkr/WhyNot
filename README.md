# WhyNot

**Understand why a booking fails, find what works, and inspect what a policy change would do.**

An open-source TypeScript appointment engine and static playground for fictional Riverside Family Clinic. The engine computes sufficient, irredundant blockers, rechecked alternatives and staff policy previews. Templates explain them; no model decides.

## Playground preview

The Riverside playground checks appointments against a fictional clinic with a frozen clock. Select a scenario to see patient explanations and verified alternatives, then switch to Staff to inspect candidate combinations and their blockers.

[Open the Riverside playground](https://kakumrkr.github.io/WhyNot/)

![Riverside walkthrough showing the H1 blockers, reviewing an alternative, and checking the 14:45 appointment](docs/reviews/media/check-alternative.gif)

[Desktop staff inspector](docs/reviews/media/staff-inspector-desktop.png) · [Mobile patient explanation](docs/reviews/media/patient-mobile.png) · [Two-minute walkthrough script](docs/video-script.md)

To run the static playground locally, install dependencies with `pnpm install --frozen-lockfile`, then run `pnpm build` and `pnpm dev`. The [runbook](docs/runbook.md) covers clean installs, production builds, checks and GitHub Pages deployment.

Curated links retain the scenario, audience, date, service and practitioner preference. For example, append `?scenarioId=H1&audience=staff` to the playground address to open the minor-procedure inspector.

Open **Synthetic snapshot files** in the playground to import a fictional clinic or download the current snapshot and frozen clock. Use **Reset imported snapshot** to restore the curated view.

## Run the full local application

The optional full mode uses PostgreSQL and the same engine and explanations as the static playground. Confirm and cancel fictional appointments from the booking panel. Each curated scenario has isolated bookings and its authored frozen clock. Follow the [full local setup](docs/runbook.md#run-the-full-local-application) to seed the database and start the API and web app.

In Staff view, open **History insights** to filter recorded outcomes or replay the selected appointment’s verified policy fix against historical slots. Base Riverside includes two weeks of seeded synthetic history. The replay estimates feasibility for each slot at its recorded clock and occupancy.

## Use the engine in Node

Build and validate the local packages with the [independent Node example](examples/node/README.md). The [integration guide](docs/integration.md) covers ESM imports, mapping clinic records, using patient projection, and the model and search limits.

## First release

Browser/Node engine, documented schemas, independent integration example, patient/staff views, empty-calendar explanations, alternatives, policy playground and inspector. Free static demo; no server, account, DB or model key.

The model covers one appointment at one clinic and uses the supplied settings and snapshot. Search is bounded, and staff policy previews are hypothetical. Optional AI is a later milestone. Use fictional data. Clinical usefulness and developer adoption are pending external review.

[Release notes](docs/reviews/release-notes-v1.0.0.md) · [Release evidence](docs/reviews/session-5.2-release.md) · [Security review](docs/security/first-release.md) · [Algorithm write-up](docs/writeup.md)

## Start a development session

Open this repository in Codex and paste:

```text
$whynot-session
Select the next card from docs/PROGRESS.md "Current state" and run it.
```

Select current work from [progress](docs/PROGRESS.md) and [active cards](docs/sessions/README.md). Archived phase cards are superseded.

## Documentation

| Document                                   | Purpose                                            |
| ------------------------------------------ | -------------------------------------------------- |
| [Product](docs/00-product-brief.md)        | Users, contribution, competition, scope            |
| [Architecture](docs/01-architecture.md)    | Pure engine, packages and adapters                 |
| [Domain](docs/02-domain-and-rules.md)      | Rules and hero scenarios                           |
| [Algorithms](docs/03-engine-algorithms.md) | Explanations, search, patches, ranges, performance |
| [Wording](docs/04-explanation-and-ai.md)   | Contracts, projection and templates                |
| [Data](docs/05-api-and-data.md)            | Static import/export and local persistence         |
| [Testing](docs/06-testing-and-accuracy.md) | Gates, properties and goldens                      |
| [Roadmap](docs/07-roadmap.md)              | Milestones and release                             |
| [Decisions](docs/08-decisions.md)          | Accepted and superseded decisions                  |
| [Workflow](docs/09-codex-workflow.md)      | Skills, agents, Git and handoff                    |
| [Sessions](docs/sessions/README.md)        | Ordered cards and starter prompts                  |
| [Progress](docs/PROGRESS.md)               | Implemented/reviewed/merged state                  |
| [Questions](docs/QUESTIONS.md)             | Issues and resolutions                             |

Use Node 24.22.3 and pnpm 12.21.0. `pnpm verify` checks formatting, lint, types, tests and builds in order. See the [command table](AGENTS.md) and [version decision](docs/08-decisions.md). Original code is [MIT licensed](LICENSE).
