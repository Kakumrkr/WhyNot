import { describe, expect, it } from "vitest";
import {
  AlternativeSchema,
  FactSchema,
  PatientAlternativeSchema,
  WeeklyHoursSchema,
} from "../src/index.js";
import { alternative, fact } from "./samples.js";

describe("Session 1.1 review regressions", () => {
  it("represents split overnight and full-day schedules with midnight ends", () => {
    expect(
      WeeklyHoursSchema.safeParse([
        { weekday: 7, from: "23:00", to: "24:00" },
        { weekday: 1, from: "00:00", to: "01:00" },
        { weekday: 2, from: "00:00", to: "24:00" },
      ]).success,
    ).toBe(true);
    for (const [from, to] of [
      ["24:00", "24:00"],
      ["23:00", "00:00"],
      ["23:00", "24:01"],
      ["23:00", "25:00"],
      ["00:00", "00:00"],
    ]) {
      expect(WeeklyHoursSchema.safeParse([{ weekday: 1, from, to }]).success).toBe(false);
    }
    const midnightBreak = {
      ...fact,
      ruleId: "practitioner-break",
      kind: "availability",
      subject: { type: "practitioner", id: "doctor" },
      params: { date: "2026-11-16", from: "23:00", to: "24:00" },
    };
    expect(FactSchema.safeParse(midnightBreak).success).toBe(true);
    expect(
      FactSchema.safeParse({
        ...midnightBreak,
        params: { ...midnightBreak.params, from: "24:00" },
      }).success,
    ).toBe(false);
  });

  const patient = {
    assignment: { practitionerId: "doctor", start: 150, end: 165 },
    category: "same-day",
    cost: 2,
    changes: alternative.changes,
  };
  it("rejects contradictory, no-op and repeated changes for both audiences", () => {
    for (const changes of [
      [{ field: "start", from: 120, to: 999 }],
      [{ field: "start", from: 150, to: 150 }],
      [{ field: "practitionerId", from: "doctor", to: "doctor" }],
      [{ field: "practitionerId", from: null, to: null }],
      [{ field: "practitionerId", from: "doctor", to: "other" }],
      [
        { field: "start", from: 120, to: 150 },
        { field: "start", from: 135, to: 150 },
      ],
    ]) {
      expect(AlternativeSchema.safeParse({ ...alternative, changes }).success).toBe(false);
      expect(PatientAlternativeSchema.safeParse({ ...patient, changes }).success).toBe(false);
    }
    const parsed = AlternativeSchema.safeParse({
      ...alternative,
      changes: [{ field: "start", from: 120, to: 999 }],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({ path: ["changes", 0, "to"] }),
      );
  });

  it("accepts explicit practitioner selection and removal of a preference", () => {
    for (const [request, changes] of [
      [
        { ...alternative.request, practitionerId: "doctor" },
        [{ field: "practitionerId", from: "other", to: "doctor" }],
      ],
      [
        { ...alternative.request, practitionerId: "doctor" },
        [{ field: "practitionerId", from: null, to: "doctor" }],
      ],
      [alternative.request, [{ field: "practitionerId", from: "other", to: null }]],
    ] as const) {
      expect(AlternativeSchema.safeParse({ ...alternative, request, changes }).success).toBe(true);
      expect(PatientAlternativeSchema.safeParse({ ...patient, changes }).success).toBe(true);
    }
    expect(
      AlternativeSchema.safeParse({
        ...alternative,
        request: { ...alternative.request, practitionerId: "doctor" },
        changes: [{ field: "practitionerId", from: "other", to: null }],
      }).success,
    ).toBe(false);
    expect(
      PatientAlternativeSchema.safeParse({
        ...patient,
        changes: [...alternative.changes, { field: "practitionerId", from: "other", to: "doctor" }],
      }).success,
    ).toBe(true);
  });
});
