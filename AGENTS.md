# AGENTS.md — WhyNot

Standing instructions for every coding agent in this repository.

## Product and source of truth

WhyNot is a pure TypeScript appointment engine plus a fictional Riverside Family Clinic playground. First release: minimal blockers, verified alternatives, patient/staff explanations, inspector, policy previews and range explanations. Persistence/history/optional AI are later milestones, never prerequisites.

Docs 00–09 are authoritative; active cards are indexed by docs/sessions/README.md. Archived phase cards are historical and must not be executed. IDs were reassigned during 0.0. Code follows docs. On conflict/ambiguity, record it in docs/QUESTIONS.md and do only unambiguous work.

## Every session

1. Use whynot-session; documentation-only planning also uses whynot-planning. Read PROGRESS, QUESTIONS, selected card and its required documents fully.
2. Confirm prerequisites are **merged**, not merely implemented. Resume incomplete work instead of silently skipping it. Own the selected card through verification, fresh review, confirmed merge and handoff; stop before the next card. Follow D-064 and docs/workflow-automation.md for continuation.
3. Check required skills when needed. Missing design/browser/security capabilities block their owning work, not unrelated earlier cards. Optional convenience skills have native-tool fallbacks.
4. Stay within Build; do not implement later sessions. Record architectural/spec changes as decisions first.
5. Run required checks. Session 0.0 uses documentation checks before tooling exists. From 0.1, pnpm verify must be green for completion; browser/real-PG gates apply as introduced.
6. Commit logical verified increments during work. Push checkpoints during longer sessions and **all commits before ending**. Verify remote HEAD equals local HEAD; open/update PR.
7. Record implemented/reviewed/merged separately, plus branch, final commit, PR, evidence, remaining work and exact next prompt. Never self-claim independent review or merge.
8. Diagnose and fix recoverable failures; do not end a card because it is complex or two attempts failed. Continue through review fixes and CI. At an external blocker or runtime limit, push a coherent checkpoint/draft and persist the exact phase for automatic resumption of the same card. Never mark complete with red checks.

## Commands

Use Node 24.22.3 and pnpm 12.21.0 (see .node-version and packageManager).

| Command                        | Current behavior                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| pnpm install                   | Install the workspace and update the lockfile                                                      |
| pnpm install --frozen-lockfile | Install exactly the committed dependency graph; used in CI                                         |
| pnpm format                    | Format current source/configuration and maintained handoff documents                               |
| pnpm format:check              | Check that formatting without writing                                                              |
| pnpm lint                      | Enforce TypeScript, source boundaries, engine purity and complete tests                            |
| pnpm typecheck                 | Build library declarations, then check strict TypeScript across source, tests and configuration    |
| pnpm test                      | Compile package prerequisites, then run native ESM entry smoke imports and ESLint boundary samples |
| pnpm build                     | Compile package ESM/declarations and build the static React page                                   |
| pnpm verify                    | Run format:check -> lint -> typecheck -> test -> build, failing fast                               |
| pnpm dev                       | Start the static Vite app at http://127.0.0.1:5173; no Docker                                      |

Benchmarks, browser suites, DB and narration commands arrive with their owning sessions. No passing placeholders.

## Architecture invariants

1. Engine alone computes feasibility, facts, explanations/groups, alternatives/order and policy fixes. UI/API/templates render.
2. Engine pure: imports only contracts, local engine modules and Luxon (Luxon only in src/time.ts). No I/O, Date, real clock, randomness, process, Node built-ins, logging/timers/network.
3. Deterministic canonical codepoint-ID ordering. Inject now; no runtime timings in results. Deep-frozen inputs remain unchanged.
4. Integer UTC epoch minutes internally; timezone conversion only in time.ts; explicit-offset ISO externally. Follow doc 03 DST/grid semantics.
5. Contracts first: shared Zod schemas, inferred types, no duplicate contract definitions.
6. Patient outputs pass projectForAudience before rendering/serialization. No raw booking IDs, staff reasons or other patients. Use separate patient schema and remap all references.
7. Every catalog rule/public replacement has appropriate templates. AI is later and optional; heuristic checks cannot prove semantic truth.
8. No secrets/server/provider clients in browser. Future OPENAI_API_KEY enters only API server configuration.
9. Dependency direction contracts <- engine; templates depend on contracts. Fixtures test/dev-only except static adapter and later seed; generators/reference checker never production exports.
10. No new infrastructure, external solver, queues, caches, agent frameworks or state libraries beyond TanStack Query without approved decision.
11. Re-evaluate alternatives and actual policy patches. Report incomplete search honestly. Internal invariant failures throw; never return known-invalid output.
12. Static imports are bounded synthetic data, memory-only; no upload/logging/persistence or imported-content share links.

## Testing and conventions

- New behavior gets meaningful tests. Engine changes need unit/property checks; use whynot-testing.
- Golden expectations never change just to pass. A correction needs doc 08 decision and explicit PR explanation.
- Never skip/focus/todo tests, lower property counts, disable lint, use any or suppression comments to pass. Type-test-only ts-expect-error is the sole stated exception.
- Print property failure seed and add shrunk counterexample as normal regression. Independent checker must not reuse optimized rules.
- No engine mocks in API/web tests; use real synthetic fixtures. Mock provider responses only in later AI work.
- TypeScript strict ESM, named exports; camelCase.ts, PascalCase.tsx, rule family per engine file.
- Pure functions over engine classes; small functions, ~300 lines per file unless reason documented. Public functions get TSDoc.
- Business outcomes return invalid_request/blocked; invariant bugs throw.
- Prettier defaults, printWidth 100; use formatter once available. Comments explain why.

## Git, PR and review

Branch session/<id>-<slug>, never commit to main. Commit imperative/scoped logical checkpoints; one commit is enough for a small coherent task, never an arbitrary timer. Check relevant behavior before checkpoints; full gate before completion. Stage only intended changes; preserve user work; no secrets/generated junk.

Push checkpoints during long work and all remaining commits before every handoff, even if incomplete. No force-push or rewriting published work without explicit need/authorization. If blocked by auth/network, report exact error and unpushed commits; do not claim remote success.

PR includes ID, behavior, verification summary, unresolved questions and UI evidence. Use native Git/GitHub if optional yeet/CI/comment skills absent. **No Co-authored-by trailers or AI-tool attribution in code, commits or PRs.**

One implementer then a fresh review task by default. Use whynot-review; optional focused correctness/UX roles at gates. Role definitions in .codex/agents are instructions, not distinct permission sandboxes. Do not delegate unless requested or an applicable card explicitly requires it. Parallel implementers need separate ownership/worktrees and stable contracts. Automatic merge requires explicit recorded user authorization and D-064's current-head review/check/protection gates; otherwise wait for human merge. Confirm actual merge and post-merge checks before releasing the next card.

## Skills and exclusions

Project skills: whynot-session, whynot-planning, whynot-engine, whynot-testing, whynot-ui, whynot-narration, whynot-api, whynot-review. Install/availability guidance: docs/09-codex-workflow.md. Read only relevant skills.

Out of scope: real auth/patient data, payments, notifications, calendar sync, multiple clinics, recurring/group booking, third-party scheduler integration, generic constraint framework, AI decisions/bookings. No application code in 0.0.
