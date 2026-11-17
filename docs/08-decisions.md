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
Clarifies D-055/D-059: opening a PR is a checkpoint, not completion of session
ownership. Each implementer owns one selected card through green checks, fresh
independent review, corrections, confirmed merge, post-merge checks and a durable
handoff. Recoverable failures and complexity remain work on that card. Two failed
attempts trigger diagnosis and an evidence note, not an automatic end of session.
Do not ask the user to start the same card again merely because tests, CI or review
require fixes. New commits require fresh review of the exact head and base.

Human merge remains the default. Do not merge without explicit user authorization,
bypass protections or self-claim independent review. While waiting, retain the
branch/PR and monitor merge status when the session can remain active. Only actual
GitHub merge evidence and successful required post-merge checks release the next
card; stop after the selected card and after 5.2 until a follow-on is selected.

External blockers or hard runtime limits require a coherent pushed checkpoint,
truthful incomplete status and the exact branch, PR, phase, evidence, remaining
work and continuation prompt. This preserves context for resumption; it does not
promise execution beyond the host's limits. Never mark red checks complete.

The user withdrew cloud automation and scheduling. Remove the unactivated hosted
plan and requested schedule; no cloud executor, trigger, API billing or automatic
session pickup is part of this decision. Keep session completion and recovery
guidance in [the session workflow](09-codex-workflow.md). This maintenance does not
start Session 1.3 or change application behavior.

_Why:_ prior sessions stopped at recoverable failures or PR creation and left the
user to restart work. _Rejected:_ treating complexity or a fixed retry count as
completion; weakening checks; starting later cards before merge.

**D-065 · Standing authorization to merge completed sessions and corrective PRs.**
The user explicitly reapproved merging to main at the end of every selected
session, including further fix PRs needed to finish that session. This supersedes
the human-merge default in D-064 and earlier no-automatic-merge wording in
D-055/D-059. The implementer must use this standing authorization without asking
again for each merge, unless the user revokes it or the work exceeds the selected
card and its necessary corrections.

Implement on a session branch, push all commits and open/update a PR. Merge the
exact independently reviewed head only after all required local and GitHub
checks pass, findings are resolved, and repository protections are satisfied.
Never push directly to main, bypass protections or self-claim independent review.
If the base changes, reconcile and refresh review/check evidence as needed before
merging. Confirm GitHub's actual merge SHA and wait for required CI on main.

Any session-related failure before merge remains work on the same PR. A failure
discovered after merge requires a correction branch from current main, meaningful
verification, a fresh independent review and a new PR merged under the same
authorization. Repeat until the selected card and its required post-merge checks
are green. Do not close the session as complete at PR creation or while known
session failures remain. Preserve honest incomplete checkpoints only for genuine
external blockers or hard host limits, as required by D-064.

Save a concise next-session handoff with branch/PR, implemented/reviewed/merged
status, verification, remaining issues and exact next prompt. Record actual merge
and post-merge CI evidence durably in the PR; the next session reconciles PROGRESS
from that evidence rather than creating an endless chain of handoff-only PRs.
This authority does not select another card, start Session 1.3 here, reinstate
cloud scheduling or authorize new paid services. Stop after the selected card;
follow-on milestones after 5.2 still require human selection.

## Session 1.6 explanation expectations

**D-066 · Correct the initial H1/H5 primary sets using the existing catalog weights.**
The initial Session 1.6 goldens were authored before running the implementation.
They mistakenly put practitioner-skill (weight 5) in primary when practitioner-hours
(weight 3) blocks the same practitioner. Doc 03 requires minimum summed weight;
no engine/catalog semantics or demo schedules change. In H1, Harris does not work
Tuesday and Iyer finishes at 14:00, so their primary facts are hours. In H5, Chen
does not work Wednesday, Iyer finishes at 14:00, and Rao/Mehta finish at 16:00;
their primary facts are hours. Other originally authored H1/H5 facts stay the same.
Correct those six golden entries explicitly and disclose this correction in the PR.

H1's capability context remains grounded practitioner-skill facts in the full
evidence dictionary, including for practitioners whose cheaper hours fact wins
primary. Session 2.2 groups that evidence without deleting necessary primary facts.
This follows doc 02's preference for lower-weight availability over capability;
the context sentence never requires all capability facts to be primary. H1/H5
headlines, every other hero expectation and planned alternative openings remain
unchanged. Tests assert exact primary sets and the retained capability evidence.

**D-067 · Complete the core performance gate using factorized boolean feasibility.**
The first external S benchmark measured isBookable p95 4.43 ms, exceeding the
unchanged 2 ms gate. Its boolean-only path need not construct the full Cartesian
matrix or rank a witness. After complete input validation, check globals and the
existence of a zero-violation member in each independent practitioner/room/equipment
dimension, including requested-practitioner facts and structural emptiness. This
is exactly the factorization specified in doc 03. evaluate retains the real matrix
and canonical load-ranked witness. Reuse conversions for identical booking start
minutes within one validation call only; no persistent cache or infrastructure.
These bounded corrections may touch feasibility.ts and validateRequest.ts in
Session 1.6. Retain every existing independent differential/property check, and
measure again without changing targets or removing scenarios.

The same core-gate work may touch matrix.ts: canonicalize the fact dictionary once
and sort its numeric indices per row, preserving exact fact-ID output order.
Explanation reduction processes deduplicated rows by size and compares only kept
minimal rows, avoiding quadratic comparisons against rows already dominated.
These are local algorithm changes with unchanged canonical output, bounded search
and assertions; brute-force and shuffled-input properties remain independent gates.

A second measured S isBookable p95 was 2.60 ms. Profiling found booking-date
conversion dominates validation. An internal batch helper in time.ts resolves the
zone once per call and retains safe-instant, supported-year and sub-minute-offset
guards for every distinct confirmed start. It adds no public export, clock or
persistent cache; local-date equivalence is checked independently at boundaries.
Batch conversion formats each distinct start with an explicit Gregorian calendar,
Latin digits, en-US locale and requested timezone. The date/era and seconds are
decoded together; nonzero local seconds reject historical fractional-minute
offsets. Unexpected formatter representation throws instead of guessing. DST
folds/gaps retain their actual instant's date. The individual Luxon localDate
helper remains the independent equivalence path.
Validation also resolves shared schedule boundaries once per affected date and
passes validated working intervals to practitioner.ts rather than repeating those
conversions during rule checks. Boolean checks may return after the first skill
or hours violation; full evaluation still collects all facts.

The corrected Linux run on EPYC 9V74 passed at 1.76 ms, while EPYC 7763 still
missed at 2.18 ms. Retain the target and repair that remaining cost. Reuse the
already validated UTC-encoded calendar when resolving batch schedule boundaries;
preserve every gap/fold/year check. Extend internal stop-at-first behavior to
leave/break, room capability/maintenance and equipment type/maintenance, avoiding
unused occupancy work for the boolean path. Full matrix checks still collect all
facts. This permits bounded edits to room.ts/equipment.ts as part of D-067, with
unchanged rule versions, expectations and independent differential gates.
For ordinary schedule boundaries, short-circuit Luxon's ambiguity search when its
two wall-time +/- one-day offset probes are equal: both subsequent candidate
instants are necessarily identical. Otherwise retain getPossibleOffsets unchanged.
This removes duplicate offset work with the same gap/fold result; generated
comparison against Luxon's full getPossibleOffsets path checks the shortcut.

**D-068 · Use the native canonical timezone catalog for schema validation.**
Profiling still attributes substantial S cost to repeated construction of an Intl
formatter just to validate the same canonical timezone. The snapshot contract may
recognize native Intl.supportedValuesOf("timeZone") entries through a static lookup
created at module load. Unlisted aliases/case variants retain the existing
DateTimeFormat fallback, as do runtimes without supportedValuesOf. This is an
immutable runtime capability catalog, not a cache of snapshots/results or evolving
validation state. Input schema, accepted aliases, reference validation and schema
version remain unchanged. The bounded Session 1.6 performance repair may touch
contracts/src/snapshot.ts and its tests. Keep the 2 ms gate and differential checks.
