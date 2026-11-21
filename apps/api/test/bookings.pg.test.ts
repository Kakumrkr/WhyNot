import { setTimeout } from "node:timers/promises";
import type { ClinicSnapshot } from "@whynot/contracts";
import { evaluate } from "@whynot/engine";
import { buildMinimalRequest, buildMinimalSnapshot } from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { bookings } from "../src/db/schema.js";
import { results } from "../src/http.js";
import { seedSnapshot } from "../src/seed/seed.js";
import { patient, wireSlot } from "./helpers/api.js";
import { openPostgresTestDatabase } from "./helpers/postgresDatabase.js";

type PostgresDatabase = Awaited<ReturnType<typeof openPostgresTestDatabase>>["db"];

async function concurrentWrites<T>(
  db: PostgresDatabase,
  expectedWaiting: number,
  run: () => Promise<T>,
) {
  let contenders: Promise<T> | undefined;
  try {
    await db.transaction(async (tx) => {
      // Readers can take their snapshots while writes wait, including for non-overlapping slots.
      await tx.execute(sql`lock table bookings in share mode`);
      contenders = run();
      const deadline = performance.now() + 5000;
      let waiting: number;
      do {
        const { rows } = await tx.execute<{ waiting: number }>(sql`
          select count(*)::integer as waiting from pg_locks
          where relation = 'bookings'::regclass and mode = 'RowExclusiveLock' and not granted
        `);
        waiting = rows[0]!.waiting;
        if (waiting >= expectedWaiting) break;
        await setTimeout(20);
      } while (performance.now() < deadline);
      expect(waiting).toBeGreaterThanOrEqual(expectedWaiting);
    });
  } finally {
    // Finish outstanding inject calls after releasing the test lock, even if coordination fails.
    await contenders;
  }
  if (contenders === undefined) throw new Error("Contenders were not started");
  return contenders;
}

describe("real PostgreSQL booking API races", () => {
  let connection: Awaited<ReturnType<typeof openPostgresTestDatabase>>;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    connection = await openPostgresTestDatabase();
    await connection.migrate();
    app = createApp({ db: connection.db });
  }, 20_000);
  afterEach(async () => {
    await app?.close();
    await connection?.close();
  });

  const clock = demoClock();
  const post = (start: number, patientId = "patient-test") =>
    app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: patient(patientId),
      payload: wireSlot({ start, patientId, serviceId: "consult" }),
    });

  it("returns exactly one 201 and nine projected 409s for the sole assignment", async () => {
    const fixture = buildMinimalSnapshot();
    fixture.policy.patientMaxBookingsPerDay = 10;
    await seedSnapshot(connection.db, fixture, clock);
    const { start } = buildMinimalRequest();
    const replies = await concurrentWrites(connection.db, 9, () =>
      Promise.all(Array.from({ length: 10 }, () => post(start))),
    );
    const successful = replies.filter(({ statusCode }) => statusCode === 201);
    expect(successful).toHaveLength(1);
    const [row] = await connection.db.select().from(bookings);
    expect(row).toMatchObject({ start, end: start + 15, status: "confirmed" });
    expect(await connection.db.select().from(bookings)).toHaveLength(1);
    for (const reply of replies.filter(({ statusCode }) => statusCode !== 201)) {
      expect(reply.statusCode).toBe(409);
      expect(results.patientSlotError.parse(reply.json<unknown>())).toMatchObject({
        error: { code: "booking_conflict", details: { evaluation: { status: "blocked" } } },
      });
      expect(reply.body).not.toContain(row!.id);
    }
  }, 20_000);

  it("bounds retries and reports contention when a fresh evaluation is still bookable", async () => {
    const db = connection.db;
    await seedSnapshot(db, buildMinimalSnapshot(), clock);
    await db.execute(sql`create sequence booking_retry_attempts`);
    await db.execute(sql`
      create function force_booking_retry() returns trigger language plpgsql as $$
      begin
        perform nextval('booking_retry_attempts');
        raise exception 'synthetic serialization retry' using errcode = '40001';
      end;
      $$
    `);
    await db.execute(sql`
      create trigger force_booking_retry before insert on bookings
      for each row execute function force_booking_retry()
    `);
    const response = await post(buildMinimalRequest().start);
    expect(response.statusCode).toBe(409);
    expect(results.patientSlotError.parse(response.json<unknown>())).toMatchObject({
      error: { code: "contended", details: { evaluation: { status: "bookable" } } },
    });
    expect(response.body).not.toContain("synthetic serialization retry");
    expect(await db.select().from(bookings)).toHaveLength(0);
    const { rows } = await db.execute(
      sql`select last_value::integer as attempts from booking_retry_attempts`,
    );
    expect(rows).toEqual([{ attempts: 4 }]);
  });

  it.each([
    [
      "practitioner-buffer",
      15,
      (snapshot: ClinicSnapshot) => {
        snapshot.services[0]!.bufferAfterMin = 15;
      },
    ],
    [
      "room-turnover",
      15,
      (snapshot: ClinicSnapshot) => {
        snapshot.services[0]!.roomTurnoverMin = 15;
      },
    ],
    [
      "practitioner-daily-cap",
      120,
      (snapshot: ClinicSnapshot) => {
        snapshot.practitioners[0]!.dailyCap = 1;
      },
    ],
  ] as const)(
    "keeps %s intact across concurrently attempted disjoint physical occupancy",
    async (rule, gap, setPolicy) => {
      const fixture = buildMinimalSnapshot();
      fixture.patients.push({ ...fixture.patients[0]!, id: "patient-two" });
      setPolicy(fixture);
      const first = buildMinimalRequest();
      const second = { ...first, start: first.start + gap, patientId: "patient-two" };
      expect(evaluate(fixture, first, { now: clock.now }).status).toBe("bookable");
      expect(evaluate(fixture, second, { now: clock.now }).status).toBe("bookable");
      await seedSnapshot(connection.db, fixture, clock);
      const replies = await concurrentWrites(connection.db, 2, () =>
        Promise.all([post(first.start, first.patientId), post(second.start, second.patientId)]),
      );
      expect(replies.map(({ statusCode }) => statusCode).sort()).toEqual([201, 409]);
      const [stored, ...unexpected] = await connection.db.select().from(bookings);
      expect(unexpected).toEqual([]);
      const failed = replies.find(({ statusCode }) => statusCode === 409)!;
      const retry = failed === replies[0] ? first : second;
      const expected = evaluate(
        {
          ...fixture,
          bookings: [
            {
              id: stored!.id,
              start: stored!.start,
              end: stored!.end,
              status: "confirmed",
              practitionerId: stored!.practitionerId,
              roomId: stored!.roomId,
              serviceId: stored!.serviceId,
              patientId: stored!.patientId,
            },
          ],
        },
        retry,
        { now: clock.now },
      );
      expect(expected).toMatchObject({
        status: "blocked",
        explanation: { facts: expect.arrayContaining([expect.objectContaining({ ruleId: rule })]) },
      });
      expect(results.patientSlotError.parse(failed.json<unknown>())).toMatchObject({
        error: { code: "booking_conflict", details: { evaluation: { status: "blocked" } } },
      });
    },
    20_000,
  );
});
