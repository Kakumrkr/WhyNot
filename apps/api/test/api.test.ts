import { Writable } from "node:stream";
import type { BookingRequest } from "@whynot/contracts";
import { AvailabilityResponseSchema, ClinicResponseSchema } from "@whynot/contracts/api";
import {
  engineVersion,
  evaluate,
  explainRange,
  isBookable,
  projectForAudience,
} from "@whynot/engine";
import {
  buildMinimalRequest,
  buildMinimalSnapshot,
  buildRiverside,
  buildScenario,
  riversideMinute,
} from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { DEMO_DATE, demoClock } from "../src/clock/demoClock.js";
import { evaluationInputs } from "../src/db/schema.js";
import { results } from "../src/http.js";
import { seedRiverside, seedSnapshot } from "../src/seed/seed.js";
import { patient, staff, wireSlot } from "./helpers/api.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

const slots: [string, string, number, string, string?, string?][] = [
  ["H1", "minor-procedure", 1, "14:30"],
  ["H2", "ultrasound", 3, "10:00"],
  ["H3", "consult", 0, "10:00"],
  ["H4", "physio-follow-up", 2, "11:00", "patient-1"],
  ["H5", "physio-assessment", 2, "16:00"],
  ["H6", "dressing", 1, "11:00"],
  ["H7", "consult", 2, "09:00", "patient-0", "okafor"],
  ["H8", "bloods", 1, "11:00"],
];
const ranges = [
  {
    id: "H9",
    patientId: "patient-1",
    serviceId: "ultrasound",
    fromDate: "2026-11-16",
    days: 5,
    now: riversideMinute(0, "06:00"),
  },
  {
    id: "H10",
    patientId: "patient-0",
    serviceId: "consult",
    practitionerId: "okafor",
    fromDate: "2026-11-20",
    days: 1,
    now: riversideMinute(3, "09:00"),
  },
  {
    id: "H11",
    patientId: "patient-0",
    serviceId: "minor-procedure",
    fromDate: "2026-11-17",
    days: 1,
    now: riversideMinute(1, "08:30"),
  },
];

describe("portable API reads", () => {
  let connection: Awaited<ReturnType<typeof openPortableDatabase>>;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    connection = await openPortableDatabase();
    await connection.migrate();
  }, 20_000);
  afterEach(async () => {
    await app?.close();
    await connection.db.execute(
      sql`truncate clinics, policy_versions, practitioners, rooms, equipment, services, patients cascade`,
    );
  });
  afterAll(async () => connection?.close());

  it.each(slots)(
    "matches isolated slot scenario %s and stores its exact replay input",
    async (id, serviceId, day, time, patientId = "patient-0", practitionerId) => {
      const fixture = buildScenario(id);
      const clock = demoClock();
      await seedSnapshot(connection.db, fixture, clock);
      app = createApp({ db: connection.db });
      const request: BookingRequest = {
        patientId,
        serviceId,
        start: riversideMinute(day, time),
        ...(practitionerId === undefined ? {} : { practitionerId }),
      };
      const staffResponse = await app.inject({
        method: "POST",
        url: "/api/explain",
        headers: staff,
        payload: { request: wireSlot(request), options: { trace: true } },
      });
      const patientResponse = await app.inject({
        method: "POST",
        url: "/api/explain",
        headers: patient(patientId),
        payload: { request: wireSlot(request) },
      });
      expect([staffResponse.statusCode, patientResponse.statusCode]).toEqual([200, 200]);
      const expectedStaff = evaluate(fixture, request, { now: clock.now, trace: true });
      const expectedPatient = projectForAudience(
        evaluate(fixture, request, { now: clock.now }),
        "patient",
        { requesterPatientId: patientId },
      );
      expect(expectedStaff.status).toBe("blocked");
      expect(results.staffSlot.parse(staffResponse.json<unknown>())).toEqual(expectedStaff);
      expect(results.patientSlot.parse(patientResponse.json<unknown>())).toEqual(expectedPatient);
      for (const denied of [
        ...fixture.bookings.map(({ id }) => id),
        ...fixture.patients.flatMap(({ id, displayName }) => [id, displayName]),
        ...fixture.practitioners.flatMap(({ timeOff }) => timeOff.map(({ reason }) => reason)),
      ]) {
        expect(patientResponse.body).not.toContain(JSON.stringify(denied));
      }
      expect(patientResponse.body).not.toMatch(
        /"(?:bookingId|roomId|equipmentId|trace|adminFix)"/u,
      );
      const rows = await connection.db.select().from(evaluationInputs);
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row).toMatchObject({
          kind: "slot",
          request,
          now: clock.now,
          inputVersion: 1,
          schemaVersion: 1,
          engineVersion,
          policyVersionId: fixture.policy.versionId,
        });
        expect(row.snapshot.coverage).toEqual(fixture.coverage);
        expect(row.snapshot.bookings).toEqual(expect.arrayContaining(fixture.bookings));
        expect(row.snapshot.patients).toEqual(expect.arrayContaining(fixture.patients));
        expect(row.durationMs).toBeGreaterThanOrEqual(0);
        expect(row.result).toEqual(evaluate(row.snapshot, row.request, row.options));
      }
      expect(rows.map(({ result }) => result)).toContainEqual(expectedStaff);
    },
  );

  it.each(ranges)(
    "matches isolated range scenario $id, including its frozen clock",
    async ({ id, now, ...request }) => {
      const fixture = buildScenario(id);
      await seedSnapshot(connection.db, fixture, { date: DEMO_DATE, now });
      app = createApp({ db: connection.db });
      const url = "/api/explain-range";
      const staffResponse = await app.inject({
        method: "POST",
        url,
        headers: staff,
        payload: { request },
      });
      const patientResponse = await app.inject({
        method: "POST",
        url,
        headers: patient(request.patientId),
        payload: { request },
      });
      expect([staffResponse.statusCode, patientResponse.statusCode]).toEqual([200, 200]);
      const full = explainRange(fixture, request, { now });
      expect(full.status).toBe("fully_blocked");
      expect(results.staffRange.parse(staffResponse.json<unknown>())).toEqual(full);
      expect(results.patientRange.parse(patientResponse.json<unknown>())).toEqual(
        projectForAudience(full, "patient", { requesterPatientId: request.patientId }),
      );
      expect(patientResponse.body).not.toMatch(
        /"(?:patientId|bookingId|reason|roomId|equipmentId|trace|adminFix)"/u,
      );
      expect(patientResponse.body).toMatch(/"memberStarts":\["2026-/u);
      const rows = await connection.db.select().from(evaluationInputs);
      expect(rows).toHaveLength(2);
      for (const row of rows)
        expect(row).toMatchObject({
          kind: "range",
          request,
          options: { now, searchDays: 14, budgetEvals: 3000 },
          result: full,
        });
    },
  );

  it("serves the public clinic configuration and real local-grid projections", async () => {
    await seedRiverside(connection.db);
    app = createApp({ db: connection.db });
    expect((await app.inject("/api/health")).json()).toEqual({ status: "ok" });
    const response = await app.inject("/api/clinic");
    const clinic = ClinicResponseSchema.parse(response.json<unknown>());
    expect(clinic).toMatchObject({
      demoDate: DEMO_DATE,
      now: "2026-11-16T09:00:00Z",
      clinic: { name: "Riverside Family Clinic" },
    });
    expect(response.body).not.toContain("patient-");
    const base = buildRiverside();
    const url = "/api/availability?patientId=patient-0&serviceId=consult&date=2026-11-16";
    const reply = await app.inject({ url, headers: patient("patient-0") });
    expect(reply.statusCode).toBe(200);
    const { starts } = AvailabilityResponseSchema.parse(reply.json<unknown>());
    expect(starts).toEqual(
      Array.from({ length: 40 }, (_, index) => {
        const minutes = 8 * 60 + index * 15;
        const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
        const request = {
          start: riversideMinute(0, time),
          patientId: "patient-0",
          serviceId: "consult",
        };
        return {
          start: `2026-11-16T${time}:00+00:00`,
          time,
          available: isBookable(base, request, demoClock().now),
        };
      }),
    );
    expect(starts.some(({ available }) => available)).toBe(true);
  });

  it("rejects bad inputs and roles without echoing user values or logging payloads", async () => {
    await seedSnapshot(connection.db, buildMinimalSnapshot(), demoClock());
    let logs = "";
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        logs += chunk.toString();
        callback();
      },
    });
    app = createApp({ db: connection.db, logger: { stream } });
    const request = wireSlot(buildMinimalRequest());
    const url = "/api/explain";
    const send = (payload: object, headers = patient()) =>
      app.inject({ method: "POST", url, headers, payload });
    const malformed = await app.inject({
      method: "POST",
      url,
      headers: { ...patient(), "content-type": "application/json" },
      payload: "{private-marker",
    });
    expect(malformed.statusCode).toBe(400);
    expect(
      (await send({ request: { ...request, start: request.start.slice(0, -1) } })).statusCode,
    ).toBe(400);
    expect(
      (await send({ request: { ...request, start: "2026-11-16T11:00:01Z" } })).statusCode,
    ).toBe(400);
    expect((await send({ request, options: { now: demoClock().now } })).statusCode).toBe(400);
    expect((await send({ request, options: { trace: true } })).statusCode).toBe(403);
    expect((await send({ request }, patient("other-patient"))).statusCode).toBe(403);
    expect(
      (await send({ request }, { ...patient(), "x-demo-role": "staff, patient" })).statusCode,
    ).toBe(400);
    expect((await app.inject({ method: "POST", url, payload: { request } })).statusCode).toBe(400);
    const unknown = await send({ request: { ...request, serviceId: "private-marker" } });
    expect(unknown.statusCode).toBe(400);
    expect(results.patientSlotError.parse(unknown.json<unknown>())).toMatchObject({
      error: {
        code: "invalid_request",
        details: {
          evaluation: {
            status: "invalid_request",
            errors: [{ code: "unknown_reference", field: "serviceId" }],
          },
        },
      },
    });
    expect(
      await connection.db.select({ result: evaluationInputs.result }).from(evaluationInputs),
    ).toEqual([{ result: expect.objectContaining({ status: "invalid_request" }) }]);
    for (const reply of [
      unknown,
      malformed,
      await app.inject("/private-marker"),
      await app.inject({ method: "DELETE", url: "/api/bookings/%private-marker", headers: staff }),
    ]) {
      expect(reply.body).not.toContain("private-marker");
      expect(reply.json()).toMatchObject({ error: { code: expect.any(String) } });
    }
    expect(logs).not.toMatch(/private-marker|patient-test/u);
  });

  it("enforces body size, per-client request rate and explicit CORS", async () => {
    app = createApp({ db: connection.db, allowedOrigins: ["http://127.0.0.1:5173"] });
    const origin = "http://127.0.0.1:5173";
    const accepted = await app.inject({
      method: "OPTIONS",
      url: "/api/explain",
      headers: { origin, "access-control-request-method": "POST" },
    });
    expect(accepted.statusCode).toBe(204);
    expect(accepted.headers["access-control-allow-origin"]).toBe(origin);
    expect(accepted.headers["access-control-allow-headers"]).toContain("x-demo-role");
    const denied = await app.inject({
      method: "POST",
      url: "/api/explain",
      headers: { origin: "https://example.invalid" },
      payload: {},
    });
    expect(denied.statusCode).toBe(403);
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    const oversized = await app.inject({
      method: "POST",
      url: "/api/explain",
      payload: { request: "x".repeat(33 * 1024) },
    });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json()).toMatchObject({ error: { code: "payload_too_large" } });
    for (let count = 0; count < 120; count++)
      expect(
        (await app.inject({ url: "/api/health", remoteAddress: "127.0.0.2" })).statusCode,
      ).toBe(200);
    const limited = await app.inject({
      url: "/api/health",
      remoteAddress: "127.0.0.2",
      headers: { "x-forwarded-for": "127.0.0.3" },
    });
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBeDefined();
    expect(limited.json()).toMatchObject({ error: { code: "rate_limited" } });
    expect((await app.inject({ url: "/api/health", remoteAddress: "127.0.0.3" })).statusCode).toBe(
      200,
    );
  });
});
