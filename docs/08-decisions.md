# 08 — Decision log

Format: **ID · Decision** — *Why* — *Rejected alternatives* — *Revisit if*. New decisions are appended; superseded ones are marked, never deleted.

## Product

**D-001 · Build WhyNot (explainable booking engine) instead of the VouchDesk support-investigation agent.**
*Why:* VouchDesk's category is crowded (Pluno, Pylon, Intercom Fin) and its plan needed months of third-party integration work; WhyNot has an original combination, a provable core, and a 60-second demo.
*Rejected:* VouchDesk; generic RAG/chat apps; agent replay debugger (good, but less demo-friendly).
*Revisit if:* never for v1.

**D-002 · Portfolio-quality product first, not a startup.** Commercial adoption is unlikely (platforms own the rules). *Revisit if* real demand appears after launch.

**D-003 · Demo business: fictional Riverside Family Clinic.** Clinics have the richest interacting rules (skills, rooms, equipment, buffers, referrals). *Rejected:* gym, coworking.

**D-004 · Single clinic, single timezone, single-appointment requests in v1.** Keeps the algorithm exact and fast. Extension notes in doc 03.

**D-006 · Position WhyNot on the three moments where hiding slots fails** (patient stuck on an empty day/practitioner, front-desk calls, invisible lost bookings) — not on the ordinary "pick another open slot" case. Adds range explanations ("Why is this empty?", Session 2.5) as a first-class feature. *Why:* most apps hide unavailable slots; a single-slot explainer alone would solve a rare problem.

**D-005 · The demo creates bookings in its own DB; WhyNot integrates with no third-party scheduler in v1.**

## Engine

**D-010 · Pure TypeScript engine, no external solver.** Demo-sized candidate matrices (≤ ~100 candidates) are solved exactly with a hitting-set branch-and-bound. Enables in-browser static demo. *Rejected:* OR-Tools/Python service (second language, deployment cost), MiniZinc, clingo. *Revisit if* bench L dataset matters or multi-resource/series bookings are added.

**D-011 · Explanation = minimum-weight irredundant hitting set over the violation matrix.** Sufficient + minimal by construction; weights encode "simplest true thing". *Rejected:* first-failing-rule (misleading), all violations (noisy), LLM-chosen reasons (unverifiable).

**D-012 · Buffers/turnover are separate rules from busy.** Lets explanations distinguish "booked" from "policy buffer" and powers admin fixes.

**D-013 · Instants are integer epoch minutes (UTC) inside the engine; luxon isolated in `time.ts`.** *Rejected:* Date objects everywhere (TZ bugs), Temporal polyfill (heavier; revisit when Temporal is universal).

**D-014 · Alternatives ranked by an explicit, configurable cost model with category diversity.** "Nearest" is a preference; making it explicit makes it honest and tunable.

**D-015 · `now` is always injected; demo uses a demo clock.** Determinism and evergreen demo scenarios.

## AI

**D-020 · OpenAI API for optional narration (user choice: cost).** Behind a `Narrator` interface; model via `OPENAI_MODEL` env, chosen by the narration eval in Session 5.3. *Revisit if* cost/quality changes — swapping providers touches one file.

**D-021 · Templates are the default and the ground truth; AI output must pass a deterministic verifier or is replaced by templates.** The model never decides anything.

**D-022 · Static demo ships pre-verified narrations; no API key ever in the browser.**

## Platform

**D-030 · TypeScript monorepo with pnpm workspaces** (`packages/contracts`, `engine`, `narrator`, `fixtures`; `apps/api`, `apps/web`). *Rejected:* Nx/Turborepo (unneeded at this size), separate repos.

**D-031 · Fastify + Drizzle + PostgreSQL 16; React + Vite + TanStack Query + Tailwind; Recharts.**

**D-032 · API tests use PGlite (in-process Postgres), so no Docker is required in any sandbox.** Postgres-only features get `@pg`-tagged tests run in CI with a service container.

**D-033 · Demo role switcher instead of real authentication.** No real users or data exist. Clearly labelled. *Revisit if* hosted with real users (never planned).

**D-034 · Double safety for booking races:** serializable transaction re-evaluation + Postgres exclusion constraints.

**D-035 · Hosting decided in Session 7.2.** Static demo on GitHub Pages is fixed; full-stack hosting optional.

## Process

**D-040 · Built with Codex. Rules live in `AGENTS.md`; project skills live in `.agents/skills/`.** Curated OpenAI skills + UI UX Pro Max are installed per `docs/09-codex-workflow.md`.

**D-041 · One session = one verified, pushed increment; `pnpm verify` is the single gate; golden expectations change only with a decision-log entry.**

**D-042 · License: MIT for original code** (confirm in Session 0.1). No GPL dependencies in `packages/engine`.

## Open (to decide in the named session)

| ID | Question | Session |
| --- | --- | --- |
| Q-1 | Exact pinned versions of Node, pnpm, and libraries | 0.1 |
| Q-2 | PGlite support for `btree_gist` exclusion constraints | 3.1 |
| Q-3 | Visual design direction (style, palette, typography) | 4.1 |
| Q-4 | OpenAI model for narration | 5.3 |
| Q-5 | Full-stack hosting provider (or none) | 7.2 |

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

| ID | Decision to resolve | Owner |
| --- | --- | --- |
| Q-1 | Supported pinned Node LTS >=22, pnpm and compatible stable libraries; record D-043 | 0.1 |
| Q-2 | PGlite btree_gist/concurrency support; record evidence and real-Postgres fallback | P1 |
| Q-3 | Accessible calm clinic design tokens and typography | 3.1 |
| Q-4 | Whether AI adds value, output constraints, provider/model if justified | A1/A2 |
| Q-5 | Full-stack hosting optional; static Pages is fixed | P5, only if human requests hosting |

These future-session decisions do not block 0.1. No unresolved first-release architecture choice should be delegated silently to implementation.
