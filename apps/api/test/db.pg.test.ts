import { inArray, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bookings } from "../src/db/schema.js";
import { seedRiverside } from "../src/seed/seed.js";
import { loadSnapshot } from "../src/snapshotLoader/loadSnapshot.js";
import { baseBooking, checkBookingExclusions } from "./helpers/bookingConstraints.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";
import { openPostgresTestDatabase } from "./helpers/postgresDatabase.js";

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
