# Session 0.1 evidence

Branch: `session/0.1-foundation`; [PR #2](https://github.com/Kakumrkr/WhyNot/pull/2).
Initial stable checkpoint: `17360aefbe8abaf8ee82e4913672551710035771`.
Final HEAD is recorded in the PR and session response.

- Node 24.22.3 LTS and pnpm 12.21.0 used locally; exact compatible dependency pins in D-043 and lockfile. Machine Node 20 was not used for verification.
- `pnpm install`: passed; `pnpm install --frozen-lockfile`: second install passed.
- `pnpm verify`: format, lint, strict source/test/config types, tests and all package/web builds passed. After review fixes: 5 files, 49 tests (45 lint samples plus 4 native ESM built-entry smoke tests).
- Native smoke imports run through each package name in a fresh Node ESM process after library compilation, so missing/incorrect built export paths fail. Skeletons intentionally export no domain behavior.
- Boundary samples reject engine I/O, globals, randomness, cross-layer imports, production test/generator dependencies, provider/server/Node browser imports, environment access/aliases, any, focused/skipped/todo helpers including destructuring. Allowed relative imports, contracts, time-only Luxon, test-only fixtures and static-adapter fixture runtime are checked too.
- [Initial CI run](https://github.com/Kakumrkr/WhyNot/actions/runs/43957545990): clean Ubuntu frozen install and full verify succeeded with `FC_NUM_RUNS=5000`. Properties are introduced with domain features; no fake property suite is claimed here. Final-head CI remains pending until recorded below.
- `git diff --check`: passed before initial checkpoint. Local/remote checkpoint SHA matched.
- MIT copyright owner Rama Kakumani verified using the repository owner's GitHub profile API (`Kakumrkr`).
- [Built-page screenshot](session-0.1.png): headless Chrome at 1280x800, served with Vite preview. Visually inspected: heading, fictional/synthetic disclosure and under-construction text render. Browser suites/axe begin in 3.1.

Fresh-task whynot-review independently ran the initial full gate and reproduced three enforcement/coverage gaps: import.meta destructuring, test modifier destructuring and source-only smoke imports. The implementation now rejects meta aliases and skipped helper destructuring, adds regression samples and imports compiled package exports using native Node. Follow-up independent review and final CI are pending.

No domain contracts/rules, API/DB/Docker/provider settings, design system, benchmark or e2e placeholder commands were added. No existing goldens or property counts were changed. No material unresolved questions.
