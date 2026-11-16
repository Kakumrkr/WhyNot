import { describe, expect, it, expectTypeOf } from "vitest";
import fc from "fast-check";
import {
  ClinicSnapshotSchema,
  BookingRequestSchema,
  DateSchema,
  OffsetIsoSchema,
  WeeklyHoursSchema,
  MinuteSchema,
  EvaluateOptionsSchema,
  CostWeightsSchema,
  SyntheticSnapshotEnvelopeSchema,
  type ClinicSnapshot,
  type BookingRequest,
  EvaluationInputSchema,
} from "../src/index.js";
import { snapshot, request } from "./samples.js";

describe("snapshot and request contracts", () => {
  it("checks request references, coverage edges and appointment-end overflow", () => {
    const input = { snapshot, request, options: { now: 0 } };
    expect(EvaluationInputSchema.safeParse(input).success).toBe(true);
    for (const field of ["patientId", "serviceId", "practitionerId"]) {
      const parsed = EvaluationInputSchema.safeParse({
        ...input,
        request: { ...request, [field]: "missing" },
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success)
        expect(parsed.error.issues).toContainEqual(
          expect.objectContaining({ path: ["request", field] }),
        );
    }
    expect(
      EvaluationInputSchema.safeParse({ ...input, request: { ...request, start: 1425 } }).success,
    ).toBe(true);
    for (const start of [-1, 1426, Number.MAX_SAFE_INTEGER])
      expect(
        EvaluationInputSchema.safeParse({ ...input, request: { ...request, start } }).success,
      ).toBe(false);
  });
  it("bounds synthetic arrays and candidate combinations while preserving general snapshots", () => {
    const envelope = { schemaVersion: 1, snapshot, now: 0 };
    const practitioners = Array.from({ length: 101 }, (_, i) => ({
      ...snapshot.practitioners[0],
      id: `doctor-${i}`,
    }));
    expect(ClinicSnapshotSchema.safeParse({ ...snapshot, practitioners }).success).toBe(true);
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({
        ...envelope,
        snapshot: { ...snapshot, practitioners },
      }).success,
    ).toBe(false);
    const rooms = Array.from({ length: 100 }, (_, i) => ({
      ...snapshot.rooms[0],
      id: `room-${i}`,
    }));
    const equipment = Array.from({ length: 3 }, (_, i) => ({
      id: `unit-${i}`,
      displayName: "Unit",
      type: "scanner",
      maintenance: [],
    }));
    const large = {
      ...snapshot,
      practitioners: practitioners.slice(0, 100),
      rooms,
      equipment,
      services: [{ ...snapshot.services[0], requiredEquipmentType: "scanner" }],
    };
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({ ...envelope, snapshot: large }).success,
    ).toBe(false);
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({
        ...envelope,
        snapshot: { ...large, equipment: equipment.slice(0, 2) },
      }).success,
    ).toBe(true);
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({
        ...envelope,
        snapshot: { ...snapshot, patients: [{ ...snapshot.patients[0], referrals: ["unknown"] }] },
      }).success,
    ).toBe(false);
  });
  it("infers shared types and accepts minimal snapshots, empty pools and cancelled bookings", () => {
    expectTypeOf(ClinicSnapshotSchema.parse(snapshot)).toEqualTypeOf<ClinicSnapshot>();
    expectTypeOf(BookingRequestSchema.parse(request)).toEqualTypeOf<BookingRequest>();
    expect(ClinicSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(
      ClinicSnapshotSchema.safeParse({ ...snapshot, practitioners: [], rooms: [] }).success,
    ).toBe(true);
    for (const status of ["confirmed", "cancelled"]) {
      expect(
        ClinicSnapshotSchema.safeParse({
          ...snapshot,
          bookings: [
            {
              id: "booking",
              ...request,
              practitionerId: "doctor",
              roomId: "room",
              end: 135,
              status,
            },
          ],
        }).success,
      ).toBe(true);
    }
    expect(EvaluateOptionsSchema.parse({ now: 0 })).toEqual({
      now: 0,
      alternatives: false,
      trace: false,
      includeAdminFix: false,
    });
  });
  it("rejects every dangling booking reference with an exact structured path", () => {
    const booking = {
      id: "booking",
      ...request,
      practitionerId: "doctor",
      roomId: "room",
      end: 135,
      status: "confirmed",
    };
    for (const field of ["patientId", "serviceId", "practitionerId", "roomId", "equipmentId"]) {
      const result = ClinicSnapshotSchema.safeParse({
        ...snapshot,
        bookings: [{ ...booking, [field]: "missing" }],
      });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({ path: ["bookings", 0, field], code: "custom" }),
        );
    }
    expect(
      ClinicSnapshotSchema.safeParse({
        ...snapshot,
        patients: [{ ...snapshot.patients[0], referrals: ["missing"] }],
      }).success,
    ).toBe(false);
  });
  it("rejects duplicate entity and nested window IDs", () => {
    for (const key of ["practitioners", "rooms", "services", "patients"] as const) {
      expect(
        ClinicSnapshotSchema.safeParse({ ...snapshot, [key]: [...snapshot[key], ...snapshot[key]] })
          .success,
      ).toBe(false);
    }
    const window = { id: "leave", from: 1, to: 2, reason: "staff reason" };
    expect(
      ClinicSnapshotSchema.safeParse({
        ...snapshot,
        practitioners: [{ ...snapshot.practitioners[0], timeOff: [window, window] }],
      }).success,
    ).toBe(false);
  });
  it("rejects bad schedules, timezone, coverage, durations and policy values", () => {
    for (const value of [NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])
      expect(MinuteSchema.safeParse(value).success).toBe(false);
    expect(WeeklyHoursSchema.safeParse([{ weekday: 1, from: "23:00", to: "01:00" }]).success).toBe(
      false,
    );
    expect(WeeklyHoursSchema.safeParse([{ weekday: 0, from: "08:00", to: "24:00" }]).success).toBe(
      false,
    );
    expect(
      ClinicSnapshotSchema.safeParse({ ...snapshot, coverage: { from: 1, to: 1 } }).success,
    ).toBe(false);
    expect(
      ClinicSnapshotSchema.safeParse({
        ...snapshot,
        clinic: { ...snapshot.clinic, timezone: "not/a/zone" },
      }).success,
    ).toBe(false);
    expect(
      ClinicSnapshotSchema.safeParse({
        ...snapshot,
        services: [{ ...snapshot.services[0], durationMin: 0 }],
      }).success,
    ).toBe(false);
    for (const key of [
      "minNoticeMin",
      "maxAdvanceDays",
      "patientMaxBookingsPerDay",
      "defaultDailyCap",
    ]) {
      expect(
        ClinicSnapshotSchema.safeParse({ ...snapshot, policy: { ...snapshot.policy, [key]: -1 } })
          .success,
      ).toBe(false);
    }
  });
  it("accepts explicit-offset dates and rejects malformed calendar values", () => {
    expect(DateSchema.safeParse("2024-02-29").success).toBe(true);
    expect(DateSchema.safeParse("2025-02-29").success).toBe(false);
    for (const value of ["2026-11-01T01:30:00-05:00", "2026-11-01T06:30:00Z"])
      expect(OffsetIsoSchema.safeParse(value).success).toBe(true);
    for (const value of ["2026-11-01T01:30:00", "2026-13-01T00:00:00Z"])
      expect(OffsetIsoSchema.safeParse(value).success).toBe(false);
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({ schemaVersion: 2, snapshot, now: 0 }).success,
    ).toBe(false);
    expect(
      SyntheticSnapshotEnvelopeSchema.safeParse({ schemaVersion: 1, snapshot, now: 0 }).success,
    ).toBe(true);
    expect(
      CostWeightsSchema.safeParse({ timeOfDay: 1, day: 6, practitioner: 8, earlier: Infinity })
        .success,
    ).toBe(false);
  });
  it("preserves frozen inputs and validates arbitrary safe integer minutes", () => {
    fc.assert(
      fc.property(fc.integer(), (start) => {
        const input = Object.freeze({ ...request, start });
        expect(BookingRequestSchema.parse(input)).toEqual(input);
        expect(Object.isFrozen(input)).toBe(true);
        expect(BookingRequestSchema.safeParse({ ...input, start: start + 0.5 }).success).toBe(
          false,
        );
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  });
});
