import { performance } from "node:perf_hooks";
import {
  SimulationResponseSchema,
  simulationEvaluationLimit,
  type SimulationBody,
} from "@whynot/contracts/api";
import { buildMinimalRequest, buildMinimalSnapshot, buildRiverside } from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { evaluationRecord, syntheticHistoryPrefix } from "../src/db/evaluations.js";
import { policyVersion } from "../src/db/policyVersion.js";
import { evaluationInputs, policyVersions } from "../src/db/schema.js";
import { isoInstant } from "../src/http.js";
import { seedSnapshot } from "../src/seed/seed.js";
import { seedSyntheticHistory } from "../src/seed/syntheticHistory.js";
import { patient, staff } from "./helpers/api.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

const clock = demoClock();
const snapshot = buildMinimalSnapshot();
const window = { from: isoInstant(clock.now), to: isoInstant(clock.now + 1) };
const payload = {
  ...window,
  source: "live_demo",
  changes: [{ entity: "policy", field: "minNoticeMin", value: 60 }],
} satisfies SimulationBody;
const request = buildMinimalRequest({ start: clock.now + 60 });
const slot = evaluationRecord("slot", snapshot, {
  kind: "slot",
  request,
  options: { now: clock.now, trace: true, alternatives: false, includeAdminFix: false },
});
let connection: Awaited<ReturnType<typeof openPortableDatabase>>;
let isolated: Awaited<ReturnType<typeof openPortableDatabase>>;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  connection = await openPortableDatabase();
  isolated = await openPortableDatabase();
  await Promise.all([connection.migrate(), isolated.migrate()]);
  await Promise.all([
    seedSnapshot(connection.db, snapshot, clock),
    seedSnapshot(isolated.db, snapshot, clock),
  ]);
  app = createApp({ db: connection.db, scenarios: new Map([["H1", isolated.db]]) });
}, 20_000);
afterAll(async () => {
  await app?.close();
  await isolated?.close();
  await connection?.close();
});

function simulate(body: object = payload, headers = staff, scope = "/api") {
  return app.inject({ method: "POST", url: `${scope}/admin/simulate`, headers, payload: body });
}

it("uses the selected source and scope and never persists simulated changes", async () => {
  await connection.db.insert(evaluationInputs).values([
    { ...slot, durationMs: 0 },
    { ...slot, id: "old", engineVersion: "previous-engine", durationMs: 0 },
    { ...slot, id: "missing-options", options: {}, durationMs: 0 },
    { ...slot, id: "excluded-window", now: clock.now + 1, durationMs: 0 },
    { ...slot, id: "range", kind: "range", durationMs: 0 },
    { ...slot, id: `${syntheticHistoryPrefix}fixture`, durationMs: 0 },
  ]);
  const stored = await connection.db.select().from(evaluationInputs);
  const response = await simulate();
  expect(response.statusCode).toBe(200);
  expect(SimulationResponseSchema.parse(response.json())).toEqual({
    method: "independent_replay_estimate",
    window,
    source: "live_demo",
    total: 3,
    eligible: 1,
    newlyFeasible: 1,
    stillBlocked: 0,
    stillFeasible: 0,
    noLongerFeasible: 0,
    unsupported: 1,
    incomplete: 1,
    inapplicable: 0,
    nextCursor: null,
    examples: [{ start: isoInstant(request.start), before: "blocked", after: "bookable" }],
  });
  expect(await connection.db.select().from(evaluationInputs)).toEqual(stored);
  const synthetic = await simulate({ ...payload, source: "synthetic_history" });
  expect(SimulationResponseSchema.parse(synthetic.json())).toMatchObject({ total: 1, eligible: 1 });
  const scenario = await simulate(payload, staff, "/api/demo/H1");
  expect(SimulationResponseSchema.parse(scenario.json())).toMatchObject({ total: 0, eligible: 0 });
});

it("guards staff access and rejects invalid time windows and patches", async () => {
  const forbidden = await simulate(payload, patient());
  expect(forbidden.statusCode).toBe(403);
  for (const body of [
    { ...payload, to: window.from },
    { ...payload, from: "2026-11-16T09:00:01Z" },
    { ...payload, changes: [...payload.changes, ...payload.changes] },
    { ...payload, patientId: "patient-test" },
    { ...payload, cursor: { afterAt: window.to, afterId: "slot" } },
  ]) {
    expect((await simulate(body)).statusCode).toBe(400);
  }
});

it("completes seeded Riverside replay under the three-second demo target", async () => {
  await connection.db.insert(policyVersions).values(policyVersion(buildRiverside(clock.date)));
  await connection.db.transaction((tx) => seedSyntheticHistory(tx, clock));
  const started = performance.now();
  const response = await simulate({
    ...payload,
    from: isoInstant(clock.now - 14 * 1440),
    to: window.from,
    source: "synthetic_history",
  });
  const elapsed = performance.now() - started;
  expect(response.statusCode).toBe(200);
  expect(SimulationResponseSchema.parse(response.json())).toMatchObject({ total: 8, eligible: 8 });
  expect(elapsed).toBeLessThan(3_000);
});

it("caps each replay at two thousand and continues within the same minute", async () => {
  await isolated.db.insert(evaluationInputs).values({ ...slot, durationMs: 0 });
  await isolated.db.execute(sql`
    insert into evaluation_inputs (id, kind, snapshot, request, evaluated_at, options,
      input_version, schema_version, engine_version, policy_version_id, result, duration_ms)
    select 'copy-' || series, kind, '{}', '{}', evaluated_at, '{}',
      input_version, schema_version, engine_version, policy_version_id, '{}', duration_ms
    from evaluation_inputs cross join generate_series(1, ${simulationEvaluationLimit}::int) as series
    where id = 'slot'
  `);
  const response = await simulate(payload, staff, "/api/demo/H1");
  expect(response.statusCode).toBe(200);
  const first = SimulationResponseSchema.parse(response.json());
  expect(first).toMatchObject({
    total: simulationEvaluationLimit,
    incomplete: simulationEvaluationLimit,
  });
  if (first.nextCursor === null) throw new Error("Expected another page");
  const next = await simulate({ ...payload, cursor: first.nextCursor }, staff, "/api/demo/H1");
  expect(SimulationResponseSchema.parse(next.json())).toMatchObject({
    total: 1,
    eligible: 1,
    newlyFeasible: 1,
    nextCursor: null,
  });
});
