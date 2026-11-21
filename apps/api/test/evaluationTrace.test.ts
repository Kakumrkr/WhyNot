import { ApiErrorSchema, evaluationIdHeader } from "@whynot/contracts/api";
import { engineVersion } from "@whynot/engine";
import { buildMinimalRequest, buildMinimalSnapshot, buildRiverside } from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { evaluationRecord } from "../src/db/evaluations.js";
import { policyVersion } from "../src/db/policyVersion.js";
import * as tables from "../src/db/schema.js";
import { isoInstant, results } from "../src/http.js";
import { riversideSearchCoverage } from "../src/seed/searchCoverage.js";
import { seedRiverside, seedSnapshot } from "../src/seed/seed.js";
import { patient, staff, wireSlot } from "./helpers/api.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

const clock = demoClock();
const tracePath = (id: string) => `/admin/evaluations/${id}/trace`;
const origin = "http://127.0.0.1:5173";

function captureId(response: { headers: Record<string, unknown> }) {
  const id = response.headers[evaluationIdHeader];
  if (typeof id !== "string") throw new Error("Expected a staff evaluation ID");
  return id;
}

describe("staff historical replay", () => {
  let connection: Awaited<ReturnType<typeof openPortableDatabase>>;
  let app: ReturnType<typeof createApp> | undefined;

  beforeAll(async () => {
    connection = await openPortableDatabase();
    await connection.migrate();
  }, 20_000);
  afterEach(async () => {
    await app?.close();
    app = undefined;
    await connection.db.execute(
      sql`truncate clinics, policy_versions, practitioners, rooms, equipment, services, patients cascade`,
    );
  });
  afterAll(async () => connection?.close());

  it("replays both kinds from their captured state after live inputs and clock change", async () => {
    const { db } = connection;
    const fixture = buildMinimalSnapshot();
    await seedSnapshot(db, fixture, clock);
    const api = (app = createApp({ db, allowedOrigins: [origin] }));
    const request = buildMinimalRequest();
    const slot = () =>
      api.inject({
        method: "POST",
        url: "/api/explain",
        headers: { ...staff, origin },
        payload: { request: wireSlot(request), options: { alternatives: false } },
      });
    const range = () =>
      api.inject({
        method: "POST",
        url: "/api/explain-range",
        headers: staff,
        payload: {
          request: {
            patientId: request.patientId,
            serviceId: request.serviceId,
            fromDate: clock.date,
            days: 1,
          },
          options: { searchDays: 1, budgetEvals: 4 },
        },
      });
    const originalSlot = await slot();
    const originalRange = await range();
    expect([originalSlot.statusCode, originalRange.statusCode]).toEqual([200, 200]);
    expect(originalSlot.headers["access-control-expose-headers"]).toContain(evaluationIdHeader);
    const savedSlot = results.staffSlot.parse(originalSlot.json<unknown>());
    const savedRange = results.staffRange.parse(originalRange.json<unknown>());
    expect(savedSlot).toMatchObject({ status: "bookable", meta: { evaluatedAt: clock.now } });
    expect(savedRange).toMatchObject({ status: "has_availability" });

    const changed = buildMinimalSnapshot();
    changed.policy = { ...changed.policy, versionId: "current-policy", minNoticeMin: 240 };
    changed.services[0]!.eligibility = "returning_only";
    await db.transaction(async (tx) => {
      await tx.insert(tables.policyVersions).values(policyVersion(changed));
      await tx.update(tables.clinics).set({
        activePolicyVersionId: changed.policy.versionId,
        demoNow: clock.now + 15,
        openingHours: [{ weekday: 1, from: "12:00", to: "15:00" }],
      });
      await tx.update(tables.patients).set({ isReturning: false });
      await tx.update(tables.services).set({ durationMin: 30 });
      await tx.insert(tables.practitionerTimeOff).values({
        id: "current-leave",
        practitionerId: "practitioner-test",
        from: clock.now + 120,
        to: clock.now + 600,
        reason: "Fictional leave",
      });
    });
    expect(results.staffSlot.parse((await slot()).json<unknown>())).toMatchObject({
      status: "blocked",
    });
    expect(results.staffRange.parse((await range()).json<unknown>())).toMatchObject({
      status: "fully_blocked",
    });
    const rowCount = (
      await db.select({ id: tables.evaluationInputs.id }).from(tables.evaluationInputs)
    ).length;
    const replay = async (response: { headers: Record<string, unknown> }) => {
      const id = captureId(response);
      const reply = await api.inject({ url: `/api${tracePath(id)}`, headers: staff });
      expect(reply.statusCode).toBe(200);
      expect(reply.headers["cache-control"]).toBe("no-store");
      const decoded = results.evaluationTrace.parse(reply.json<unknown>());
      expect(decoded).toMatchObject({
        id,
        source: "live_demo",
        evaluatedAt: isoInstant(clock.now),
        engineVersion,
      });
      return decoded;
    };
    expect(await replay(originalSlot)).toMatchObject({
      kind: "slot",
      evaluation: {
        ...savedSlot,
        trace: {
          candidates: [{ assignment: { practitionerId: "practitioner-test" }, factIds: [] }],
        },
      },
    });
    expect(await replay(originalRange)).toMatchObject({ kind: "range", evaluation: savedRange });
    expect(
      await db.select({ id: tables.evaluationInputs.id }).from(tables.evaluationInputs),
    ).toHaveLength(rowCount);
  });

  it("preserves a captured slot trace and its bounded search options", async () => {
    const { db } = connection;
    await seedSnapshot(db, buildMinimalSnapshot(), clock);
    const api = (app = createApp({ db }));
    const request = buildMinimalRequest({ start: clock.now + 15 });
    const capture = await api.inject({
      method: "POST",
      url: "/api/explain",
      headers: staff,
      payload: {
        request: wireSlot(request),
        options: {
          trace: true,
          alternatives: { max: 1, searchDays: 0, budgetEvals: 2 },
          includeAdminFix: false,
        },
      },
    });
    expect(capture.statusCode).toBe(200);
    const original = results.staffSlot.parse(capture.json<unknown>());
    expect(original).toMatchObject({
      status: "blocked",
      search: { status: "budget_exhausted", evaluated: 2 },
      adminFix: null,
      trace: {
        alternatives: expect.arrayContaining([
          { request: expect.any(Object), bookable: expect.any(Boolean) },
        ]),
      },
    });
    const replay = await api.inject({
      url: `/api${tracePath(captureId(capture))}`,
      headers: staff,
    });
    expect(replay.statusCode).toBe(200);
    expect(results.evaluationTrace.parse(replay.json<unknown>()).evaluation).toEqual(original);
  });

  it("guards the staff lookup and returns explicit failures for unavailable or partial evidence", async () => {
    const { db } = connection;
    const fixture = buildMinimalSnapshot();
    await seedSnapshot(db, fixture, clock);
    const api = (app = createApp({ db }));
    const request = buildMinimalRequest();
    const record = evaluationRecord("complete", fixture, {
      kind: "slot",
      request,
      options: { now: clock.now, trace: false, alternatives: false, includeAdminFix: false },
    });
    const partialOptions = { now: clock.now, trace: false, includeAdminFix: false };
    await db.insert(tables.evaluationInputs).values([
      { ...record, durationMs: 1 },
      { ...record, durationMs: 1, id: "engine-unavailable", engineVersion: "unavailable" },
      { ...record, durationMs: 1, id: "legacy-version", inputVersion: 2 },
      {
        ...record,
        durationMs: 1,
        id: "missing-coverage",
        snapshot: sql`${JSON.stringify(fixture)}::jsonb - 'coverage'`,
      },
      { ...record, durationMs: 1, id: "missing-options", options: partialOptions },
      { ...record, durationMs: 1, id: "inconsistent-clock", now: clock.now + 15 },
      {
        ...record,
        durationMs: 1,
        id: "narrowed-coverage",
        snapshot: { ...fixture, coverage: { from: fixture.coverage.from, to: request.start } },
      },
    ]);

    const patientSlot = await api.inject({
      method: "POST",
      url: "/api/explain",
      headers: patient(),
      payload: { request: wireSlot(request) },
    });
    expect(patientSlot.statusCode).toBe(200);
    expect(patientSlot.headers[evaluationIdHeader]).toBeUndefined();
    const patientRange = await api.inject({
      method: "POST",
      url: "/api/explain-range",
      headers: patient(),
      payload: {
        request: {
          patientId: request.patientId,
          serviceId: request.serviceId,
          fromDate: clock.date,
          days: 1,
        },
      },
    });
    expect(patientRange.statusCode).toBe(200);
    expect(patientRange.headers[evaluationIdHeader]).toBeUndefined();
    for (const [id, headers, status, code] of [
      ["complete", patient(), 403, "forbidden"],
      ["absent", patient(), 403, "forbidden"],
      ["complete", {}, 400, "invalid_request"],
      ["absent", staff, 404, "not_found"],
      ["engine-unavailable", staff, 409, "unsupported_version"],
      ["legacy-version", staff, 409, "incomplete_evidence"],
      ["missing-coverage", staff, 409, "incomplete_evidence"],
      ["missing-options", staff, 409, "incomplete_evidence"],
      ["inconsistent-clock", staff, 409, "incomplete_evidence"],
      ["narrowed-coverage", staff, 409, "incomplete_evidence"],
    ] as const) {
      const response = await api.inject({ url: `/api${tracePath(id)}`, headers });
      expect(response.statusCode, id).toBe(status);
      expect(ApiErrorSchema.parse(response.json<unknown>()).error.code).toBe(code);
    }
  });

  it("backfills deterministic synthetic history without exposing it in another scope", async () => {
    const { db } = connection;
    const baseline = buildRiverside(clock.date);
    await seedSnapshot(db, baseline, clock, riversideSearchCoverage(baseline, clock.now));
    expect(await db.select().from(tables.evaluationInputs)).toEqual([]);
    expect(await seedRiverside(db)).toBe("already_seeded");
    const rows = () =>
      db.select().from(tables.evaluationInputs).orderBy(tables.evaluationInputs.id);
    const history = await rows();
    expect(history.filter(({ kind }) => kind === "slot")).toHaveLength(8);
    expect(history.filter(({ kind }) => kind === "range")).toHaveLength(4);
    expect(new Set(history.map(({ now }) => now)).size).toBe(2);
    expect(history.every(({ now, durationMs }) => now < clock.now && durationMs === 0)).toBe(true);
    expect(await seedRiverside(db)).toBe("already_seeded");
    expect(await rows()).toEqual(history);

    const isolated = await openPortableDatabase();
    try {
      await isolated.migrate();
      const api = (app = createApp({ db, scenarios: new Map([["H1", isolated.db]]) }));
      for (const row of history) {
        const response = await api.inject({ url: `/api${tracePath(row.id)}`, headers: staff });
        expect(response.statusCode, row.id).toBe(200);
        expect(results.evaluationTrace.parse(response.json<unknown>())).toMatchObject({
          kind: row.kind,
          source: "synthetic_history",
          evaluation: row.result,
        });
      }
      const seeded = await api.inject({
        url: `/api/demo/H1${tracePath(history[0]!.id)}`,
        headers: staff,
      });
      expect(seeded.statusCode).toBe(404);
      await api.close();
      app = undefined;

      expect(await seedRiverside(isolated.db)).toBe("seeded");
      expect(
        await isolated.db
          .select()
          .from(tables.evaluationInputs)
          .orderBy(tables.evaluationInputs.id),
      ).toEqual(history);
    } finally {
      await app?.close();
      app = undefined;
      await isolated.close();
    }
  }, 20_000);
});
