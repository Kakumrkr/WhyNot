# Session 0.0 — Planning handoff

**Goal:** Planning handoff; deliver the behavior below without implementing later cards.
**Branch:** session/0.0-planning-handoff
**Milestone:** First release
**Depends on:** None; documentation bootstrap.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [00-product-brief](../00-product-brief.md), [01-architecture](../01-architecture.md), [02-domain-and-rules](../02-domain-and-rules.md), [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md), [07-roadmap](../07-roadmap.md), [08-decisions](../08-decisions.md), [09-codex-workflow](../09-codex-workflow.md).
**Required skills:** $whynot-session.
**Review:** one fresh whynot-review before merge.

## Files and interfaces

- docs/**
- README.md
- AGENTS.md
- .agents/skills/**
- .codex/agents/**
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Record D-050–D-059 and resolve specification conflicts before application work; preserve superseded decision history.
- Replace active cards/index/progress with the approved engine/playground-first order and complete follow-on cards.
- Update eight project skills, optional reviewer role definitions, installation guidance and Git/handoff rules. Archive superseded phase cards clearly.
- Save a copy-paste Session 0.1 prompt and documentation validation evidence.

## Tests and verification

- Check active Markdown links, unique IDs, dependency order, required sections, skill references/frontmatter and TOML syntax.
- Check doc 02 catalog count, current IDs/paths and no active instructions invoking superseded cards; git diff --check.
- Confirm all changed tracked artifacts are documentation/agent instructions only; no pnpm gate exists.
- Documentation consistency gate only: no manifest or pnpm verification exists yet.
- During work run only the affected tests; run the full gate once before opening the PR.

## Done when

- [x] Common completion checklist in docs/09-codex-workflow.md satisfied.
- [x] Planning decisions persisted; all active cards complete and linked; validation recorded honestly.
- [x] Commit/push checkpoint increments, verify remote HEAD and open PR; leave reviewed/merged pending.

## Out of scope

- Application implementation, dependency installation, fake pnpm verification, merge/release.

## Handoff

Follow docs/09-codex-workflow.md §Handoff. Stop before the next card.

## Starter prompt

~~~text
$whynot-session
Session 0.0 — Planning handoff. Card: docs/sessions/session-0.0.md
~~~
