# 08 — Decision log

Read this file by searching for a specific D-number cited by a card or doc; it is not required session reading. Later decisions supersede earlier wording where they say so. Full text of condensed entries: [archive](archive/decisions-full-text-2026-11-17.md).

> Active revision: D-050–D-059 govern the current plan, refined by D-060 onward. Earlier entries are historical wherever superseded; open items are in the Revised deferred decisions table.

Format: **ID · Decision** — _Why_ — _Rejected alternatives_ — _Revisit if_. New decisions are appended; superseded ones are marked. Condensed entries keep their binding rules here and full text in the archive.

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

Q-1–Q-5 with current owners (the original table with obsolete session numbers was removed by D-071).

| ID  | Decision to resolve                                                               | Owner                              |
| --- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Q-1 | Resolved by D-043: pinned supported Node/pnpm and compatible stable libraries     | 0.1                                |
| Q-2 | PGlite btree_gist/concurrency support; record evidence and real-Postgres fallback | P1                                 |
| Q-3 | Accessible calm clinic design tokens and typography                               | Resolved by D-073                  |
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

**D-064 · Persist through verification, review, merge and handoff.** Opening a PR is a checkpoint, not completion; the implementer owns the card through green checks, review, fixes, merge and handoff. Recoverable failures stay work on the card; two failed attempts mean diagnose, not stop. External blockers get a coherent pushed checkpoint and exact resume point. Cloud automation/scheduling withdrawn. Process details streamlined by D-071.

**D-065 · Standing authorization to merge completed sessions and corrective PRs.** The user authorizes merging each selected session PR and necessary corrective PRs to main without asking again, after review findings are resolved and required checks pass. Never push directly to main, bypass protections or self-claim review. Does not select new cards, reinstate scheduling or authorize paid services; follow-ons after 5.2 need human selection. Check/review timing streamlined by D-071.

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

**D-067 · Factorized boolean feasibility for the core performance gate.** After full input validation, isBookable checks globals and the existence of a zero-violation member per independent practitioner/room/equipment dimension (including requested-practitioner and structural emptiness), and may stop at the first violation per resource; `evaluate` keeps the real matrix, collects all facts and keeps the canonical load-ranked witness. The matrix canonicalizes the fact dictionary once and sorts numeric indices per row; reduction compares only kept minimal rows. An internal time.ts batch helper converts distinct booking starts once per call (explicit Gregorian/Latin/en-US formatter; nonzero local seconds reject fractional-minute offsets; unexpected formatter output throws) and resolves schedule boundaries once per date; Luxon's ambiguity search is skipped only when both offset probes are equal. No public export, clock or persistent cache. The individual Luxon helpers stay the independent equivalence path; all differential/property checks retained; targets unchanged (1000 warm-ups, 300 timed samples).

**D-068 · Native canonical timezone catalog for schema validation.** Snapshot validation may recognize `Intl.supportedValuesOf("timeZone")` entries via a static module-load lookup; aliases and runtimes without it keep the DateTimeFormat fallback. Not a cache; schema and accepted inputs unchanged.

**D-069 · Fixed benchmark young-generation size.** Benchmarks run with `--max-semi-space-size=64` and record execArgv and heap limit; relative comparisons require matching flags. All samples kept; absolute 2/20 ms gates unchanged. Benchmark-only configuration.

**D-070 · No diagnostic allocations on successful validation.** Validation reuses duplicate-detection sets for references and builds error paths only on failure (same issues/order/messages). Schedule conversion may build candidates directly when equal ambiguity probes and an exact local round trip agree; otherwise the original Luxon path is used. Keep the full-Luxon equivalence property.

## Workflow streamlining — 2026-11-17

**D-071 · Lean session workflow: one gate, one push, one review, no handoff PRs.**
Sessions 0.1–1.6 took 12 PRs and 78 CI runs (about 150 runner-minutes) for eight
cards. Causes: every PR push ran CI twice (push and pull_request triggers) with
5000-run properties and a wall-clock benchmark; 13 runs failed, mostly the S
benchmark varying between shared runners on identical source; every new head
required a fresh full review; three docs-only "completion handoff" PRs each
needed their own review, CI and merge; and every session read a 60 KB PROGRESS
log plus long restated rules. Product semantics, invariants, goldens and
benchmark targets are unchanged. This supersedes the conflicting process parts
of D-040, D-055, D-059, D-064 and D-065; their merge authority stands.

- PR CI runs `pnpm verify` once per PR update at the default 500 property runs
  and cancels superseded runs. There is no separate push or post-merge main run.
- The 5000-run properties and benchmark report run in the manual Deep
  verification workflow (`deep.yml`), required at milestone gate cards 1.6, 2.3,
  3.3, 4.3 (formerly 4.4, see D-072) and 5.2 and otherwise optional every few sessions. A card whose Done
  when names 5000 cases also runs those property files once locally at 5000.
  Run counts in code are never lowered.
- Doc 03 S targets remain gates. They are enforced by `pnpm bench` on the
  machine that owns the committed baseline (currently baseline-win32.json),
  when a card touches engine hot paths and at milestone gates. On shared CI
  runners the benchmark is an informational report; a runner-only miss is
  re-measured locally before any optimization.
- While working, run affected tests; run the full gate once before the PR and
  again only after source changes. Commit locally at coherent points and push
  once when publishing, then once per batch of fixes.
- One fresh-context whynot-review per session PR, using its correctness/UX
  checklists at the cards that previously required separate reviewers. Re-review
  only a delta that changes source behavior, not docs/formatting/handoff edits.
- Merge under D-065 when PR CI is green and findings are resolved. The session
  handoff is written into PROGRESS on the session branch before merge; no
  separate completion PR. The next session marks the previous card merged in its
  own branch from live merge evidence.
- PROGRESS keeps a short current-state section and status table; long history is
  archived. Skills are reduced to whynot-session, whynot-engine (absorbing
  narration), whynot-testing, whynot-ui, whynot-review and whynot-api (follow-ons
  only); planning guidance folds into whynot-session; one reviewer role remains.
  External skills (ui-ux-pro-max, security, provider docs) are optional aids and
  never block a card; browser checks use the @playwright/test package from 3.1.
  The Windows-only planning validator is removed; Prettier and review cover docs.

_Rejected:_ removing the 5000-run or benchmark checks (they still guard
correctness/performance at milestones); weakening benchmark targets; dropping
independent review.

**D-072 · Fewer cards, skills and always-loaded text.**
Extends D-071; product scope, rules, goldens and targets are unchanged.

- Cards: the thin UI cards 4.2 (staff policy playground) and 4.4 (empty-calendar
  journey) merge into 4.3 "Policy playground and empty-calendar journey", keeping
  every Build/test/Done item, after range engine work, which moves from 4.3 to 4.2.
  The milestone gate formerly at 4.4 is now 4.3; the correctness checklist moves with
  range work to 4.2. 5.1 depends on 4.3. 2.1/2.2 and 5.1/5.2 stay separate because
  each is already a full session.
- Skills: whynot-api is removed; its guardrails live in doc 05 §Implementation
  guardrails, and P/H/A cards use whynot-engine/whynot-testing with that section.
  Five project skills remain (session, engine, testing, ui, review) plus one
  reviewer role.
- AGENTS.md (loaded every turn) keeps the product summary, invariants, testing rules
  and Git rules, and points to the session skill for procedure.
- Long workflow and performance entries D-064, D-065 and D-067–D-070 are condensed
  to their binding rules; their full text is in docs/archive/. GitHub access
  troubleshooting is removed because access is fixed; generic Git tips remain.
- 3.1 adds Playwright/axe as ordinary pinned dev dependencies and records its design
  decision under the next free number (the old "D-045" placeholder was out of
  sequence). Doc 08's obsolete Open table is removed; the revised Q-1–Q-5 table
  stays.
- Milestone gate cards run `pnpm test:deep` and `pnpm bench` locally and record the
  results in the PR, so no gate depends on someone dispatching a workflow; the Deep
  verification workflow is optional (amends D-071's milestone requirement).
- Scripts: `pnpm test:quick <files>` runs selected tests after building packages;
  `pnpm test:deep` runs the whole suite at FC_NUM_RUNS=5000.

**D-073 · Accessible clinic playground design.** Riverside uses ink on warm
off-white and white, with deep teal for controls and a distinct visible focus
ring. Headings use a local serif stack, with a system sans-serif for body and
controls. Controls have at least 44 CSS pixels of height and status is conveyed
in words. Use a two-column layout when space permits and a single column on
small screens. The design-system reference maps these choices to the CSS
tokens and gives guidance for subsequent playground cards. Resolves Q-3.

**D-074 · Represent empty range and search domains without invented times.**
An open date can have zero eligible starts when no grid-aligned appointment
fits its openings. That date contributes no segment. A fully blocked range
may therefore have an empty segment list and evidence dictionary. Actual clinic
closures still have dated structural evidence. When next-available search
cannot inspect any covered search window, report `window_limited` with null
bounds and zero evaluations. In a verified next opening, the existing
alternative contract uses the start of the requested local-date range as its
temporal reference. Its day cost measures the local-day difference with the
usual preference-change cost. No calculation assumes a requested time of day.

**D-075 · Keep range start windows aligned to the actual clinic grid.**
Touching or overlapping opening entries offer continuous clinic coverage,
matching single-slot evaluation. A start may fit across midnight if clinic
coverage continues and the whole appointment is within the snapshot. Keep
segments separate by local date. End a start window at the next actual grid
instant on that date, or the end of the local date for its last grid start.
On a regular grid this advances by one grid step where another grid start
exists. Around offset changes it keeps adjacent windows disjoint.
