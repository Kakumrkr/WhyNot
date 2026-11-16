# WhyNot

**Understand why a booking fails, find what works, and inspect what a policy change would do.**

An open-source TypeScript appointment engine and static playground for fictional Riverside Family Clinic. The engine computes sufficient, irredundant blockers, rechecked alternatives and staff policy previews. Templates explain them; no model decides.

> Status: revised plan approved; application implementation has not started. Start Session 0.1 after the Session 0.0 planning PR is merged.

## First release

Browser/Node engine, documented schemas, independent integration example, patient/staff views, empty-calendar explanations, alternatives, policy playground and inspector. Free static demo; no server, account, DB or model key.

Persistence, historical insights and optional AI are later milestones. Synthetic data only. Adoption and clinical usefulness are not yet validated. Constraint explanations exist elsewhere; WhyNot aims to make this combination accessible and useful.

## Start a development session

Open this repository in Codex and paste:

~~~text
$whynot-session
Start the next eligible WhyNot development session.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/README.md.
Select the first incomplete session whose dependencies are merged.
Read its entire card and required docs; confirm required skills.
Implement only its Build list and satisfy verification and acceptance criteria.
Make logical checkpoint commits, update the handoff, push all session commits,
verify remote HEAD and open/update the PR. Do not start another session.
Finish with evidence, commit, PR and the exact next-session prompt.
~~~

First implementation: [Session 0.1](docs/sessions/session-0.1.md). Archived phase cards are superseded.

## Documentation

| Document | Purpose |
| --- | --- |
| [Product](docs/00-product-brief.md) | Users, contribution, competition, scope |
| [Architecture](docs/01-architecture.md) | Pure engine, packages and adapters |
| [Domain](docs/02-domain-and-rules.md) | Rules and hero scenarios |
| [Algorithms](docs/03-engine-algorithms.md) | Explanations, search, patches, ranges, performance |
| [Wording](docs/04-explanation-and-ai.md) | Contracts, projection and templates |
| [Data](docs/05-api-and-data.md) | Static import/export and later persistence |
| [Testing](docs/06-testing-and-accuracy.md) | Gates, properties and goldens |
| [Roadmap](docs/07-roadmap.md) | Milestones and release |
| [Decisions](docs/08-decisions.md) | Accepted and superseded decisions |
| [Workflow](docs/09-codex-workflow.md) | Skills, agents, Git and handoff |
| [Sessions](docs/sessions/README.md) | Ordered cards and starter prompts |
| [Progress](docs/PROGRESS.md) | Implemented/reviewed/merged state |
| [Questions](docs/QUESTIONS.md) | Issues and resolutions |

Commands and MIT license are introduced in 0.1. No installable application or pnpm verification script exists yet.
