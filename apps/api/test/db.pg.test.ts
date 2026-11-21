import { InsightsResponseSchema } from "@whynot/contracts/api";
import { inArray, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { demoClock } from "../src/clock/demoClock.js";
import { connectPostgres } from "../src/db/database.js";
import { bookings, evaluationInputs } from "../src/db/schema.js";
import { isoInstant, results } from "../src/http.js";
import { seedRiverside } from "../src/seed/seed.js";
import { loadSnapshot } from "../src/snapshotLoader/loadSnapshot.js";
import { staff } from "./helpers/api.js";
import { baseBooking, checkBookingExclusions } from "./helpers/bookingConstraints.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";
import { openPostgresTestDatabase } from "./helpers/postgresDatabase.js";

it("preserves configured connection options and enforces the scoped search path", async () => {
  const connectionString = process.env.WHYNOT_TEST_DATABASE_URL;
  if (!connectionString) throw new Error("Set WHYNOT_TEST_DATABASE_URL for real PostgreSQL tests");
  const configured = new URL(connectionString);
  configured.searchParams.set("options", "-c statement_timeout=5000 -c search_path=public");
  const connection = connectPostgres(configured.href, "-c search_path=pg_catalog");
  try {
    const { rows } = await connection.db.execute(sql`
      select current_setting('statement_timeout') as timeout, current_schema() as schema
    `);
    expect(rows).toEqual([{ timeout: "5s", schema: "pg_catalog" }]);
  } finally {
    await connection.close();
  }
});

describe("real PostgreSQL persistence", () => {
  let connection: Awaited<ReturnType<typeof openPostgresTestDatabase>>;

  beforeEach(async () => {
    connection = await openPostgresTestDatabase();
    await connection.migrate();
  }, 20_000);
  afterEach(async () => connection?.close());

  it("matches the portable columns and constraints; repeated migrations preserve the schema", async () => {
    const portable = await openPortableDatabase();
    try {
      await portable.migrate();
      await connection.migrate();
      const columns = sql`
        select table_name, column_name, udt_name, is_nullable
        from information_schema.columns
        where table_schema = current_schema() and table_name <> '__drizzle_migrations'
        order by table_name, ordinal_position`;
      const constraints = sql`
        select table_info.relname, constraint_info.conname, constraint_info.contype
        from pg_constraint constraint_info
        join pg_class table_info on table_info.oid = constraint_info.conrelid
        where constraint_info.connamespace = current_schema()::regnamespace
          and constraint_info.contype <> 'n' and table_info.relname <> '__drizzle_migrations'
        order by table_info.relname, constraint_info.conname`;
      const actualColumns = (await connection.db.execute(columns)).rows;
      expect(actualColumns.length).toBeGreaterThan(50);
      expect(actualColumns).toEqual((await portable.db.execute(columns)).rows);
      expect((await connection.db.execute(constraints)).rows).toEqual(
        (await portable.db.execute(constraints)).rows,
      );
      expect(await seedRiverside(portable.db)).toBe("seeded");
      expect(await seedRiverside(connection.db)).toBe("seeded");
      expect(await connection.db.transaction((tx) => loadSnapshot(tx))).toEqual(
        await portable.db.transaction((tx) => loadSnapshot(tx)),
      );
    } finally {
      await portable.close();
    }
  }, 20_000);

  it("enforces the confirmed exclusion constraints on PostgreSQL", async () => {
    await seedRiverside(connection.db);
    await checkBookingExclusions(connection.db);
  });

  it("seeds immutable replay inputs once across competing PostgreSQL transactions", async () => {
    const db = connection.db;
    const outcomes = await Promise.all([seedRiverside(db), seedRiverside(db)]);
    expect(outcomes.sort()).toEqual(["already_seeded", "seeded"]);
    const rows = await db.select().from(evaluationInputs);
    expect(rows).toHaveLength(12);
    const app = createApp({ db });
    try {
      for (const kind of ["slot", "range"] as const) {
        const row = rows.find((entry) => entry.kind === kind)!;
        const response = await app.inject({
          url: `/api/admin/evaluations/${row.id}/trace`,
          headers: staff,
        });
        expect(response.statusCode).toBe(200);
        expect(results.evaluationTrace.parse(response.json<unknown>())).toMatchObject({
          kind,
          source: "synthetic_history",
          evaluation: row.result,
        });
      }
      const { now } = demoClock();
      const query = new URLSearchParams({ from: isoInstant(now - 14 * 1440), to: isoInstant(now) });
      const response = await app.inject({ url: `/api/admin/insights?${query}`, headers: staff });
      expect(response.statusCode).toBe(200);
      expect(InsightsResponseSchema.parse(response.json<unknown>())).toMatchObject({
        status: "ok",
        sources: [
          { source: "live_demo", rangeEvaluations: 0, slots: { total: 0 } },
          { source: "synthetic_history", rangeEvaluations: 4, slots: { total: 8 } },
        ],
      });
      const firstWeek = now - 14 * 1440;
      const lastId = rows
        .filter((row) => row.now === firstWeek)
        .map((row) => row.id)
        .sort()
        .at(-1)!;
      query.set("afterAt", isoInstant(firstWeek));
      query.set("afterId", lastId);
      const next = await app.inject({ url: `/api/admin/insights?${query}`, headers: staff });
      expect(next.statusCode).toBe(200);
      expect(InsightsResponseSchema.parse(next.json<unknown>())).toMatchObject({
        status: "ok",
        sources: [
          { source: "live_demo", rangeEvaluations: 0, slots: { total: 0 } },
          { source: "synthetic_history", rangeEvaluations: 2, slots: { total: 4 } },
        ],
        nextCursor: null,
      });
    } finally {
      await app.close();
    }
  });

  it("allows only one overlapping insert across separate PostgreSQL connections", async () => {
    await seedRiverside(connection.db);
    const start = baseBooking.start + 1440;
    const raceIds = ["race-one", "race-two"];
    const pids = new Set<number>();
    let release: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const results = await Promise.allSettled(
      raceIds.map((id) =>
        connection.db.transaction(async (tx) => {
          const { rows } = await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`);
          pids.add(rows[0]!.pid);
          if (pids.size === 2) release();
          await ready;
          await tx.insert(bookings).values({ ...baseBooking, id, start, end: start + 30 });
        }),
      ),
    );
    expect(pids.size).toBe(2);
    expect(results.map(({ status }) => status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(results.find(({ status }) => status === "rejected")).toMatchObject({
      // GiST can report an exclusion violation or abort a deadlocked contender.
      reason: { cause: { code: expect.stringMatching(/^(23P01|40P01)$/) } },
    });
    expect(
      await connection.db
        .select({ id: bookings.id })
        .from(bookings)
        .where(inArray(bookings.id, raceIds)),
    ).toHaveLength(1);
  });
});
