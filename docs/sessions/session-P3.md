# Session P3 — Projected read API and immutable input capture

**Goal:** Projected read API and immutable input capture; deliver the behavior below without implementing later cards.
**Branch:** session/P3-api-read
**Milestone:** Optional persistence follow-on
**Depends on:** [P2](session-P2.md) — merged.
**Read first:** AGENTS.md, PROGRESS.md and QUESTIONS.md; [03-engine-algorithms](../03-engine-algorithms.md), [04-explanation-and-ai](../04-explanation-and-ai.md), [05-api-and-data](../05-api-and-data.md), [06-testing-and-accuracy](../06-testing-and-accuracy.md).
**Required skills:** $whynot-session, $whynot-api, $whynot-testing, $security-threat-model.
**Review:** fresh-task whynot-review; correctness review at 1.6/2.3/4.1/4.3/5.2; UX review at 3.3/4.4/5.2.

## Files and interfaces

- packages/contracts/src/api.ts
- apps/api/src/{app,demoRole}.ts
- apps/api/src/routes/**
- apps/api/test/**
- docs/security/threat-model.md
- docs/PROGRESS.md and docs/QUESTIONS.md for truthful handoff/questions; specification changes outside listed files require a decision.
- Public behavior/interfaces are only those in the Build list. Follow authoritative docs 02–05; infer shared types from contracts.

## Build

- Build Fastify app factory, Zod request/response schemas and health/clinic/availability/explain/explain-range routes.
- Parse demo role/requester, apply audience projection before serialization; body/rate limits, CORS, safe error envelope and PII-free logs.
- Store immutable full input bundle and original result/version for every explanation; keep range/slot kinds separate; API durations outside engine.
- Write threat model for synthetic/demo boundaries and client-controlled roles.

## Tests and verification

- H1–H11 API outputs agree with isolated engine scenarios; schema validation and patient privacy scans.
- Malformed/unknown inputs, rate/size failures, role parsing, capture fidelity and grid parity.
- Run pnpm verify; from 3.1 onward run applicable built-app browser checks; from P1 onward run required real-Postgres checks. At 0.1 create the gate before its first run.
- Checkpoint tests target changed behavior; final gate covers the complete current workspace. Record actual commands/results.

## Done when

- [ ] Session PR and any necessary correction PRs merged under D-065; required main CI green and durable handoff saved.

- [ ] Read routes and capture green on portable DB; no raw staff leakage; pnpm verify.
- [ ] All Build items have evidence; required checks are green.
- [ ] Implementation status/handoff updated; reviewed/merged remain pending until independently established.
- [ ] Logical checkpoint commits made; all session commits pushed; remote HEAD equals local HEAD; PR opened/updated.
- [ ] PR includes session ID, verification summary, unresolved questions and screenshot evidence when applicable.

## Out of scope

- Booking mutations, insights/cache, narrator endpoint.

## Handoff

Record branch, final commit, PR, verification/evidence, unresolved items, decisions and next session. Resume this card if incomplete. If complete, next eligible card must wait for this PR's review/merge. Follow D-064/D-065: standing user authorization permits merging this session and necessary correction PRs after green checks and fresh independent review. Confirm merge and main CI; repair post-merge failures through another reviewed PR before declaring completion. Never label external validation done without evidence.

## Starter prompt

~~~text
$whynot-session
Session P3 — Projected read API and immutable input capture.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-P3.md completely.
Read the card's Read first documents and load its required skills.
Confirm dependencies are merged; use branch session/P3-api-read.
Implement only the Build list; do not start another session.
Make logical verified checkpoint commits and push checkpoints during longer work.
Run the required gates, record implemented/reviewed/merged honestly, and update the handoff.
Before ending push all session commits, verify remote HEAD and open/update the PR.
Continue through recoverable failures, CI and fresh independent review; fix findings and recheck.
Use D-065 standing authorization to merge after green checks and fresh review; confirm main CI.
Fix post-merge failures through a new reviewed correction PR and merge again before completion.
Follow D-064/D-065 and docs/09-codex-workflow.md; save the durable next-session handoff.
Finish with evidence, final commit, PR, merge status and exact next-session prompt.
If blocked, save a coherent checkpoint/draft and report remaining work; never claim completion.
~~~
