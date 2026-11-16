---
name: whynot-planning
description: Reconcile WhyNot specifications, decisions, session cards and agent guidance in documentation-only planning tasks. Do not implement application behavior.
---

# Documentation-only planning

Read AGENTS.md, PROGRESS, QUESTIONS, relevant specs and active session card. Identify affected contracts/semantics and record the chosen decision in doc 08 before changing authoritative behavior. Preserve superseded decision history explicitly.

Keep docs 00–09, active index/cards, skills and progress consistent. New cards need merged prerequisites, read list, skills, bounded Build/files/interfaces, tests, objective Done when, exclusions, branch, handoff and starter prompt. No hidden dependence on a past chat.

Resolve already approved choices without asking again. For new material ambiguity, record question/options and ask; do unambiguous work only. No application code, dependency installs or model calls for a docs-only task.

Validate links, IDs/dependency ordering, required card sections, skill frontmatter and agent configuration. Archive superseded cards with non-executable labels. Distinguish future paths from actual Markdown links.

0.0 predates package tooling: document checks substitute for unavailable pnpm verify. Later use existing project checks too. Report actual evidence and pending independent review.

Follow whynot-session Git/handoff policy: regular logical commits, push checkpoints and every commit before ending, remote HEAD confirmation and PR. Never describe an agreed chat plan as saved until repository changes exist.
