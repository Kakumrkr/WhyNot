# 08 — Decision log

> Active revision: D-050–D-059 below governs the current plan. Earlier entries and original Open assignments are historical wherever superseded; use the Revised deferred decisions table.

Format: **ID · Decision** — _Why_ — _Rejected alternatives_ — _Revisit if_. New decisions are appended; superseded ones are marked, never deleted.

## Product

**D-001 · Build WhyNot (explainable booking engine) instead of the VouchDesk support-investigation agent.**
_Why:_ VouchDesk's category is crowded (Pluno, Pylon, Intercom Fin) and its plan needed months of third-party integration work; WhyNot has an original combination, a provable core, and a 60-second demo.
_Rejected:_ VouchDesk; generic RAG/chat apps; agent replay debugger (good, but less demo-friendly).
_Revisit if:_ never for v1.

**D-002 · Portfolio-quality product first, not a startup.** Commercial adoption is unlikely (platforms own the rules). _Revisit if_ real demand appears after launch.

**D-003 · Demo business: fictional Riverside Family Clinic.** Clinics have the richest interacting rules (skills, rooms, equipment, buffers, referrals). _Rejected:_ gym, coworking.

**D-004 · Single clinic, single timezone, single-appointment requests in v1.** Keeps the algorithm exact and fast. Extension notes in doc 03.

**D-006 · Position WhyNot on the three moments where hiding slots fails** (patient stuck on an empty day/practitioner, front-desk calls, invisible lost bookings) — not on the ordinary "pick another open slot" case. Adds range explanations ("Why is this empty?", Session 2.5) as a first-class feature. _Why:_ most apps hide unavailable slots; a single-slot explainer alone would solve a rare problem.

**D-005 · The demo creates bookings in its own DB; WhyNot integrates with no third-party scheduler in v1.**

## Engine

**D-010 · Pure TypeScript engine, no external solver.** Demo-sized candidate matrices (≤ ~100 candidates) are solved exactly with a hitting-set branch-and-bound. Enables in-browser static demo. _Rejected:_ OR-Tools/Python service (second language, deployment cost), MiniZinc, clingo. _Revisit if_ bench L dataset matters or multi-resource/series bookings are added.

**D-011 · Explanation = minimum-weight irredundant hitting set over the violation matrix.** Sufficient + minimal by construction; weights encode "simplest true thing". _Rejected:_ first-failing-rule (misleading), all violations (noisy), LLM-chosen reasons (unverifiable).

**D-012 · Buffers/turnover are separate rules from busy.** Lets explanations distinguish "booked" from "policy buffer" and powers admin fixes.

**D-013 · Instants are integer epoch minutes (UTC) inside the engine; luxon isolated in `time.ts`.** _Rejected:_ Date objects everywhere (TZ bugs), Temporal polyfill (heavier; revisit when Temporal is universal).

**D-014 · Alternatives ranked by an explicit, configurable cost model with category diversity.** "Nearest" is a preference; making it explicit makes it honest and tunable.

**D-015 · `now` is always injected; demo uses a demo clock.** Determinism and evergreen demo scenarios.

## AI

**D-020 · OpenAI API for optional narration (user choice: cost).** Behind a `Narrator` interface; model via `OPENAI_MODEL` env, chosen by the narration eval in Session 5.3. _Revisit if_ cost/quality changes — swapping providers touches one file.

**D-021 · Templates are the default and the ground truth; AI output must pass a deterministic verifier or is replaced by templates.** The model never decides anything.

**D-022 · Static demo ships pre-verified narrations; no API key ever in the browser.**

## Platform

**D-030 · TypeScript monorepo with pnpm workspaces** (`packages/contracts`, `engine`, `narrator`, `fixtures`; `apps/api`, `apps/web`). _Rejected:_ Nx/Turborepo (unneeded at this size), separate repos.

**D-031 · Fastify + Drizzle + PostgreSQL 16; React + Vite + TanStack Query + Tailwind; Recharts.**

**D-032 · API tests use PGlite (in-process Postgres), so no Docker is required in any sandbox.** Postgres-only features get `@pg`-tagged tests run in CI with a service container.

**D-033 · Demo role switcher instead of real authentication.** No real users or data exist. Clearly labelled. _Revisit if_ hosted with real users (never planned).

**D-034 · Double safety for booking races:** serializable transaction re-evaluation + Postgres exclusion constraints.

**D-035 · Hosting decided in Session 7.2.** Static demo on GitHub Pages is fixed; full-stack hosting optional.

## Process

**D-040 · Built with Codex. Rules live in `AGENTS.md`; project skills live in `.agents/skills/`.** Curated OpenAI skills + UI UX Pro Max are installed per `docs/09-codex-workflow.md`.

**D-041 · One session = one verified, pushed increment; `pnpm verify` is the single gate; golden expectations change only with a decision-log entry.**

**D-042 · License: MIT for original code** (confirm in Session 0.1). No GPL dependencies in `packages/engine`.

## Open (to decide in the named session)

| ID  | Question                                              | Session |
| --- | ----------------------------------------------------- | ------- |
| Q-1 | Exact pinned versions of Node, pnpm, and libraries    | 0.1     |
| Q-2 | PGlite support for `btree_gist` exclusion constraints | 3.1     |
| Q-3 | Visual design direction (style, palette, typography)  | 4.1     |
| Q-4 | OpenAI model for narration                            | 5.3     |
| Q-5 | Full-stack hosting provider (or none)                 | 7.2     |

## Approved revision — 2026-11-16 (Session 0.0)

The following decisions supersede conflicting earlier wording. Earlier entries remain historical; the active specification is docs 00–09 plus the new session index. Old phase cards are archived and must not be executed.

**D-050 · Engine and static playground first; all three audiences remain.**
Supersedes D-002's portfolio-only priority, D-005's DB requirement for v1, D-006's old session mapping, D-031's immediate full-stack scope and D-035's late demo deployment. Build reusable appointment packages, patient/staff workflows, inspector and policy preview first; first preview at 3.3, first release at 5.2. Persistence P1–P5, history H1–H4 and AI A1–A3 follow. VouchDesk is complementary forensic investigation, not simply an LLM support bot; D-001's old competitive characterization is superseded. Revisit scope only through a decision.

**D-051 · Truthful deterministic results and search metadata.**
Remove timingsMs from engine output. Keep injected now. Report disabled/complete/budget_exhausted/window_limited; complete is finite-domain exhaustion. Explicit local-time/day cost replaces ambiguous total-minute/day double counting and removes undefined any-practitioner-change baseline penalty. Stable equal-weight ties must survive branch pruning. Supersedes affected D-011/D-014 details. See doc 03.

**D-052 · Missing-resource cause and isolated scenarios.**
Add resource-missing as the 23rd internal rule; structural explanation handles empty required pools without invented candidates. Public synthetic rule IDs stay separate. H1 and H11 use separate overrides. H1's room turnover must not mask its intended practitioner-buffer cause. Preserve hero intent; no golden files exist yet. See docs 02/03 for input/time boundaries and structural properties.

**D-053 · Verify concrete policy patches.**
Removing fact IDs is insufficient. Compute/coalesce typed setting patches, apply to copied snapshot, re-evaluate every rule, and choose least-cost verified supported proposal. Expose baseline/modified previews; do not automatically persist. Buffer/eligibility changes are hypothetical operations requiring judgment. See doc 03.

**D-054 · Distinct patient contract.**
Allowlist output and rebuild all fact references with canonical evaluation-local opaque ordinal IDs. Replace sensitive causes with truthful public abstractions instead of silently dropping necessary facts. No non-crypto hash secrecy claim. Projection is not confidentiality for publicly bundled synthetic fixtures. See doc 04.

**D-055 · Regular checkpoint commits and mandatory session push.**
Strengthens D-041. Commit logical verified increments during sessions, push checkpoints during longer sessions and all commits before ending, verify remote HEAD, open/update PR. Record implemented/reviewed/merged separately; dependencies must be merged. A blocked/incomplete session gets a coherent checkpoint/draft and honest failing-check record, not a completion tick. Documentation bootstrap uses consistency checks until 0.1 creates pnpm verify. No placeholder passing scripts.

**D-056 · Templates first release; optional AI experiment later.**
Supersedes D-020's old session mapping, D-021's implied semantic verification guarantee and D-022's static AI narrations. Heuristic citation/token checks cannot prove meaning. A1 must decide constrained wording versus free prose before a provider client. No AI badge/provider/key in first release.

**D-057 · Adoption example and bounded synthetic imports.**
Publish clean ESM package entry points, excluding tests/generators/reference checker. Node example supplies its own data. Playground imports versioned synthetic JSON, bounded per doc 05, in memory only; no uploads/logging/persistent storage or imported-data links. No general rule-plugin framework.

**D-058 · Immutable replay inputs and descriptive insights.**
Store full snapshot/request/now/options/version bundles. Current rules and booking timestamps cannot reconstruct historical settings. Reject unsupported engine replay versions. Distinguish selected explanation attribution from all blockers, real lost bookings and revenue. Independent replay is an estimate. See doc 05.

**D-059 · Small skill set and focused independent review.**
Update seven project skills; add whynot-planning. Main implementer plus fresh-task reviewer by default; optional correctness/UX reviewers at gates. No standing parallel implementation swarm. Custom Codex agents are optional role definitions, with inherited permissions, not separate security boundaries. Native Git/GitHub is a fallback for optional convenience skills. External capabilities are checked just before use. See doc 09.

## Revised deferred decisions

This table replaces the earlier Open table's obsolete session assignments; those rows above are historical.

| ID  | Decision to resolve                                                               | Owner                              |
| --- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Q-1 | Resolved by D-043: pinned supported Node/pnpm and compatible stable libraries     | 0.1                                |
| Q-2 | PGlite btree_gist/concurrency support; record evidence and real-Postgres fallback | P1                                 |
| Q-3 | Accessible calm clinic design tokens and typography                               | 3.1                                |
| Q-4 | Whether AI adds value, output constraints, provider/model if justified            | A1/A2                              |
| Q-5 | Full-stack hosting optional; static Pages is fixed                                | P5, only if human requests hosting |

These future-session decisions do not block 0.1. No unresolved first-release architecture choice should be delegated silently to implementation.

## Session 0.1 foundation

**D-043 · Pin the supported foundation toolchain; resolve Q-1.**
Checked npm stable versions and engine/peer requirements on 2026-11-16. Select Node **24.22.3 LTS**, pnpm **12.21.0**, TypeScript **6.0.3**, Zod **4.6.7**, Luxon **3.7.2**, React/React DOM **19.3.1**, Vite **8.3.8**, Vitest **5.1.0**, ESLint **10.15.0**, @eslint/js **10.0.1**, typescript-eslint **8.73.0**, @vitejs/plugin-react **6.3.0**, Prettier **3.10.1** and fast-check **4.10.2**. Type packages: Node **24.19.2**, React/React DOM **19.3.0**, Luxon **3.7.6**. Exact package versions and lockfile are committed.

_Why:_ Node 24 is supported LTS ([release schedule](https://nodejs.org/en/about/previous-releases)); the installed Node 20 is unsuitable. TypeScript 7 is stable but exceeds typescript-eslint's declared <6.1 peer range; 6.0.3 satisfies it. The selected Vite/Vitest/React/plugin peers agree. Local isolated tools under ignored .tools avoid changing the machine's Node installation. CI reads the same Node and pnpm pins and uses a frozen install. pnpm's generated, version-specific minimumReleaseAgeExclude entries retain its default supply-chain policy for the selected current parser; no blanket policy disable.

_Boundaries:_ package roots are ESM, private until packaging is owned by 5.1. Source import allowlists enforce contracts <- engine, contracts <- narrator, fixtures -> contracts/engine. Only apps/web/src/adapter/staticAdapter.ts may import the fixture runtime from production web source; test-only fixture paths never enter production. Luxon is confined to engine/src/time.ts. Browser source cannot import Node, server or provider packages, or read environment settings. ESLint programmatic samples check rejected and permitted edges. This is a development guardrail, not a security sandbox or semantic proof of purity.

_Scope:_ no domain exports, routes, DB, provider settings, benchmark/e2e placeholders, design system or executable Node adoption example. Update README's status/commands as part of foundation handoff. Prettier covers current files and maintained progress/questions/decisions; pre-existing planning skills/specs and historical archive keep their original formatting to avoid unrelated churn. Tests/configuration live at root where they enforce workspace architecture. Foundation evidence and the inspected screenshot live under docs/validation. The test stage compiles library prerequisites before native Node imports through package exports; the final build stage also builds the web page.

_License:_ MIT original code, copyright Rama Kakumani, verified from repository owner Kakumrkr's GitHub profile API; confirms D-042.

_Rejected:_ unsupported installed Node 20; incompatible latest TypeScript 7; premature future-stack dependencies; version-marker APIs created solely to smoke-test skeleton packages. _Revisit if:_ support windows or upstream peers change, or the packaging session establishes public release metadata.

## Session 1.1 contracts

**D-060 · Supply web-standard declarations required by Zod.**
The first real contracts import exposes Zod 4.6.7's declaration dependency on the global `URL` type. Add `DOM` alongside `ES2022` to the contracts package's type libraries; retain `types: []`, strict checking and `skipLibCheck: false`. This supplies declarations only, adds no runtime dependency and preserves architectural/browser lint checks. Do not add Node globals or suppress dependency type errors. Other packages retain their existing settings until they consume schemas in their owning sessions.

**D-061 · Represent midnight schedule ends and validate alternative changes.**
Session 1.1 review found that split overnight schedules could not represent the midnight boundary. Weekly hours and grounded break intervals permit `24:00` only as an end, meaning the next local date's midnight; starts remain `00:00`–`23:59`. Full-day intervals use `00:00`–`24:00`; overnight schedules remain split across weekdays. Session 1.2 must resolve that boundary using local calendar arithmetic and its explicit DST validation, not by adding 1440 elapsed minutes.

Alternative changes must change a value, occur at most once per field and agree with the changed request. Patient changes must agree with the returned assignment's start and any explicitly selected practitioner. A null practitioner destination means any practitioner, so the patient schema permits any assigned practitioner for that destination. These are contract consistency checks, not engine feasibility checks; original-request comparisons and re-evaluation remain owned by the alternatives engine. Schema version stays 1 before publication. No golden expectations change.

## Session 1.2 time and fixtures

**D-062 · Carry Zod's declaration requirements into its first consumers.**
The first engine/fixture imports of contracts expose the same `URL` declaration requirement recorded in D-060. Supply `DOM` alongside `ES2022` in these two packages; retain `types: []`, strict checking, `skipLibCheck: false` and all purity/import lint guards. This is a type-library change only, with no runtime dependency or browser access added. No unrelated package settings change.

Time helpers use explicitly anchored Luxon instances rather than `fromISO`/`fromObject`, which consult Luxon's current clock internally. Recurring fold/gap boundaries report the existing `unsupported_wall_time` issue; explicit instants retain their chosen offset. Grid starts are aligned by local wall minutes since midnight, retaining both fold occurrences and omitting nonexistent minutes. Test generators live in fixtures/test/generate.ts rather than src/generate.ts so no generator or fast-check dependency enters built fixture exports; authored minimal builders remain separate. No rules, Riverside scenarios or golden corrections are introduced.

**D-063 · Build package declarations before workspace typechecks.**
The first real cross-package contracts imports exposed a clean-checkout CI failure: package exports resolve types from dist, while root test typechecking previously ran before any package build. Existing local artifacts concealed the missing prerequisite. The root typecheck command now builds library packages in dependency order before checking root tests and package sources. Keep native ESM/declaration exports and strict checking; do not replace production resolution with source aliases or skip dependency checks. Validate pnpm verify after removing only ignored workspace dist outputs, and retain frozen-install CI as the clean-checkout gate. No dependency graph or runtime behavior changes.

## Workflow maintenance — 2026-11-16

**D-064 · Persist through verification, independent review, merge and handoff.**
Supersedes the stop-at-PR/human-only-merge wording in D-055/D-059 and doc 09 where
it conflicts. The user requested unattended hosted sessions with automatic pickup,
failure recovery and completion through merge. Each worker owns one selected card
through its lifecycle; recoverable failures and review findings remain work on that
card. Two failed attempts trigger diagnosis and an evidence note, not an automatic
end of the session. Runtime limits trigger durable continuation of the same phase.

Independent review remains required in fresh context, with corrections and repeat
verification as necessary. Completion requires confirmed GitHub merge, post-merge
checks and a durable handoff. Automatic merge is permitted only when the user has
explicitly selected it and all current-head review/check/protection gates pass;
otherwise the coordinator waits for human merge without starting another card.
No protection bypass or self-claimed review. First-release authorization stops at
5.2; no automatic P/H/A work. Session 1.3 is excluded from this maintenance task.

Hosted execution, schedule/timezone, credentials, model access and cost limits must
be verified before activation. No new paid service or API billing is selected by
this decision. The [automation plan](workflow-automation.md) defines lifecycle,
recovery, activation gates and durable state requirements. It is a plan until a
hosted executor passes those gates; repository text is not a running scheduler.

_Why:_ prior handoffs required repeated user intervention and left merge evidence
stale. _Rejected:_ pretending complexity or a fixed retry count means completion;
endless identical paid retries; weakening checks; starting later cards before merge.
_Revisit if:_ the user changes merge authority, milestone scope or execution route.
