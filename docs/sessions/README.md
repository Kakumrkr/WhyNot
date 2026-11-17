# Session cards

This is the only active session index. Superseded phase cards are retained under docs/archive/2026-11-06-sessions as historical material, not executable instructions. IDs were reassigned by D-050; use titles and this index, never old phase numbers.

## Ordered work

| ID | Session | Depends on (merged) |
| --- | --- | --- |
| [0.0](session-0.0.md) | Planning handoff | — |
| [0.1](session-0.1.md) | Foundation and architectural boundaries | 0.0 |
| [1.1](session-1.1.md) | Appointment and output contracts | 0.1 |
| [1.2](session-1.2.md) | Time handling and minimal fixtures | 1.1 |
| [1.3](session-1.3.md) | Clinic, patient, timing and preference rules | 1.2 |
| [1.4](session-1.4.md) | Practitioner, room and equipment rules | 1.3 |
| [1.5](session-1.5.md) | Candidates, matrix and independent reference | 1.4 |
| [1.6](session-1.6.md) | Minimal explanations and core gate | 1.5 |
| [2.1](session-2.1.md) | Patient and staff output projection | 1.6 |
| [2.2](session-2.2.md) | Templates, grouping and helpfulness | 2.1 |
| [2.3](session-2.3.md) | Verified alternatives and truthful search | 2.2 |
| [3.1](session-3.1.md) | Static playground design and shell | 2.3 |
| [3.2](session-3.2.md) | Patient and staff explanation journey | 3.1 |
| [3.3](session-3.3.md) | Inspector and first public preview | 3.2 |
| [4.1](session-4.1.md) | Verified policy patch engine | 3.3 |
| [4.2](session-4.2.md) | Staff policy playground | 4.1 |
| [4.3](session-4.3.md) | Range explanations and next-available search | 4.2 |
| [4.4](session-4.4.md) | Empty-calendar patient journey | 4.3 |
| [5.1](session-5.1.md) | Developer adoption and package validation | 4.4 |
| [5.2](session-5.2.md) | First release, evidence and handoff | 5.1 |
| [P1](session-P1.md) | Persistence schema and database verification | 5.2 |
| [P2](session-P2.md) | Seed, frozen clock and snapshot loader | P1 |
| [P3](session-P3.md) | Projected read API and immutable input capture | P2 |
| [P4](session-P4.md) | Transactional booking, policy versions and reset | P3 |
| [P5](session-P5.md) | HTTP adapter and full local application | P4 |
| [H1](session-H1.md) | Historical replay inputs and trace access | P5 |
| [H2](session-H2.md) | Descriptive insight aggregates | H1 |
| [H3](session-H3.md) | Independent historical policy replay | H2 |
| [H4](session-H4.md) | Insights dashboard and historical simulator UI | H3 |
| [A1](session-A1.md) | Optional AI wording experiment design | 5.2 |
| [A2](session-A2.md) | Provider prototype and adversarial evaluation | A1, P5 |
| [A3](session-A3.md) | Optional narration integration and fallback | A2 |

First release has 20 cards including documentation bootstrap 0.0 (19 implementation sessions). Follow-ons have 12 cards. This is 32 revised cards, not the original 32-card roadmap.

After 5.2, stop for human selection of a follow-on milestone; do not automatically start P1 or AI. A1 may be considered after 5.2; A2 also needs P5. A2/A3 can be explicitly declined without a false completion mark.

## Card contract

Each card has goal, branch, milestone, merged dependencies, readings, skills, files/interfaces, Build, Tests/verification, Done when, Out of scope, handoff and starter prompt. Common Git/verification rules in [workflow](../09-codex-workflow.md) apply to every card.

Implement only the selected card; contracts/functions are introduced by owning sessions. Future test commands are added with actual suites, not passing placeholders. Missing required skills block their relevant implementation, not unrelated earlier cards.

## Starting and resuming

Read [progress](../PROGRESS.md), [questions](../QUESTIONS.md), AGENTS.md and the whole selected card. Choose the first incomplete eligible first-release card; if it is already partially implemented resume its branch/checkpoint. Dependencies must be merged, not just checked implemented. A blocked session records remaining work and uses a draft PR. D-064 and the [session workflow](../09-codex-workflow.md) require ownership through recoverable failures, independent review, confirmed merge and a durable handoff. If interrupted, resume that same phase without skipping the card.

Historical initial selection: Session 0.1 followed planning PR 0.0. Determine the current eligible card from live merge evidence and PROGRESS. Its prompt is embedded in its card; no prior chat context is required.
