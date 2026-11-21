# Playground runbook

WhyNot needs Node **24.22.3** and pnpm **12.21.0**. Use a clean checkout with access to the package registry or a populated pnpm store. Both modes use fictional data and a frozen clock. The static playground runs without an API or database.

## Run from a clean clone

```sh
git clone https://github.com/Kakumrkr/WhyNot.git
cd WhyNot
pnpm install --frozen-lockfile
pnpm build
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

## Run the full local application

After installing dependencies, copy `.env.example` to `.env`. Use these commands to start the disposable PostgreSQL 16 database and build and seed the API.

```sh
docker compose up -d --wait db
pnpm db:seed
pnpm --filter @whynot/narrator build
```

The seed applies migrations and initializes Riverside. Repeating it preserves bookings and the active policy. The base clock is fixed at 09:00 Europe/London on `DEMO_DATE`, which defaults to Monday, November 16, 2026. A new demo date needs a fresh database.

Start the API in one terminal and the web app in another.

~~~sh
pnpm --filter @whynot/api start
# In another terminal
pnpm dev:full
~~~

Open [the full local app](http://127.0.0.1:5173/). Vite proxies `/api` to Fastify on loopback port 8787. If Docker is unavailable, create an empty PostgreSQL 16 database with permission to create schemas and install `btree_gist`, then set `DATABASE_URL` to its local connection string before seeding and starting the API.

Choose **Riverside clinic** for the base schedule or select a curated scenario. The API initializes separate PostgreSQL schemas for the scenarios on first startup. Bookings are scoped to that selection and survive restarts. The booking panel keeps cancellation handles for the current browser tab until reload. Choose an available start, open **Book appointment**, then confirm. Cancel a booking from its receipt. **Patient** and **Staff** are fictional demo roles.

To enable **Reset demo data**, set `DEMO_RESET_ENABLED=true` in `.env` and restart the API. Staff can then restore the selected scope's initial bookings and active policy. To discard the entire disposable Compose demo database, run `docker compose down --volumes`, then start and seed it again.

### Verify full mode

Stop the manually started API and any preview on port 4174. With `DATABASE_URL` pointing to a fresh disposable database and Chromium installed, run the full browser check.

~~~sh
pnpm test:e2e:full
~~~

The command builds and seeds the API, builds the full-mode bundle, then starts the API and production preview for desktop and mobile tests. Full-mode assets go to `.tools/full-web/`. GitHub Pages uses the static build in `apps/web/dist/`.

`pnpm test:quick apps/api/test/db.test.ts apps/api/test/snapshot.test.ts` runs the portable checks with PGlite. Set `WHYNOT_TEST_DATABASE_URL` to a disposable PostgreSQL 16 database supporting `CREATE EXTENSION` and run `pnpm test:db:pg` for schema parity and cross-connection checks.
