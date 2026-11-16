import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { ClinicSnapshotSchema, EvaluationInputSchema } from "@whynot/contracts";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../src/index.js";
import { generateSnapshots, snapshotArbitrary } from "./generate.js";

describe("minimal authored fixtures", () => {
  it("builds fresh schema-valid inputs with a fixed demo clock", () => {
    const first = buildMinimalSnapshot();
    expect(buildMinimalSnapshot()).toEqual(first);
    expect(buildMinimalSnapshot()).not.toBe(first);
    expect(
      EvaluationInputSchema.safeParse({
        snapshot: first,
        request: buildMinimalRequest(),
        options: { now: demoNow },
      }).success,
    ).toBe(true);
    first.practitioners.length = 0;
    expect(buildMinimalSnapshot().practitioners).toHaveLength(1);
    expect(
      buildMinimalSnapshot({ equipment: [], practitioners: [], rooms: [] }).practitioners,
    ).toEqual([]);
    expect(() => buildMinimalRequest({ patientId: "missing" })).toThrow();
    expect(() => buildMinimalSnapshot({ policy: { ...first.policy, minNoticeMin: -1 } })).toThrow();
  });

  it("accepts frozen overrides without mutation", () => {
    const base = buildMinimalSnapshot();
    const policy = Object.freeze({ ...base.policy, minNoticeMin: 0 });
    const overrides = Object.freeze({ policy });
    const built = buildMinimalSnapshot(overrides);
    expect(built.policy).toEqual(policy);
    built.policy.minNoticeMin = 1;
    expect(policy.minNoticeMin).toBe(0);
  });
});

describe("test-only generated snapshots", () => {
  it("produces schema-valid snapshots without filtering empty pools", () => {
    fc.assert(
      fc.property(snapshotArbitrary, (snapshot) => {
        expect(ClinicSnapshotSchema.safeParse(snapshot).success).toBe(true);
        expect(snapshot.practitioners.length).toBeLessThanOrEqual(8);
        expect(snapshot.rooms.length).toBeLessThanOrEqual(6);
        expect(snapshot.equipment.length).toBeLessThanOrEqual(3);
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  });

  it("reproduces a seed with empty pools, both zones and cancelled bookings", () => {
    const first = generateSnapshots(12012026, 100);
    expect(generateSnapshots(12012026, 100)).toEqual(first);
    expect(generateSnapshots(12012027, 100)).not.toEqual(first);
    expect(first.some((snapshot) => snapshot.practitioners.length === 0)).toBe(true);
    expect(first.some((snapshot) => snapshot.rooms.length === 0)).toBe(true);
    expect(first.some((snapshot) => snapshot.equipment.length === 0)).toBe(true);
    expect(new Set(first.map((snapshot) => snapshot.clinic.timezone))).toEqual(
      new Set(["Europe/London", "Asia/Kolkata"]),
    );
    expect(
      first.some((snapshot) => snapshot.bookings.some((booking) => booking.status === "cancelled")),
    ).toBe(true);
  });
});
