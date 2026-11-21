import {
  ApiErrorSchema,
  InsightsResponseSchema,
  insightsEvaluationLimit,
} from "@whynot/contracts/api";
import { buildMinimalRequest, buildMinimalSnapshot } from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { evaluationRecord, syntheticHistoryPrefix } from "../src/db/evaluations.js";
import { evaluationInputs } from "../src/db/schema.js";
import { isoInstant } from "../src/http.js";
import { seedSnapshot } from "../src/seed/seed.js";
import { patient, staff, wireSlot } from "./helpers/api.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

const clock = demoClock();
const fixture = buildMinimalSnapshot();
const url = (from: string, to: string, prefix = "/api") =>
  `${prefix}/admin/insights?${new URLSearchParams({ from, to })}`;
const from = "2026-11-16T10:00:00+01:00";
const to = "2026-11-16T09:15:00Z";

function slot(id: string, start: number, includeAdminFix = true, snapshot = fixture) {
  return {
    ...evaluationRecord(id, snapshot, {
      kind: "slot",
      request: buildMinimalRequest({ start }),
      options: { now: clock.now, alternatives: false, trace: true, includeAdminFix },
    }),
    durationMs: 1,
  };
}

function range(id: string, now = clock.now) {
  return {
    ...evaluationRecord(id, fixture, {
      kind: "range",
      request: { patientId: "patient-test", serviceId: "consult", fromDate: clock.date, days: 1 },
      options: { now, searchDays: 0, budgetEvals: 40 },
    }),
    durationMs: 1,
  };
}

describe("staff descriptive insights", () => {
  let connection: Awaited<ReturnType<typeof openPortableDatabase>>;
  let isolated: Awaited<ReturnType<typeof openPortableDatabase>>;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    connection = await openPortableDatabase();
    isolated = await openPortableDatabase();
    await Promise.all([connection.migrate(), isolated.migrate()]);
    await seedSnapshot(connection.db, fixture, clock);
    app = createApp({ db: connection.db, scenarios: new Map([["H1", isolated.db]]) });
  }, 20_000);
  afterEach(async () => {
    await connection.db.execute(sql`truncate evaluation_inputs`);
  });
  afterAll(async () => {
    await app?.close();
    await isolated?.close();
    await connection?.close();
  });

  it("counts selected rules once per slot and separates sources, range requests, and fix evidence", async () => {
    const capture = await app.inject({
      method: "POST",
      url: "/api/explain",
      headers: staff,
      payload: { request: wireSlot(buildMinimalRequest()), options: { alternatives: false } },
    });
    expect(capture.statusCode).toBe(200);

    const practitioner = fixture.practitioners[0]!;
    const unavailable = buildMinimalSnapshot({
      practitioners: [
        { ...practitioner, workingHours: [], skills: [] },
        { ...practitioner, id: "practitioner-second", workingHours: [], skills: [] },
      ],
    });
    const hours = slot("hours", clock.now + 120, true, unavailable);
    if (hours.result.status !== "blocked") throw new Error("Expected both practitioners blocked");
    expect(hours.result.explanation.primary).toHaveLength(2);
    expect(
      hours.result.explanation.facts.filter((fact) => fact.ruleId === "practitioner-skill"),
    ).toHaveLength(2);

    const notice = slot("verified-notice", clock.now + 60);
    const unchecked = slot("unchecked-notice", clock.now + 60, false);
    await connection.db
      .insert(evaluationInputs)
      .values([
        notice,
        unchecked,
        hours,
        { ...unchecked, id: "legacy-notice", options: {} },
        slot("invalid", clock.now + 121),
        { ...notice, id: "unreadable", result: "old result" },
        range("live-range"),
        { ...notice, id: `${syntheticHistoryPrefix}first`, engineVersion: "old-demo-version" },
        { ...notice, id: `${syntheticHistoryPrefix}repeat` },
        range(`${syntheticHistoryPrefix}range`),
        { ...notice, id: "before-from", now: clock.now - 1 },
        { ...notice, id: "at-to", now: clock.now + 15 },
      ]);

    const response = await app.inject({ url: url(from, to), headers: staff });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(InsightsResponseSchema.parse(response.json<unknown>())).toEqual({
      status: "ok",
      window: { from, to },
      sources: [
        {
          source: "live_demo",
          rangeEvaluations: 1,
          slots: {
            total: 7,
            bookable: 1,
            blocked: 4,
            invalid: 1,
            unreadable: 1,
            blockedShare: { denominator: 5, fraction: 0.8 },
          },
          reportedPrimaryRules: {
            denominator: 4,
            counts: [
              { ruleId: "min-notice", count: 3 },
              { ruleId: "practitioner-hours", count: 1 },
            ],
          },
          verifiedFixFeasibility: { denominator: 2, feasible: 1 },
        },
        {
          source: "synthetic_history",
          rangeEvaluations: 1,
          slots: {
            total: 2,
            bookable: 0,
            blocked: 2,
            invalid: 0,
            unreadable: 0,
            blockedShare: { denominator: 2, fraction: 1 },
          },
          reportedPrimaryRules: { denominator: 2, counts: [{ ruleId: "min-notice", count: 2 }] },
          verifiedFixFeasibility: { denominator: 2, feasible: 2 },
        },
      ],
    });
    const scoped = await app.inject({ url: url(from, to, "/api/demo/H1"), headers: staff });
    expect(scoped.statusCode).toBe(200);
    expect(InsightsResponseSchema.parse(scoped.json<unknown>()).status).toBe("empty");
  });

  it("distinguishes an empty window from a window with only range requests", async () => {
    const read = async () => {
      const response = await app.inject({ url: url(from, to), headers: staff });
      expect(response.statusCode).toBe(200);
      return InsightsResponseSchema.parse(response.json<unknown>());
    };
    const emptySource = {
      rangeEvaluations: 0,
      slots: {
        total: 0,
        bookable: 0,
        blocked: 0,
        invalid: 0,
        unreadable: 0,
        blockedShare: { denominator: 0, fraction: null },
      },
      reportedPrimaryRules: { denominator: 0, counts: [] },
      verifiedFixFeasibility: { denominator: 0, feasible: 0 },
    };
    const sources = [
      { ...emptySource, source: "live_demo" },
      { ...emptySource, source: "synthetic_history" },
    ];
    expect(await read()).toEqual({ status: "empty", window: { from, to }, sources });
    await connection.db.insert(evaluationInputs).values(range("range-only", clock.now + 14));
    expect(await read()).toEqual({
      status: "ok",
      window: { from, to },
      sources: [{ ...sources[0], rangeEvaluations: 1 }, sources[1]],
    });
  });

  it("requires a staff demo role and a strictly ordered minute-precision window", async () => {
    for (const [headers, status, code] of [
      [{}, 400, "invalid_request"],
      [patient(), 403, "forbidden"],
    ] as const) {
      const result = await app.inject({ url: url(from, to), headers });
      expect(result.statusCode).toBe(status);
      expect(ApiErrorSchema.parse(result.json<unknown>()).error.code).toBe(code);
    }
    for (const path of [
      "/api/admin/insights",
      url(to, from),
      url(from, isoInstant(clock.now)),
      url("2026-11-16T09:00:01Z", to),
      url("2026-11-16T09:00:00", to),
      `${url(from, to)}&from=${encodeURIComponent(from)}`,
      `${url(from, to)}&patientId=patient-test`,
    ]) {
      const result = await app.inject({ url: path, headers: staff });
      expect(result.statusCode).toBe(400);
      expect(ApiErrorSchema.parse(result.json<unknown>()).error.code).toBe("invalid_request");
    }
  });

  it("returns exact counts at the record limit and an explicit result above it", async () => {
    await connection.db.insert(evaluationInputs).values(range("range-seed"));
    const copies = insightsEvaluationLimit - 1;
    await connection.db.execute(sql`
      insert into evaluation_inputs (id, kind, snapshot, request, evaluated_at, options,
        input_version, schema_version, engine_version, policy_version_id, result, duration_ms)
      select 'range-copy-' || series, kind, snapshot, request, evaluated_at, options,
        input_version, schema_version, engine_version, policy_version_id, '{}', duration_ms
      from evaluation_inputs cross join generate_series(1, ${copies}::int) as series
      where id = 'range-seed'
    `);
    const exact = await app.inject({ url: url(from, to), headers: staff });
    expect(exact.statusCode).toBe(200);
    expect(InsightsResponseSchema.parse(exact.json<unknown>())).toMatchObject({
      status: "ok",
      sources: [{ rangeEvaluations: insightsEvaluationLimit }, { rangeEvaluations: 0 }],
    });
    await connection.db.insert(evaluationInputs).values(range("range-extra"));
    const limited = await app.inject({ url: url(from, to), headers: staff });
    expect(limited.statusCode).toBe(200);
    expect(InsightsResponseSchema.parse(limited.json<unknown>())).toEqual({
      status: "limit_exceeded",
      window: { from, to },
      maxEvaluations: insightsEvaluationLimit,
    });
  });
});
