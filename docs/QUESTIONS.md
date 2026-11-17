# QUESTIONS

Record unresolved material ambiguity here instead of inventing architecture, rule semantics or expectations. Resolve through an approved doc 08 decision and update affected specs/cards/skills together.

## Open

None.

Add new items here as `### Q-<card>-<slug>` with the question, options considered and what work is blocked. Move them to Resolved as one line once a decision closes them.

## Resolved

- Q-1.6-PERF (S isBookable benchmark gate failing on CI runners): resolved by D-067–D-070 with final source dc35f9c; the CI-runner variance that caused it is handled by D-071.
- Q-1: resolved by D-043 (pinned compatible toolchain). D-060/D-062 record Zod type-library adjustments; D-061 the end-only midnight boundary.

## Planning resolutions — 2026-11-16

| ID    | Issue                                                          | Resolution                                                                        | Decision |
| ----- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| R-001 | Static demo/staff work delayed by DB and AI                    | Engine/playground first; P/H/A follow-ons                                         | D-050    |
| R-002 | Runtime timings violate deterministic purity                   | External wrappers; frozen injected clock                                          | D-051    |
| R-003 | Partial search described as no openings                        | Finite-domain completion/budget/window metadata and truthful copy                 | D-051    |
| R-004 | Empty pools yield no explanation                               | resource-missing structural basis; no fake assignments                            | D-052    |
| R-005 | H1 opening conflicts with fully blocked H11                    | Isolated named snapshot overrides and scenario hand-checks                        | D-052    |
| R-006 | Deleting violations does not verify setting changes            | Apply typed concrete patches and re-evaluate                                      | D-053    |
| R-007 | Redaction drops necessary facts or leaks references            | Distinct patient schema, allowlists, replacements, complete remapping             | D-054    |
| R-008 | End-of-session state and pushes ambiguous                      | Checkpoint commits, mandatory verified push, separate implementation/review/merge | D-055    |
| R-009 | Heuristic prose checks cannot prove meaning                    | Templates first, explicit later AI decision/eval                                  | D-056    |
| R-010 | Reusable package adoption unspecified                          | Clean own-data Node example, package validation, bounded synthetic import         | D-057    |
| R-011 | Historical settings cannot be reconstructed from current state | Immutable full input bundles and explicit unsupported versions                    | D-058    |
| R-012 | Skills/agents tied to old roadmap                              | Eight scoped skills, optional reviewer roles, just-in-time capability checks      | D-059    |

## Workflow maintenance resolution — 2026-11-16

Q-AUTO-1 is withdrawn: the user cancelled cloud automation and scheduling. No executor or schedule was activated. D-064 (now streamlined by D-071) covers session completion and recovery; there is no remaining cloud setup blocker.
