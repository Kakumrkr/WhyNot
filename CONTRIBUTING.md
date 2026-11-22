# Contributing to WhyNot

Open an issue for a bug or proposal. For a scheduling bug, include the scenario or a minimal fictional snapshot, the request and clock used, and the expected and observed outcomes. Use synthetic data in issues, examples, and screenshots.

## Set up the project

Use Node 24.22.3 and pnpm 12.21.0. Follow the [runbook](docs/runbook.md) for static and full local setup.

```sh
pnpm install --frozen-lockfile
pnpm test:quick path/to/affected.test.ts
pnpm verify
```

## Open a pull request

- Explain the user-visible change and include the checks you ran. For UI changes, include a screenshot or reproduction steps.
- Keep scheduling decisions in the engine. Changes to rules or output should cover the affected case with a regression test. Update both staff and patient wording when a rule introduces new facts.
- If an expected result changes, describe the rule or contract change and show why the new result is correct.

[Architecture](docs/01-architecture.md) · [Integration guide](docs/integration.md) · [Testing guide](docs/06-testing-and-accuracy.md)
