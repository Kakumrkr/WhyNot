import type { Booking, ClinicSnapshot } from "@whynot/contracts";
import {
  buildMinimalSnapshot,
  buildRiverside,
  buildScenario,
  demoNow,
  riversideMinute,
} from "@whynot/fixtures";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { DEMO_DATE, DEMO_NOW, demoClock } from "../src/clock/demoClock.js";
import { seedRiverside, seedSnapshot } from "../src/seed/seed.js";
import { loadSnapshot } from "../src/snapshotLoader/loadSnapshot.js";
import { openPortableDatabase } from "./helpers/portableDatabase.js";

function canonical(snapshot: ClinicSnapshot): ClinicSnapshot {
  const compare = (a: { id: string }, b: { id: string }) =>
    a.id < b.id ? -1 : Number(a.id > b.id);
  return {
    ...snapshot,
    practitioners: [...snapshot.practitioners].sort(compare),
    rooms: [...snapshot.rooms].sort(compare),
    equipment: [...snapshot.equipment].sort(compare),
    services: [...snapshot.services].sort(compare),
    patients: [...snapshot.patients].sort(compare),
    bookings: [...snapshot.bookings].sort(compare),
  };
}

describe("Riverside seed and snapshot loader", () => {
  let connection: Awaited<ReturnType<typeof openPortableDatabase>>;

  beforeAll(async () => {
    connection = await openPortableDatabase();
    await connection.migrate();
  }, 20_000);
  afterEach(async () => {
    await connection.db.execute(
      sql`truncate clinics, policy_versions, practitioners, rooms, equipment, services, patients cascade`,
    );
  });
  afterAll(async () => connection?.close());

  const read = (window?: ClinicSnapshot["coverage"]) =>
    connection.db.transaction((tx) => loadSnapshot(tx, window), {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });

  it("seeds the base clinic once and round-trips all engine inputs", async () => {
    expect(await seedRiverside(connection.db)).toBe("seeded");
    const first = await read();
    expect(first).toEqual({ snapshot: canonical(buildRiverside()), clock: demoClock() });
    expect(await seedRiverside(connection.db)).toBe("already_seeded");
    expect(await read()).toEqual(first);
    await expect(seedRiverside(connection.db, demoClock("2026-11-23"))).rejects.toThrow(
      "different demo clinic or clock",
    );
    expect(await read()).toEqual(first);
  });

  it.each(["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11"])(
    "round-trips the isolated %s overrides",
    async (scenario) => {
      const fixture = buildScenario(scenario);
      await seedSnapshot(connection.db, fixture, demoClock());
      expect((await read()).snapshot).toEqual(canonical(fixture));
    },
  );

  it("keeps long prior occupancy and future starts within the active buffer beyond coverage", async () => {
    const input = buildMinimalSnapshot();
    input.services[0]!.roomTurnoverMin = 120;
    const window = { from: riversideMinute(1, "00:00"), to: riversideMinute(2, "00:00") };
    const base: Booking = {
      id: "prior",
      patientId: "patient-test",
      practitionerId: "practitioner-test",
      roomId: "room-test",
      serviceId: "consult",
      status: "confirmed",
      start: window.from - 4_000,
      end: window.from - 30,
    };
    input.bookings = [
      base,
      { ...base, id: "future", start: window.to + 30, end: window.to + 60 },
      { ...base, id: "outside", start: window.to + 120, end: window.to + 150 },
    ];
    await seedSnapshot(connection.db, input, demoClock());
    const { snapshot } = await read(window);
    expect(snapshot.coverage).toEqual(window);
    expect(snapshot.bookings).toEqual([input.bookings[1], input.bookings[0]]);
    expect(snapshot.services[0]?.roomTurnoverMin).toBe(120);
  });

  it("retains starts on the full clinic date so a narrow window preserves daily caps", async () => {
    const input = buildMinimalSnapshot();
    const start = riversideMinute(0, "18:00");
    input.bookings = [
      {
        id: "evening-booking",
        patientId: "patient-test",
        practitionerId: "practitioner-test",
        roomId: "room-test",
        serviceId: "consult",
        status: "confirmed",
        start,
        end: start + 15,
      },
    ];
    await seedSnapshot(connection.db, input, demoClock());
    const { snapshot } = await read({
      from: riversideMinute(0, "11:00"),
      to: riversideMinute(0, "12:00"),
    });
    expect(snapshot.bookings).toEqual(input.bookings);
  });

  it("rejects bad references atomically and refuses to invent coverage", async () => {
    const invalid = buildRiverside();
    invalid.bookings[0]!.patientId = "missing";
    await expect(seedSnapshot(connection.db, invalid, demoClock())).rejects.toThrow(
      "Unknown patients reference",
    );
    await expect(read()).rejects.toThrow("has not been seeded");
    expect(await seedRiverside(connection.db)).toBe("seeded");
    const { coverage } = (await read()).snapshot;
    await expect(read({ ...coverage, from: coverage.from - 1 })).rejects.toThrow(
      "exceeds stored coverage",
    );
  });

  it("uses the injected Monday at 09:00 London time, even during summer time", async () => {
    expect(demoClock()).toEqual({ date: DEMO_DATE, now: demoNow });
    expect(DEMO_NOW).toBe(demoNow);
    const summer = demoClock("2026-07-06");
    expect(summer.now).toBe(Date.UTC(2026, 6, 6, 8) / 60_000);
    expect(() => demoClock("2026-07-07")).toThrow("valid Monday");
    expect(() => demoClock("2026-02-30")).toThrow("valid Monday");
    await seedRiverside(connection.db, summer);
    expect(await read()).toEqual({
      snapshot: canonical(buildRiverside(summer.date)),
      clock: summer,
    });
  });
});
