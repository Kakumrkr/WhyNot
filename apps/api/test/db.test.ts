import { buildRiverside } from "@whynot/fixtures";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_NOW } from "../src/clock/demoClock.js";
import { policyVersion } from "../src/db/policyVersion.js";
import {
  bookings,
  clinics,
  evaluationInputs,
  policyVersions,
  referrals,
} from "../src/db/schema.js";
import { seedRiverside } from "../src/seed/seed.js";
import { baseBooking, checkBookingExclusions } from "./helpers/bookingConstraints.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

describe("portable PostgreSQL schema", () => {
  let connection: Awaited<ReturnType<typeof openPortableDatabase>>;

  beforeAll(async () => {
    connection = await openPortableDatabase();
    await connection.migrate();
    await seedRiverside(connection.db);
  }, 20_000);
  afterAll(async () => connection?.close());

  it("reapplies migrations without changing the seeded database", async () => {
    const before = await connection.db.select().from(clinics);
    await connection.migrate();
    expect(before.map(({ id }) => id)).toEqual(["riverside"]);
    expect(await connection.db.select().from(clinics)).toEqual(before);
  });

  it("enforces half-open physical overlaps independently for each confirmed resource", async () => {
    await checkBookingExclusions(connection.db);
  });

  it("rejects broken references, nonpositive intervals and inconsistent cancellation", async () => {
    const { db } = connection;
    await expect(
      db.insert(referrals).values({ patientId: "patient-0", serviceId: "missing" }),
    ).rejects.toMatchObject({ cause: { code: "23503" } });
    await expect(
      db.insert(bookings).values({ ...baseBooking, id: "backward", start: baseBooking.end }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });
    await expect(
      db.insert(bookings).values({ ...baseBooking, id: "cancelled", status: "cancelled" }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });
  });

  it("stores one valid active pointer and protects both kinds of historical data", async () => {
    const { db } = connection;
    const [initial] = await db.select().from(clinics);
    if (initial === undefined) throw new Error("Expected the seeded clinic");
    await expect(db.insert(clinics).values({ ...initial, id: "other" })).rejects.toMatchObject({
      cause: { code: "23505" },
    });
    await expect(
      db.insert(clinics).values({ ...initial, singleton: false, id: "other" }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });
    await expect(
      db.update(clinics).set({ activePolicyVersionId: "missing" }),
    ).rejects.toMatchObject({ cause: { code: "23503" } });

    const snapshot = buildRiverside();
    const version = policyVersion(snapshot);
    await db.insert(policyVersions).values({ ...version, id: "next-version" });
    await db.update(clinics).set({ activePolicyVersionId: "next-version" });
    expect((await db.select().from(clinics)).map((clinic) => clinic.activePolicyVersionId)).toEqual(
      ["next-version"],
    );
    await expect(
      db
        .update(policyVersions)
        .set({ content: version.content })
        .where(eq(policyVersions.id, version.id)),
    ).rejects.toMatchObject({ cause: { code: "55000" } });
    await expect(
      db.delete(policyVersions).where(eq(policyVersions.id, version.id)),
    ).rejects.toMatchObject({ cause: { code: "55000" } });

    await db.insert(evaluationInputs).values({
      id: "evaluation-test",
      kind: "slot",
      snapshot,
      request: { patientId: "patient-0" },
      now: DEMO_NOW,
      options: { now: DEMO_NOW },
      inputVersion: 1,
      schemaVersion: 1,
      engineVersion: "test-version",
      policyVersionId: version.id,
      result: { kind: "test-only" },
      durationMs: 1.5,
    });
    await expect(db.update(evaluationInputs).set({ durationMs: 2 })).rejects.toMatchObject({
      cause: { code: "55000" },
    });
    await expect(db.delete(evaluationInputs)).rejects.toMatchObject({ cause: { code: "55000" } });
  });

  it("serializes overlapping transaction calls on the portable connection", async () => {
    const order: string[] = [];
    const first = connection.db.transaction(
      async (tx) => {
        order.push("first entered");
        await tx.execute(sql`select 1`);
        order.push("first finished");
      },
      { isolationLevel: "serializable" },
    );
    const second = connection.db.transaction(
      async (tx) => {
        order.push("second entered");
        await tx.execute(sql`select 1`);
        order.push("second finished");
      },
      { isolationLevel: "serializable" },
    );
    await Promise.all([first, second]);
    expect(order).toEqual(["first entered", "first finished", "second entered", "second finished"]);
  });
});
