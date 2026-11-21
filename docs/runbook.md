# Static playground runbook

WhyNot needs Node **24.22.3** and pnpm **12.21.0**. Use a clean checkout with access to the package registry or a populated pnpm store. The playground uses fictional data and a frozen clock. It requires no configuration, credentials, account, API or database.

## Run from a clean clone

```sh
git clone https://github.com/Kakumrkr/WhyNot.git
cd WhyNot
pnpm install --frozen-lockfile
pnpm dev
```

Open [the local development URL](http://127.0.0.1:5173/). To check the same files a static host serves, stop the dev server and run:

```sh
pnpm build
pnpm --filter @whynot/web exec vite preview --host 127.0.0.1 --port 4173 --strictPort
```

Open [the local production preview](http://127.0.0.1:4173/). The deployable files are in `apps/web/dist/`. Assets use relative paths so the same build works at the Pages repository path. Serve the directory over HTTP or HTTPS.

## Run the release checks

| Check                                  | Command                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| Format, lint, types, tests and build   | `pnpm verify`                                                |
| Chromium setup                         | `pnpm --filter @whynot/web exec playwright install chromium` |
| Built desktop/mobile, axe and keyboard | `pnpm --filter @whynot/web test:e2e` after `pnpm verify`     |
| Properties at 5,000 cases each         | `pnpm test:deep`                                             |
| S/M/L timings                          | `pnpm bench` on an otherwise idle machine                    |
| Independent packed consumer            | `pnpm exec node examples/node/verify-packages.mjs`           |

On Linux, use Playwright's `--with-deps` installation option when Chromium's system libraries are missing. Stop a manually started preview before the browser suite, which starts its own on port 4173. The packed consumer installs the archives in a temporary project outside the checkout. Build before running it. The benchmark enforces absolute S targets and compares against the committed baseline when hardware and runtime match. Keep the baseline when recording new measurements.

## Inspect the public deployment

The **Playground Pages** workflow deploys `apps/web/dist/` from `main`. At the public URL, open the H1 Staff link at desktop and mobile widths, expand a candidate matrix, and switch to Patient. Verify the inspector disappears and the patient selection survives reload. Confirm the JavaScript and CSS load from `/WhyNot/`. Check the deployment's source commit when distinguishing a fresh release from the previous live build. [Public playground](https://kakumrkr.github.io/WhyNot/?scenarioId=H1&audience=staff)

If the app or assets fail to load, inspect the run's build and deploy jobs and reproduce from a locked install and production preview. Fix source or workflow defects on a PR. The Pages workflow also supports a manual run on `main` for a transient deployment failure.

Open **Synthetic snapshot files** to try the fictional Harbor example. Use **Reset imported snapshot** to return to the current curated selection. Import reads only a local UTF-8 JSON envelope. The export button downloads that envelope and its frozen clock. [Example snapshot](../examples/node/snapshot.json) · [Import limits](integration.md#use-snapshot-files-in-the-playground)
