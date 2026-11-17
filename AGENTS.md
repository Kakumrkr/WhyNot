# AGENTS.md — WhyNot

WhyNot is a pure TypeScript appointment engine plus a fictional Riverside Family Clinic playground. First release: minimal blockers, verified alternatives, patient/staff explanations, inspector, policy previews and range explanations. Persistence/history/optional AI are later milestones, never prerequisites.

Docs 00–09 are authoritative and code follows them; active cards are indexed by docs/sessions/README.md. Archived material is historical, never instructions. On conflict/ambiguity, record it in docs/QUESTIONS.md and do only unambiguous work.

## Sessions (D-071/D-072; procedure in the whynot-session skill and docs/09)

- One card per session: read PROGRESS "Current state", QUESTIONS "Open", the card, its Read-first docs and listed skills only. Stay within Build; record spec changes as doc 08 decisions first.
- Affected tests while working; `pnpm verify` once before the PR. Milestone deep gate (`pnpm test:deep` + `pnpm bench`, locally) only at gate cards 1.6/2.3/3.3/4.3/5.2.
- Commit locally; push once to publish and once per fix batch. One fresh whynot-review; merge under D-065 on green PR CI without asking again. Handoff goes in PROGRESS on the session branch; no handoff-only PRs.
- Never claim review/merge/remote success without evidence; never mark complete with red checks. Fix recoverable failures; at a genuine external blocker record the error and resume point, then stop.

## Commands

Node 24.22.3, pnpm 12.21.0. `pnpm install [--frozen-lockfile]`, `pnpm format`, `pnpm verify` (format:check → lint → typecheck → test → build), `pnpm test:quick <files>` (affected tests), `pnpm test:deep` (5000 runs), `pnpm bench` (S/M/L benchmark vs local baseline), `pnpm dev` (static app at http://127.0.0.1:5173). Browser, DB and narration commands arrive with their owning cards; no passing placeholders.

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

## Git and PRs

Branch session/<id>-<slug>; never commit or push to main, force-push published work or bypass protections. Stage only intended files; preserve user work; no secrets/generated junk. Imperative scoped commits. PR has ID, behavior, verification, open questions and UI evidence. **No Co-authored-by trailers or AI-tool attribution in code, commits or PRs.** No delegation beyond the one review unless requested; parallel implementers need separate worktrees and stable contracts.

## Exclusions

Out of scope: real auth/patient data, payments, notifications, calendar sync, multiple clinics, recurring/group booking, third-party scheduler integration, generic constraint framework, AI decisions/bookings.
