# AGENTS.md — WhyNot

Standing instructions for every coding agent in this repository.

## Product and source of truth

WhyNot is a pure TypeScript appointment engine plus a fictional Riverside Family Clinic playground. First release: minimal blockers, verified alternatives, patient/staff explanations, inspector, policy previews and range explanations. Persistence/history/optional AI are later milestones, never prerequisites.

Docs 00–09 are authoritative; active cards are indexed by docs/sessions/README.md. Archived phase cards are historical and must not be executed. IDs were reassigned during 0.0. Code follows docs. On conflict/ambiguity, record it in docs/QUESTIONS.md and do only unambiguous work.

## Every session

Lean workflow (D-071); details in docs/09-codex-workflow.md.

1. Use whynot-session. Read only PROGRESS "Current state" + status table, QUESTIONS "Open", the selected card, its Read-first docs and listed skills. Do not read archives or the full decision log by default.
2. Confirm the prerequisite PR is merged with one lookup. Resume an incomplete card's branch instead of restarting. Own the card through gate, one review, merge and handoff; stop before the next card. D-065 standing merge authority applies.
3. Stay within Build; do not implement later sessions. Record architectural/spec changes as decisions first. External skills are optional and never block a card.
4. Run affected tests while working; run pnpm verify once before the PR and again only after source changes. Deep verification (5000 runs + benchmark) only at milestone gates 1.6/2.3/3.3/4.4/5.2.
5. Commit locally at coherent points; push once when publishing and once per batch of fixes (each push runs CI). Write the PROGRESS handoff on the session branch; never open a handoff-only PR.
6. Record implemented/reviewed/merged separately and never claim review or merge in advance.
7. Fix recoverable failures as part of the card. At a genuine external blocker (e.g. GitHub 403), record the exact error, unpushed commits and resume phase once, then stop. Never mark complete with red checks.

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
| pnpm bench                     | Build packages and run the external S/M/L benchmark; enforces S targets against the local baseline |

PR CI runs pnpm verify at 500 property runs. The manual Deep verification workflow runs FC_NUM_RUNS=5000 plus the benchmark report. Browser suites, DB and narration commands arrive with their owning sessions. No passing placeholders.

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

Branch session/<id>-<slug>, never commit to main. Commit imperative/scoped logical checkpoints; one commit is enough for a small coherent task. Stage only intended changes; preserve user work; no secrets/generated junk.

Push all commits before every handoff, even if incomplete, but batch pushes: one when publishing, one per fix batch. No force-push or rewriting published work without explicit need/authorization. If blocked by auth/network, report the exact error and unpushed commits; do not claim remote success (see docs/09 §GitHub troubleshooting).

PR includes ID, behavior, verification summary, unresolved questions and UI evidence. **No Co-authored-by trailers or AI-tool attribution in code, commits or PRs.**

One implementer, then one fresh-context whynot-review per session PR (correctness/UX checklists at the cards that name them). Re-review only deltas that change source behavior. Do not delegate beyond that unless requested. Parallel implementers need separate ownership/worktrees and stable contracts. Under D-065 merge each selected session and necessary corrective PRs after the review and green PR CI, without asking again. Never push directly to main or bypass protections. No post-merge main CI wait; a later-discovered failure is fixed by a reviewed corrective PR.

## Skills and exclusions

Project skills: whynot-session, whynot-engine (incl. templates), whynot-testing, whynot-ui, whynot-review; whynot-api for follow-on P/H/A cards only. Read only the skills a card lists.

Out of scope: real auth/patient data, payments, notifications, calendar sync, multiple clinics, recurring/group booking, third-party scheduler integration, generic constraint framework, AI decisions/bookings. No application code in 0.0.
