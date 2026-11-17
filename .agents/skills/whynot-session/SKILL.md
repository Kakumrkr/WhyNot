---
name: whynot-session
description: Run one WhyNot session card end to end (branch, implement, verify, one review, merge, handoff) with minimal reading, CI and pushes. Also covers documentation-only planning changes.
---

# Session protocol

Full rules: docs/09-codex-workflow.md. This is the checklist.

1. **Orient (keep it short).** Read the "Current state" section at the top of docs/PROGRESS.md, docs/QUESTIONS.md "Open" section, and the whole selected card. Do not read PROGRESS history, archived cards or the full decision log unless the card points you there.
2. **Prerequisite.** Confirm the dependency is merged with one `git fetch origin main && git log origin/main --oneline -5` (or one GitHub PR lookup). Do not re-verify older sessions. On the new branch, mark the previous card Reviewed/Merged in the PROGRESS table from that merged PR.
3. **Branch.** If the card's branch exists, resume it. Otherwise branch from updated main. Preserve any user changes.
4. **Read.** The card's "Read first" docs and only the skills it lists. Skim sections you need; you do not have to reread docs you already loaded in this task.
5. **Implement** only the Build list. Run only the affected tests while working (`pnpm test:quick <files>`). Commit locally at coherent points; no pushing per commit.
6. **Gate once.** Run `pnpm verify` once on the finished work. If a card's Done when names 5000 property cases, also run `pnpm test:deep <those property files>` once. Run `pnpm bench` only if the card touches engine hot paths. Milestone gate cards (1.6, 2.3, 3.3, 4.3, 5.2) run `pnpm test:deep` and `pnpm bench` once locally and put the results in the PR.
7. **Publish once.** Write the PROGRESS handoff (see docs/09 §Handoff) as part of the session branch, push all commits in one push, open the PR. Every further push re-runs CI, so batch fixes.
8. **Review once.** One fresh-context whynot-review of the PR. Fix real findings in one commit, rerun the affected tests plus `pnpm verify`, push once. Re-review only if the fix changed source behavior.
9. **Merge.** Under D-065, merge when PR CI is green and review findings are resolved. Do not wait for or re-check main CI. Do not open a separate "completion/handoff" PR; the next session updates the status table in its own branch.
10. **Stop** before the next card. After 5.2, stop for human selection of a follow-on.

## Failures

- Recoverable test/CI/review failures are part of the card: diagnose and fix; two failed attempts mean change approach, not stop.
- A failing benchmark on a GitHub runner alone is not a code failure (D-071). Re-measure locally before optimizing.
- Genuine spec ambiguity: record it in docs/QUESTIONS.md, do only unambiguous work.

## Documentation-only changes

Record any semantic change as a doc 08 decision before editing affected docs/cards/skills, and update them together. Run `pnpm format:check`. No application code in a docs-only change.
