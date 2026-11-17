# WhyNot

**Understand why a booking fails, find what works, and inspect what a policy change would do.**

An open-source TypeScript appointment engine and static playground for fictional Riverside Family Clinic. The engine computes sufficient, irredundant blockers, rechecked alternatives and staff policy previews. Templates explain them; no model decides.

> Status: Sessions through 1.5 are reviewed and merged. Session 1.6 implements minimal explanations and public evaluation; final benchmark evidence, review and merge status are tracked in [progress](docs/PROGRESS.md). Patient projection, templates and the playground arrive in later cards.

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

Use Node 24.22.3 and pnpm 12.21.0. Run pnpm install, pnpm verify, then pnpm dev for the minimal static page. pnpm verify checks formatting, lint, types, tests and builds in order. See [AGENTS.md](AGENTS.md) for the complete command table and [D-043](docs/08-decisions.md) for version selection. Original code is [MIT licensed](LICENSE).
