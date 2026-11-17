# QUESTIONS

Record unresolved material ambiguity here instead of inventing architecture, rule semantics or expectations. Resolve through an approved doc 08 decision and update affected specs/cards/skills together.

## Open blockers

### Q-1.6-PERF — CI boolean performance gate (resolved 2026-11-17)

Session 1.6 checkpoint aff537f passes full local/CI correctness verification, but
both CI runs 44113600174 and 44113724924 fail the unchanged 2 ms S isBookable
benchmark gate. The first Linux report measures 3.95 ms p95 on AMD EPYC 7763,
versus 1.78 ms on the recorded Windows CPU. Profiling identifies repeated booking
date conversion; D-067 and PROGRESS record the correction and increased warm-up.
Keep all targets, 300 timed samples and 5000-run properties. Continue the same
card through measured repair, refreshed exact-head review and green CI; this is
not an external blocker and does not release Session 2.1. Resolve only after a
passing corrected-head Linux benchmark and committed matching baseline.

Resolved by D-067/D-068/D-069/D-070 and final-source dc35f9c: both CI runs
44126309537 and 44126295724 passed the full 164-test, 5000-run gate and unchanged
S benchmarks on EPYC 7763. isBookable p95 was 1.5709/1.6523 ms; evaluate was
4.2578/4.3076 ms. baseline-linux.json records the first report, matching flags
and exact source/run provenance; baseline-win32.json records the isolated local
report. Current-head CI, independent review and merge/main evidence remain
separate completion gates in PROGRESS and PR #12.

None for Session 1.5. Q-1.5-WRITE is resolved by the user's GitHub installation access update, confirmed by successful branch push and PR #10 creation. Q-1 is resolved by D-043 (pinned compatible toolchain); MIT owner identity confirmed from GitHub. D-060/D-062 record the type-library adjustments required by Zod declarations. D-061's end-only midnight boundary is implemented by local calendar arithmetic. Deferred design/DB/model/hosting decisions belong to their named sessions in doc 08; they do not block request-rule work.

### Q-1.5-WRITE — GitHub connection rejects writes (resolved 2026-11-17)

- Repository reads and clone succeed; authenticated account is Kakumrkr and repository metadata reports push permission.
- Pushing session/1.5-feasibility fails: `remote: Permission to Kakumrkr/WhyNot.git denied to Kakumrkr` (HTTP 403). An explicit GitHub CLI credential-helper retry fails identically.
- The connected GitHub app also rejects creation of the session branch with `403 Resource not accessible by integration`. No remote branch or PR was created; no merge or CI success is claimed.
- Reconnect GitHub with repository write access, then resume the same card at the publication phase. Do not change implementation semantics, bypass protections, push directly to main or start 1.6. Local verification/review and the exact checkpoint are recorded in PROGRESS and the final response.
- Resolution: after the user changed the GitHub app's repository access, native Git successfully pushed session/1.5-feasibility at 35f8b63dab0d11e636b3b4d67164d5ad75de3e96. Remote HEAD matched local HEAD, and [PR #10](https://github.com/Kakumrkr/WhyNot/pull/10) was created. Earlier failures above are historical; CI/review/merge evidence is tracked in PROGRESS and the PR.

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

Q-AUTO-1 is withdrawn: the user cancelled cloud automation and scheduling. No executor or schedule was activated. D-064 retains session completion, failure recovery, review, merge monitoring and handoff requirements; there is no remaining cloud setup blocker.
