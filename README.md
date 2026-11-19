# WhyNot

**Understand why a booking fails, find what works, and inspect what a policy change would do.**

An open-source TypeScript appointment engine and static playground for fictional Riverside Family Clinic. The engine computes sufficient, irredundant blockers, rechecked alternatives and staff policy previews. Templates explain them; no model decides.

## Playground preview

The Riverside playground checks appointments against a fictional clinic with a frozen clock. Select a scenario to see patient explanations and verified alternatives, then switch to Staff to inspect candidate combinations and their blockers.

Open the latest **github-pages** deployment for the hosted preview. [Deployment history](https://github.com/Kakumrkr/WhyNot/deployments)

To run the preview locally, install dependencies with `pnpm install`, then run `pnpm dev` and open the address it prints. For a production build, run `pnpm build` followed by `pnpm --filter @whynot/web exec vite preview`.

Curated links retain the scenario, audience, date, service and practitioner preference. For example, append `?scenarioId=H1&audience=staff` to the playground address to open the minor-procedure inspector.

## First release

Browser/Node engine, documented schemas, independent integration example, patient/staff views, empty-calendar explanations, alternatives, policy playground and inspector. Free static demo; no server, account, DB or model key.

Persistence, historical insights and optional AI are later milestones. Synthetic data only. Adoption and clinical usefulness are not yet validated. Constraint explanations exist elsewhere; WhyNot aims to make this combination accessible and useful.

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
| [Data](docs/05-api-and-data.md)            | Static import/export and later persistence         |
| [Testing](docs/06-testing-and-accuracy.md) | Gates, properties and goldens                      |
| [Roadmap](docs/07-roadmap.md)              | Milestones and release                             |
| [Decisions](docs/08-decisions.md)          | Accepted and superseded decisions                  |
| [Workflow](docs/09-codex-workflow.md)      | Skills, agents, Git and handoff                    |
| [Sessions](docs/sessions/README.md)        | Ordered cards and starter prompts                  |
| [Progress](docs/PROGRESS.md)               | Implemented/reviewed/merged state                  |
| [Questions](docs/QUESTIONS.md)             | Issues and resolutions                             |

Use Node 24.22.3 and pnpm 12.21.0. `pnpm verify` checks formatting, lint, types, tests and builds in order. See the [command table](AGENTS.md) and [version decision](docs/08-decisions.md). Original code is [MIT licensed](LICENSE).
