---
name: whynot-review
description: Independently review a WhyNot session PR against its active card, specification and verification evidence, in a fresh context. Findings only; no edits unless explicitly requested. Includes the correctness and UX checklists used at gate cards.
---

# Fresh-context review

Read AGENTS.md, the selected card and its required docs. Inspect the diff against the actual base (`git diff origin/main...HEAD` or the PR base). Archived cards and PROGRESS history are not authoritative; do not reread them.

Check exact Build and exclusions, public schema/behavior compatibility, canonical/pure/time/privacy invariants, real patch verification, search completeness and scenario isolation. Look for missing-resource, DST, equal-tie and redaction/reference bugs.

Tests must prove acceptance and be independent: no weakened goldens, skips, lower run counts in code, optimized/reference coupling, mock engine or unmeasured baseline updates. Check clean consumer exports when relevant.

Use PR CI as evidence for format/lint/types/tests/build. Rerun locally only what you need to confirm a suspected finding (targeted tests), not the full gate. Record the reviewed head SHA. A later commit that changes source behavior needs a quick re-review of that delta only; documentation/handoff/formatting commits do not.

## Correctness checklist (cards 1.6, 2.3, 4.1, 4.3, 5.2)

Challenge weighted hitting-set sufficiency/irredundancy/ties, missing-resource structural cases, independence of the reference checker, time boundaries, search metadata, actually applied policy patches and privacy/reference integrity. Use whynot-engine and whynot-testing guidance. Confirm the milestone Deep verification run (5000 properties + benchmark) is green where the card requires it.

## UX checklist (cards 3.3, 4.4, 5.2; any UI card when relevant)

UI renders engine output only; pending/empty/error states; real patient/staff browser journeys; actionable and truthful copy, incomplete-search wording, policy hypotheses; focus/keyboard/mobile (1280/390)/contrast/axe; screenshots in the PR. Later API: projection, transaction races, stored input fidelity, limits and synthetic-only roles.

## Output

Severity-ordered findings: [blocker|major|minor] file:line, concrete problem, consequence, evidence/reproduction and suggested fix. End with: merge / merge after minor fixes / changes required, plus what you actually ran and residual risks.

Do not edit, push, merge, post PR comments or mark review state unless explicitly instructed. No finding is better than invented stylistic objections; self-review is not independent review.
