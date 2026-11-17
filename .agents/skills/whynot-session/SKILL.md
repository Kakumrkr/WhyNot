---
name: whynot-session
description: Run a bounded WhyNot development session, verify its acceptance criteria, commit checkpoints, push all work, and prepare the next-session handoff. Use whynot-planning as well for documentation-only revisions.
---

# Session protocol

Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md, active index and selected card fully. Archived phase cards are not instructions. Check dependency PRs are merged, not merely implemented. Resume incomplete branch/checkpoint; stop after one card.

Before edits: inspect status/branch, preserve user changes, update clean main by fast-forward and create the card's session branch. Read required docs/area skills. Missing required skills block relevant work; optional convenience skills have native fallbacks.

Baseline pnpm verify once tooling exists. Session 0.0 is documentation bootstrap; 0.1 creates the gate. Do not fix unrelated baseline failures silently. Briefly map Build items to verification and files before implementation.

Implement logical increments with meaningful tests. Relevant typecheck/tests before checkpoint commits. Commit checkpoints during work; push during longer sessions. Do not stage unrelated user changes or generate dummy passing checks.

For completion: every card criterion evidenced; pnpm verify green from 0.1; browser checks from 3.1, required real-PG checks from P1. Do not claim external review, deployment or live eval without evidence.

Update PROGRESS implemented/reviewed/merged independently. Record branch, stable checkpoint commit, PR, checks/evidence, decisions, unresolved work and exact next card. Final HEAD belongs in PR/final response rather than self-referential tracked text.

Before ending push every session commit and verify remote HEAD equals local. Open/update PR using native tool if yeet unavailable. No attribution trailers or force-push. Follow D-064: require current-head independent review and green required checks; keep watching for human merge. Do not merge without explicit authorization. Never bypass protections.

If blocked/incomplete, save coherent checkpoint/draft and report failures/remaining work; never tick complete with red checks. Auth/network errors must name unpushed commits. Record material ambiguity or repeated failure after two genuine attempts in QUESTIONS, change the diagnostic approach and continue unambiguous work. Two attempts are not a stop rule. Fix recoverable failures and review findings, rerun gates and obtain fresh review of changed heads. At runtime limits persist the exact branch/PR/phase for continuation without repeating discovery; never require the user to restate the same card. Golden corrections require decisions.

Own the card through independent review, confirmed merge, post-merge checks and durable handoff, not merely PR creation. Follow D-064 and docs/09-codex-workflow.md. Independent review happens in a fresh task using whynot-review. Do not self-mark reviewed. Next card waits for merge evidence. Stop after 5.2 until human selects a follow-on.
