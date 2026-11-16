# 09 — Working with Codex

## Repository handoff, not chat memory

AGENTS.md holds standing invariants. Docs 00–09 define product/semantics. Active cards in sessions/README.md bound each work unit; PROGRESS records implemented/reviewed/merged and QUESTIONS unresolved issues. Future tasks must work without this planning conversation. Old phase cards are archived and non-executable.

Use default permissions scoped to this repository; no unrestricted mode is needed. Set project directory to WhyNot. No API key is required for the application or interactive development. An explicitly selected API-backed cloud development worker has separate secret/billing requirements; see [workflow automation](workflow-automation.md). Node/pnpm are selected in 0.1, not silently installed by planning.

## Skills

| Project skill | Use |
| --- | --- |
| whynot-session | Every implementation/handoff |
| whynot-planning | Documentation-only changes; decision/card/skill consistency |
| whynot-engine | Contracts and engine behavior |
| whynot-testing | Test changes/failures and verification strategy |
| whynot-ui | Playground, design and accessibility |
| whynot-narration | Templates; later optional AI |
| whynot-api | P1 onward DB/API/transactions |
| whynot-review | Independent review in a fresh task |

Do not read/load every skill in every task. Cards list required skills; read full relevant SKILL.md. Skill metadata guides selection but is not a substitute for reading the workflow.

Project skill paths: .agents/skills/<name>/SKILL.md. Restart/start a fresh task after changing installed guidance to ensure it is discovered; do not assume current tool catalogs refresh.

| External capability | Needed | Policy |
| --- | --- | --- |
| ui-ux-pro-max | 3.1 onward visual decisions | Required by relevant UI cards; verify current upstream install procedure |
| playwright | 3.1 onward browser work | Required by cards; a verified supported browser workflow must be installed/exposed |
| screenshot / playwright-interactive | Optional | Existing browser tooling can supply screenshots/manual checks |
| security-best-practices | 5.2/P4/A2 | Required only when named by owning card |
| security-threat-model | P3 | Required before API trust-boundary review |
| openai-docs | Codex configuration and A1 onward API experiment | Current official docs, not memorized SDK syntax |
| gh-fix-ci / gh-address-comments / yeet | Optional convenience | Native Git/GitHub tools are valid fallback |

### Installing only what is needed

Use skill-installer to list currently available curated skills and inspect their source before choosing names. Example invocation: "$skill-installer list available skills", then "$skill-installer install <verified-name>". Do not assume old names or guessed commands still work. If curated discovery fails, consult the skill installer's supported GitHub-path workflow and current official source.

For UI UX Pro Max, inspect [upstream](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) for current Codex installation instructions, license and generated location; install a pinned/reviewed revision to repo skill path where feasible. Do not blindly run a global npm command from old planning. Commit installed project guidance as part of its owning card and record source/revision/license.

Before needed implementation, report missing required capability, verified install source/method and restart requirement. Do not stop engine work because a future UI skill is missing. Do not silently replace a required design/security skill. Optional GitHub convenience skills never block native-tool operation.

## Agents

Normal workflow: one implementer owns a card through green checks, fresh independent review, findings resolution, confirmed merge and handoff (D-064). Human merge remains the default until the user explicitly authorizes automatic merging under the recorded gates. Review is independent context, not the implementer's self-check.

Optional local custom roles:
- .codex/agents/whynot_reviewer.toml: session diff/spec/verification review;
- .codex/agents/whynot_correctness.toml: algorithm/privacy/patch/search evidence at gates;
- .codex/agents/whynot_ux.toml: real browser workflows, focus/mobile/copy.

Definitions intentionally inherit model/reasoning settings; no mandatory expensive model or personal MCP configuration. Verify client support before use. When unavailable, paste the same role instructions into a fresh task. Never block implementation on optional custom-agent discovery.

A role saying "do not edit" is an instruction, not a separate read-only sandbox. Subagents inherit parent permissions. Do not launch agents merely because definitions exist. Use explicit request or an applicable review card; reviews produce findings, not edits. Avoid parallel work on contracts/engine/goldens. Any approved parallel implementation needs disjoint ownership and worktrees.

Official configuration checked 2026-11-16: [customization](https://learn.chatgpt.com/docs/customization/overview), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents). Recheck current docs when client behavior changes.

## Session loop

1. Read PROGRESS/QUESTIONS/index and select first incomplete eligible first-release card; prerequisite PRs must be merged.
2. Check git status and branch before switching/pulling. Preserve user changes. Resume an incomplete session branch instead of recreating it.
3. For new work, update clean main with fast-forward pull then create session/<id>-<slug>. Never reset unrelated work.
4. Read full card/required docs and relevant skills; baseline verify if tooling exists.
5. Implement only Build in logical increments; tests prove Done when.
6. Commit verified checkpoints and push during long sessions. Stage explicit intended files.
7. Run final required checks. Record actual evidence, remaining questions and review status.
8. Push all commits, confirm local HEAD equals remote branch HEAD, open/update PR.
9. Fresh task with whynot-review reports severity/file/line/reproduction; implementer fixes and rechecks.
10. Keep ownership while CI/review/merge is pending. Fix recoverable failures and repeat review after changes; two failed attempts require diagnosis, not abandonment. Merge only under recorded authority and current-head gates; otherwise watch for human merge. Confirm the merge SHA and post-merge CI, save the durable handoff, and let a later authorized trigger select the next card. Stop after 5.2 for human selection of a follow-on.

Never mark a session complete with red required checks. If externally blocked or at a runtime limit, save a coherent pushed checkpoint/draft PR, failures and exact phase for automatic continuation of the same card. Do not ask the user to restart ordinary failed tests, CI or review corrections. Auth/network failure means report unpushed commits and blocker, never claim success.

## Commit and PR requirements

Commit after meaningful verified increments (contracts, behavior, integration/docs as appropriate), not just one giant final commit. Small coherent sessions may have one. Final gate before completion. No AI attribution or Co-authored-by trailers. No force-push or protection bypass. Automatic merge requires explicit recorded authorization and all D-064 review/check gates.

PR body: session ID, concrete behavior, checks/outputs, unresolved questions, screenshots for UI and evidence links. Use structured GitHub tool or body file for multiline text; preserve actual newlines.

PROGRESS handoff: branch, commit, PR, tests/evidence, decisions/surprises, remaining items and exact next card. Keep implemented/reviewed/merged separate. Do not embed a commit's own hash inside that same commit; use the PR/final response for final HEAD and stable earlier checkpoint references in tracked notes.

## Hosted scheduling and durable continuation

See the [automation plan](workflow-automation.md) for supported execution routes, activation status, phase ownership, retry budgets, merge evidence and post-merge handoff. A local desktop automation is insufficient when the PC is off. Do not claim an active cloud workflow from saved documentation alone.

## Starting prompts

### First implementation after planning merges

~~~text
$whynot-session
Session 0.1 — Foundation and architectural boundaries.
Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md and docs/sessions/session-0.1.md fully.
Read its required documents and use whynot-testing.
Confirm Session 0.0 is merged. Create session/0.1-foundation from updated main.
Implement only the card's Build list; do not implement domain code or later sessions.
Commit logical verified checkpoints, run pnpm verify, update the handoff,
push every session commit, verify remote HEAD and open/update the PR.
Finish with actual verification evidence, final commit, PR and next-session prompt.
~~~

### Subsequent sessions

Use the selected card's full Starter prompt. To ask for selection, use the README generic prompt; never start a follow-on milestone automatically after 5.2.

### Independent review

~~~text
$whynot-review
Review the Session <id> branch/PR against its active card and required specification.
Use a fresh context. Report findings with severity, file/line, evidence and suggested fix.
Do not edit, post comments, push or merge unless separately instructed.
Check verification evidence; run applicable checks where available.
~~~

## Planning and questions

Use whynot-planning. Record decisions before changed semantics; update impacted docs/cards/skills together. Documentation bootstrap 0.0 validates links, dependencies, frontmatter, TOML and whitespace without a package gate. Later documentation changes also run existing required checks. Missing evidence remains pending. Never improvise conflicting rule behavior.

Reproduce the planning check from repository root:

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File docs/validation/checkPlanning.ps1 -Bootstrap
~~~

Omit -Bootstrap once application work exists. The checker validates local links (not external URL availability), ordered dependencies, card sections, documented skill frontmatter and the exact simple TOML subset used by reviewer files. It is not a general YAML/TOML parser or a Codex agent-discovery test. Archived historical links are intentionally outside the active-link gate.
