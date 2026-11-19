# WhyNot playground

- Follow the repository rules and [design system](../../docs/design/design-system.md).
- Keep bundled fixtures in the static adapter. Return projected patient results before rendering and keep engine decisions in the engine.
- Keep URL state limited to validated curated selections. Use component state for synchronous interactions.
- Run `pnpm --filter @whynot/web exec playwright install chromium` once for the pinned browser revision. Run `pnpm test:e2e` from the repository root to build and test the production bundle.
