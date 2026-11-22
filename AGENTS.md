# AGENTS.md — WhyNot

WhyNot is a pure TypeScript appointment engine with a fictional Riverside Family Clinic playground. The static app runs in the browser. The full local app adds persistent demo bookings, history and independent policy replay.

Follow the architecture, domain, engine, wording, API and testing specifications in [docs](docs). Record ambiguities in a GitHub issue and proceed with unambiguous work. Document rule or contract changes with the corresponding code and tests.

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

- New behavior gets meaningful tests. Engine changes need unit or property checks.
- Golden expectations never change just to pass. Document the rule or contract that justifies the correction in the PR.
- Never skip/focus/todo tests, lower property counts, disable lint, use any or suppression comments to pass. Type-test-only ts-expect-error is the sole stated exception.
- Print property failure seed and add shrunk counterexample as normal regression. Independent checker must not reuse optimized rules.
- No engine mocks in API/web tests; use real synthetic fixtures. Mock provider responses only in later AI work.
- TypeScript strict ESM, named exports; camelCase.ts, PascalCase.tsx, rule family per engine file.
- Pure functions over engine classes; small functions, ~300 lines per file unless reason documented. Public functions get TSDoc.
- Business outcomes return invalid_request/blocked; invariant bugs throw.
- Prettier defaults, printWidth 100; use formatter once available. Comments explain why.

## Git and PRs

Use a topic branch and open a pull request. Never commit or push directly to main, force-push published work or bypass protections. Stage only intended files. Preserve user work and keep secrets and generated files out of Git. Describe the change and verification in the PR. Include screenshots or reproduction steps for UI changes. **No Co-authored-by trailers or AI-tool attribution in code, commits or PRs.**

## Exclusions

Out of scope: real auth/patient data, payments, notifications, calendar sync, multiple clinics, recurring/group booking, third-party scheduler integration, generic constraint framework, AI decisions/bookings.
