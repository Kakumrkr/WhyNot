# 09 — Working with Codex

The lean workflow below is decision D-071. It keeps every product rule, invariant, golden and benchmark target; it only removes repeated work (double CI, per-head re-reviews, handoff-only PRs, long mandatory reading).

## What each session reads

| Always | Only when the card says so |
| --- | --- |
| AGENTS.md (auto-loaded), PROGRESS "Current state" + table, QUESTIONS "Open", the selected card | The card's "Read first" docs and listed skills |

Do not read the PROGRESS archive, archived phase cards, or the whole decision log by default. Search doc 08 for a specific D-number when a card or comment cites it.

## Skills

| Project skill | Use |
| --- | --- |
| whynot-session | Every session, including documentation-only changes |
| whynot-engine | Contracts, engine behavior, templates; later optional AI wording |
| whynot-testing | Test changes/failures and verification strategy |
| whynot-ui | Playground, design and accessibility (3.1 onward) |
| whynot-review | The one fresh-context review per session PR |

Follow-on P/H/A cards use whynot-engine/whynot-testing plus doc 05 §Implementation guardrails.

Skill paths: .agents/skills/<name>/SKILL.md. Load only the skills a card lists.

External skills (ui-ux-pro-max, security-best-practices, security-threat-model, provider docs, gh convenience skills) are optional aids. A card never blocks because one is missing. Browser checks from 3.1 use the @playwright/test dev dependency that 3.1 adds. Do not spend a session installing or researching skills.

## Session loop

1. Orient: PROGRESS current state, QUESTIONS open, selected card. Confirm the dependency PR merged with one lookup.
2. Branch: resume the card's branch if it exists, otherwise create it from updated main. Preserve user changes; never reset unrelated work.
3. Implement only the Build list. Run affected tests while working. Commit locally at coherent points.
4. Gate once (see Gates). Write the handoff into PROGRESS on the branch.
5. Publish once: push all commits in one push, open the PR (template in .github). Each push re-runs CI, so batch later fixes.
6. Review once: a fresh-context whynot-review (new Codex task or the whynot_reviewer agent). Fix findings in one commit, rerun affected tests and pnpm verify, push once. Re-review only deltas that change source behavior.
7. Merge under D-065 when PR CI is green and findings are resolved. No post-merge main CI wait and no separate completion PR.
8. Stop before the next card. After 5.2 stop for human selection of a follow-on.

Failures during the card are part of the card: diagnose and fix; after two failed attempts change approach. A genuine external blocker (access, missing human setting) gets one recorded note in QUESTIONS and the handoff, with the exact phase to resume; then stop. Never mark a card complete with red checks.

## Gates

| Gate | When | Command |
| --- | --- | --- |
| Affected tests | While working | `pnpm test:quick <test files>` (no build; the four native smoke tests need `pnpm test`) |
| Full gate | Once before the PR; again only after source changes | `pnpm verify` (format, lint, types, tests at 500 runs, build) |
| 5000-run properties | Cards whose Done when names 5000 cases | `pnpm test:deep <property test files>` once locally (whole suite without file arguments) |
| Benchmark | Cards touching engine hot paths, and milestone gates | `pnpm bench` on the machine owning the committed baseline |
| Milestone deep gate | Gate cards 1.6, 2.3, 3.3, 4.3, 5.2 | `pnpm test:deep` (whole suite at 5000) and `pnpm bench`, locally; record both results in the PR |
| Deep verification workflow | Optional, every few sessions or when local runs are impossible | GitHub Actions → Deep verification → Run workflow (a human click; Codex does not need to trigger it) |
| Browser | From 3.1 | Built-app Playwright checks, desktop 1280 and mobile 390, axe |
| Real Postgres | From P1 | Separate script/job added by P1 |

PR CI (ci.yml) runs pnpm verify once per PR update and cancels superseded runs. Benchmark results on shared GitHub runners are informational: when only a runner misses an S target, re-measure locally before optimizing (the 1.6 history shows identical source passing and failing on different runners).

## Common completion checklist

Every card's "Common completion checklist" item means all of:

- Every Build item has test or evidence; required gates for the card are green.
- One fresh review done; findings fixed or explicitly answered in the PR.
- PROGRESS current state, status row and "Last handoff" updated on the branch.
- PR has session ID, behavior, verification summary, open questions and UI screenshots when applicable.
- All commits pushed; PR merged under D-065.

## Handoff

Before opening the PR, update docs/PROGRESS.md on the session branch:

1. Status row: Implemented `done`, PR number. Leave Reviewed/Merged as `—`; the next session fills them from the merged PR (never claim them in advance).
2. Current state: next card, its starter prompt, and any open question.
3. Last handoff: replace with at most ~10 lines: what was built, decisions/golden corrections (D-numbers), test count, anything the next card must know. Put one-line durable facts in Carry-forward notes.

Do not paste CI run lists, commit hashes for every checkpoint, review transcripts or long prompts into PROGRESS; they live in the PR. Do not embed a commit's own hash in that commit.

At the start of the next session, mark the previous card Reviewed/Merged in the table from the merged PR. That small edit rides on the new session branch; never open a PR just for it.

## Commits and PRs

Commit after meaningful verified increments; one commit is fine for a small card. Imperative scoped messages. No AI attribution or Co-authored-by trailers. Stage explicit files only. Never force-push published work, push directly to main or bypass protections.

PR body: session ID, concrete behavior, checks run, open questions, screenshots for UI. Use a body file or the GitHub tool for multiline text.

## Git tips

- `rejected (fetch first)` / non-fast-forward: the remote branch has commits you lack (often your own earlier push). `git fetch origin <branch> && git merge --no-edit FETCH_HEAD`, then push. Never force-push.
- Merge blocked by protection: wait for the `verify` check; if the branch is behind main, merge main into it and push once.
- Native ESM smoke tests fail with EPERM inside a sandbox: it blocks spawning `node`. Rerun those four tests with sandbox escalation; do not modify them.

## Review roles

One role file remains: .codex/agents/whynot_reviewer.toml, which runs whynot-review (with its correctness/UX checklists at the cards that name them). If custom agents are unavailable, start a fresh Codex task with the prompt below. A role saying "do not edit" is an instruction, not a sandbox. Do not spawn extra agents beyond the one review, and avoid parallel implementers on contracts/engine/goldens.

## Prompts

Start or resume a card (cards carry the same two lines):

~~~text
$whynot-session
Session <id> — <title>. Card: docs/sessions/session-<id>.md
~~~

Pick the next card:

~~~text
$whynot-session
Select the next card from docs/PROGRESS.md "Current state" and run it.
~~~

Review:

~~~text
$whynot-review
Review PR #<n> (Session <id>) against docs/sessions/session-<id>.md. Fresh context, findings only.
~~~

## Planning and questions

Record decisions in doc 08 before changing semantics; update impacted docs/cards/skills together. Docs-only changes run `pnpm format:check`. Missing evidence stays pending. Never improvise conflicting rule behavior; put the ambiguity in QUESTIONS and do the unambiguous work.
