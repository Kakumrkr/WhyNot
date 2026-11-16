---
name: whynot-ui
description: Build WhyNot static playground and later full-mode UI, including explanations, inspector, policy previews, range states, accessible design and browser verification.
---

# UI

Read docs 00/01/04/05 and active card. Use ui-ux-pro-max for visual decisions; verify availability before owning UI work. Design tokens are established in 3.1 at docs/design/design-system.md, reused thereafter. No old 4.1 dependencies.

UI renders engine output; no computing/filtering/reordering reasons, alternatives or policy fixes. Patient components receive projected output only. Staff inspector gets explicit trace, not unguarded raw data on patient surfaces.

Static first: synchronous browser adapter with React state is sufficient. Introduce TanStack Query for real async HTTP state in P5; no premature API requirement. One semantic adapter boundary, no divergent rules by mode.

Frozen clock, fictional-data disclosure, curated scenario URLs, source template. No AI wording verified badge or provider dependency in first release. Alternative selection evaluates a changed request; static UI never claims persistent confirmation.

Imports are bounded schema-validated synthetic JSON in memory. No upload/logging/localStorage/payload URL; safe text rendering; explicit reset. Policy preview copies scenario state and shows actual before/after result; no auto apply or clinical recommendation.

Every async view has pending/empty/error/success; synchronous views handle validation/failure honestly. Explain budget/window limits; range labels describe starts, not a continuous booking.

Keyboard reachable controls, visible focus, proper dialog return focus/aria-live, status not color-only, text contrast >=4.5:1, semantic tables/labels and large touch targets. Use browser checks at 1280/390 widths and axe (no serious/critical findings). Capture UI evidence in PR; screenshots capability need not be a separate skill.

Preserve static mode after full adapter arrives. No state library beyond TanStack Query without decision.
