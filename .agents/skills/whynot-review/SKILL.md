---
name: whynot-review
description: Independently review a completed WhyNot session branch or PR against its active card, specification and verification evidence. Findings only; no edits unless explicitly requested.
---

# Fresh-task review

Read AGENTS.md, PROGRESS/QUESTIONS, selected active card and required docs. Inspect diff against actual base (git diff main...HEAD or PR base). Archived cards are not authoritative.

Check exact Build and exclusions, public schema/behavior compatibility, canonical/pure/time/privacy invariants, real patch verification, search completeness and scenario isolation. Look for missing-resource, DST, equal-tie and redaction/reference bugs.

Tests must prove acceptance and be independent: no weakened goldens, skips, lower runs, optimized/reference coupling, mock engine or unmeasured baseline updates. Check clean consumer exports when relevant.

Run available required checks; 0.0 is docs bootstrap with link/dependency/frontmatter/TOML checks, not nonexistent pnpm. Report unavailable environments/evidence explicitly. Verify committed/pushed scope and progress statuses; only independent review can satisfy reviewed.

UI: engine-rendering only, pending/empty/error, focus/keyboard/mobile/contrast/axe, truthful wording and screenshots. Later API: projection, transaction races, stored input fidelity, limits and synthetic-only roles.

Output severity-ordered findings: [blocker|major|minor] file:line, concrete problem, consequence, evidence/reproduction and suggested fix. End merge / merge after minor fixes / changes required, plus tests actually run and residual risks.

Do not edit, push, merge, post PR comments or mark review state unless explicitly instructed. No finding is better than invented stylistic objections; self-review is not independent review.
