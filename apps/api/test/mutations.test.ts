import { BookingResponseSchema, PolicyListResponseSchema } from "@whynot/contracts/api";
import { evaluate } from "@whynot/engine";
import { buildMinimalRequest, buildMinimalSnapshot, riversideMinute } from "@whynot/fixtures";
import { eq, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { bookings, evaluationInputs } from "../src/db/schema.js";
import { results } from "../src/http.js";
import { seedRiverside, seedSnapshot } from "../src/seed/seed.js";
import { loadSnapshot } from "../src/snapshotLoader/loadSnapshot.js";
import { patient, staff, wireSlot } from "./helpers/api.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

describe("portable API mutations", () => {
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

  it("persists the reassessed assignment, projects booking conflicts and scopes soft cancellation", async () => {
    const fixture = buildMinimalSnapshot();
    fixture.patients.push({
      ...fixture.patients[0]!,
      id: "other-patient",
      displayName: "Other Patient",
    });
    const clock = demoClock();
    await seedSnapshot(connection.db, fixture, clock);
    app = createApp({ db: connection.db });
    const request = buildMinimalRequest();
    const create = (patientId: string) =>
      app.inject({
        method: "POST",
        url: "/api/bookings",
        headers: patient(patientId),
        payload: wireSlot({ ...request, patientId }),
      });
    const created = await create("patient-test");
    expect(created.statusCode).toBe(201);
    const booking = BookingResponseSchema.parse(created.json<unknown>());
    expect(booking).toEqual({
      id: expect.any(String),
      practitionerId: "practitioner-test",
      start: "2026-11-16T11:00:00Z",
      end: "2026-11-16T11:15:00Z",
    });
    const [stored, ...unexpected] = await connection.db.select().from(bookings);
    expect(unexpected).toEqual([]);
    expect(stored).toEqual({
      ...request,
      id: expect.any(String),
      cancellationId: booking.id,
      practitionerId: "practitioner-test",
      roomId: "room-test",
      equipmentId: null,
      end: request.start + 15,
      createdAt: clock.now,
      cancelledAt: null,
      status: "confirmed",
    });
    expect(booking.id).not.toBe(stored!.id);
    expect(created.body).not.toContain(stored!.id);
    const taken = await create("other-patient");
    expect(taken.statusCode).toBe(409);
    expect(results.patientSlotError.parse(taken.json<unknown>())).toMatchObject({
      error: { code: "booking_conflict", details: { evaluation: { status: "blocked" } } },
    });
    expect(taken.body).not.toContain(booking.id);
    expect(taken.body).not.toContain(stored!.id);
    expect(taken.body).not.toMatch(
      /patient-test|Other Patient|room-test|bookingId|roomId|equipmentId/u,
    );
    const url = `/api/bookings/${booking.id}`;
    const read = (headers: Record<string, string>, path = url) =>
      app.inject({ url: path, headers });
    for (const headers of [patient(), staff]) {
      const found = await read(headers);
      expect(found.statusCode).toBe(200);
      expect(BookingResponseSchema.parse(found.json<unknown>())).toEqual(booking);
    }
    expect((await read(patient("other-patient"))).statusCode).toBe(404);
    expect((await read(patient(), `/api/bookings/${stored!.id}`)).statusCode).toBe(404);
    const cancel = (headers: Record<string, string>, path = url) =>
      app.inject({ method: "DELETE", url: path, headers });
    const unowned = await cancel(patient("other-patient"));
    expect(unowned.statusCode).toBe(404);
    expect((await cancel(patient(), `/api/bookings/${stored!.id}`)).statusCode).toBe(404);
    expect(unowned.json()).toEqual(
      (await cancel(patient("other-patient"), "/api/bookings/missing")).json(),
    );
    expect((await cancel(patient())).statusCode).toBe(200);
    expect((await cancel(patient())).json()).toEqual({ status: "cancelled" });
    expect((await read(patient())).statusCode).toBe(404);
    expect(
      await connection.db
        .select({ status: bookings.status, cancelledAt: bookings.cancelledAt })
        .from(bookings),
    ).toEqual([{ status: "cancelled", cancelledAt: clock.now }]);
    const second = await create("other-patient");
    expect(second.statusCode).toBe(201);
    const other = BookingResponseSchema.parse(second.json<unknown>());
    expect((await cancel(staff, `/api/bookings/${other.id}`)).statusCode).toBe(200);
  });

  it("atomically activates an engine-validated policy version and captures both versions", async () => {
    const fixture = buildMinimalSnapshot();
    const clock = demoClock();
    await seedSnapshot(connection.db, fixture, clock);
    app = createApp({ db: connection.db });
    const url = "/api/admin/policies";
    const request = buildMinimalRequest({ start: clock.now + 60 });
    const changes = [{ entity: "policy", field: "minNoticeMin", value: 60 }];
    const apply = (payload: object, headers: Record<string, string> = staff) =>
      app.inject({ method: "POST", url, headers, payload });
    const list = async () =>
      PolicyListResponseSchema.parse((await app.inject({ url, headers: staff })).json<unknown>());
    expect((await app.inject({ url, headers: patient() })).statusCode).toBe(403);
    expect((await apply({ request: wireSlot(request), changes }, patient())).statusCode).toBe(403);
    expect(
      (
        await apply({
          request: wireSlot(request),
          changes: [{ entity: "service", id: "consult", field: "eligibility", value: "any" }],
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await apply({ request: wireSlot({ ...request, serviceId: "unknown" }), changes }))
        .statusCode,
    ).toBe(400);
    expect((await list()).versions).toHaveLength(1);
    expect(await connection.db.select().from(evaluationInputs)).toHaveLength(0);
    const original = await list();
    const applied = await apply({ request: wireSlot(request), changes });
    expect(applied.statusCode).toBe(201);
    const saved = results.policy.parse(applied.json<unknown>());
    expect(saved.baseline).toMatchObject({
      status: "blocked",
      meta: { policyVersionId: original.activeVersionId },
    });
    expect(saved.modified).toMatchObject({
      status: "bookable",
      meta: { policyVersionId: saved.activeVersionId },
    });
    const updated = await list();
    expect(updated.activeVersionId).toBe(saved.activeVersionId);
    expect(updated.versions).toHaveLength(2);
    expect(updated.versions).toContainEqual(original.versions[0]);
    expect(updated.versions).toContainEqual(
      expect.objectContaining({
        id: saved.activeVersionId,
        content: expect.objectContaining({ policy: expect.objectContaining({ minNoticeMin: 60 }) }),
      }),
    );
    const rows = await connection.db.select().from(evaluationInputs);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.result).toEqual(evaluate(row.snapshot, request, row.options));
      expect(row.policyVersionId).toBe(row.snapshot.policy.versionId);
    }
    expect(rows.map(({ result }) => result)).toEqual(
      expect.arrayContaining([saved.baseline, saved.modified]),
    );
    const booking = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: patient(),
      payload: wireSlot(request),
    });
    expect(booking.statusCode).toBe(201);
  });

  it("requires the reset flag and restores the fixture twice without rewriting history", async () => {
    const db = connection.db;
    await seedRiverside(db);
    const baseline = await db.transaction((tx) => loadSnapshot(tx));
    const readHistory = () => db.select().from(evaluationInputs).orderBy(evaluationInputs.id);
    const seededHistory = await readHistory();
    const url = "/api/demo/reset";
    app = createApp({ db, resetEnabled: false });
    expect((await app.inject({ method: "POST", url, headers: staff })).statusCode).toBe(404);
    await app.close();
    app = createApp({ db, resetEnabled: true });
    const seeded = baseline.snapshot.bookings[0]!;
    const cancelled = await app.inject({
      method: "DELETE",
      url: `/api/bookings/${seeded.id}`,
      headers: staff,
    });
    expect(cancelled.statusCode).toBe(200);
    const policy = await app.inject({
      method: "POST",
      url: "/api/admin/policies",
      headers: staff,
      payload: {
        request: wireSlot({
          patientId: "patient-0",
          serviceId: "consult",
          start: riversideMinute(0, "10:00"),
        }),
        changes: [{ entity: "policy", field: "minNoticeMin", value: 30 }],
      },
    });
    expect(policy.statusCode).toBe(201);
    const history = await readHistory();
    expect(history).toHaveLength(seededHistory.length + 2);
    expect(history).toEqual(expect.arrayContaining(seededHistory));
    const reset = (headers: Record<string, string> = staff, remoteAddress = "127.0.0.1") =>
      app.inject({ method: "POST", url, headers, remoteAddress });
    expect((await reset(patient(), "127.0.0.2")).statusCode).toBe(403);
    for (let count = 0; count < 2; count++) {
      const response = await reset();
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "reset" });
      expect(await db.transaction((tx) => loadSnapshot(tx))).toEqual(baseline);
    }
    expect((await reset()).statusCode).toBe(429);
    expect(await readHistory()).toEqual(history);
    const policies = PolicyListResponseSchema.parse(
      (await app.inject({ url: "/api/admin/policies", headers: staff })).json<unknown>(),
    );
    expect(policies.activeVersionId).toBe(baseline.snapshot.policy.versionId);
    expect(policies.versions).toHaveLength(2);
    const [row] = await db.select().from(bookings).where(eq(bookings.id, seeded.id));
    expect(row).toMatchObject({ status: "confirmed", cancelledAt: null });
  });
});
