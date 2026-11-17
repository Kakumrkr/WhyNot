import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { BookingRequestSchema, ClinicSnapshotSchema } from "@whynot/contracts";
import { evaluate, isBookable } from "@whynot/engine";
import { buildRiverside, buildScenario, riversideMinute } from "../../fixtures/src/index.js";

for (let i = 1; i <= 8; i++) {
  it(`H${i} matches authored doc-02 explanation and preserves its future opening`, () => {
    const golden: {
      id: string;
      day: number;
      time: string;
      serviceId: string;
      patientId: string;
      practitionerId?: string;
      expected: string[][];
    } = JSON.parse(
      readFileSync(new URL(`../../fixtures/scenarios/H${i}.json`, import.meta.url), "utf8"),
    );
    const snapshot = buildScenario(golden.id);
    const request = BookingRequestSchema.parse({
      patientId: golden.patientId,
      serviceId: golden.serviceId,
      start: riversideMinute(golden.day, golden.time),
      ...(golden.practitionerId === undefined ? {} : { practitionerId: golden.practitionerId }),
    });
    expect(ClinicSnapshotSchema.safeParse(snapshot).success).toBe(true);
    const actual = evaluate(snapshot, request, { now: riversideMinute(0, "09:00"), trace: true });
    expect(actual.status).toBe("blocked");
    if (actual.status !== "blocked") throw new Error("Hero must be blocked");
    expect(actual.explanation.optimal).toBe(true);
    if (i === 1) {
      expect(
        actual.explanation.facts
          .filter((f) => f.ruleId === "practitioner-skill")
          .map((f) => f.subject.id)
          .sort(),
      ).toEqual(["chen", "harris", "iyer", "okafor"]);
    }
    const selected = actual.explanation.primary.map((id) => {
      const fact = actual.explanation.facts.find((f) => f.id === id)!;
      return [fact.ruleId, fact.subject.id];
    });
    expect(selected.sort()).toEqual([...golden.expected].sort());
    const next: Record<number, [number, string]> = {
      1: [1, "14:45"],
      2: [3, "12:00"],
      3: [0, "11:00"],
      5: [4, "16:00"],
      6: [1, "11:30"],
      7: [2, "10:00"],
      8: [2, "11:00"],
    };
    if (i === 4)
      expect(
        isBookable(
          snapshot,
          { ...request, start: riversideMinute(4, "11:00") },
          riversideMinute(0, "09:00"),
        ),
      ).toBe(false);
    else
      expect(
        isBookable(
          snapshot,
          { ...request, start: riversideMinute(...next[i]!) },
          riversideMinute(0, "09:00"),
        ),
      ).toBe(true);
    if (i === 7)
      expect(
        isBookable(snapshot, { ...request, practitionerId: "rao" }, riversideMinute(0, "09:00")),
      ).toBe(true);
  });
}

it("Riverside and named overrides are seeded, isolated and movable to another Monday", () => {
  const base = buildRiverside();
  expect(base).toEqual(buildRiverside());
  expect(base.bookings.length).toBeGreaterThan(50);
  expect(buildRiverside("2026-11-16", 1)).not.toEqual(base);
  const h1 = buildScenario("H1");
  h1.practitioners.length = 0;
  expect(buildRiverside()).toEqual(base);
  expect(buildScenario("H1").practitioners).toHaveLength(6);
  expect(ClinicSnapshotSchema.safeParse(buildRiverside("2026-06-01")).success).toBe(true);
  expect(() => buildRiverside("2026-11-17")).toThrow("Monday");
  expect(() => buildScenario("H11")).toThrow("Unknown");
});
