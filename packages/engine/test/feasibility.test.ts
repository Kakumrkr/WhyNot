import { expect, it } from "vitest";
import fc from "fast-check";
import { isBookable } from "@whynot/engine";
import { AssignmentSchema } from "@whynot/contracts";
import { buildMinimalSnapshot, buildMinimalRequest, demoNow } from "../../fixtures/src/builders.js";
import { resourceRuleCaseArbitrary } from "../../fixtures/test/generate.js";
import { referenceAssignment, referenceRows } from "./reference/feasibility.js";
import { validateRequest } from "../src/validateRequest.js";
import { buildMatrix } from "../src/matrix.js";
import { chooseAssignment } from "../src/feasibility.js";

function evaluate(
  snapshot = buildMinimalSnapshot(),
  request = buildMinimalRequest(),
  now = demoNow,
) {
  const context = validateRequest(snapshot, request, { now });
  if (!context.ok) throw new Error(JSON.stringify(context.issues));
  const matrix = buildMatrix(context.value);
  return { matrix, assignment: chooseAssignment(context.value, matrix) };
}

it("enumerates incompatible real resources and uses null equipment only when not required", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.practitioners.push({ ...snapshot.practitioners[0]!, id: "unqualified", skills: [] });
  snapshot.equipment.push({ id: "unit", displayName: "Unit", type: "wrong", maintenance: [] });
  expect(evaluate(snapshot).matrix.rows).toHaveLength(2);
  expect(evaluate(snapshot).matrix.rows.every((r) => r.assignment.equipmentId === null)).toBe(true);
  snapshot.services[0]!.requiredEquipmentType = "scanner";
  const { matrix, assignment } = evaluate(snapshot);
  expect(matrix.rows).toHaveLength(2);
  expect(matrix.rows.every((r) => r.assignment.equipmentId === "unit")).toBe(true);
  expect(matrix.facts.some((f) => f.ruleId === "equipment-type")).toBe(true);
  expect(assignment).toBeNull();
});

it("returns one ordered structural cause for every combination of empty pools", () => {
  for (let mask = 0; mask < 8; mask++) {
    const snapshot = buildMinimalSnapshot();
    snapshot.services[0]!.requiredEquipmentType = "scanner";
    snapshot.equipment = [{ id: "unit", displayName: "Unit", type: "scanner", maintenance: [] }];
    if (mask & 1) snapshot.practitioners = [];
    if (mask & 2) snapshot.rooms = [];
    if (mask & 4) snapshot.equipment = [];
    const { matrix, assignment } = evaluate(snapshot);
    if (mask === 0) expect(assignment).not.toBeNull();
    else {
      expect(matrix.basis).toBe("missing_resource");
      expect(matrix.rows).toEqual([]);
      expect(matrix.facts).toHaveLength(1);
      expect(matrix.facts[0]!.params).toEqual({
        dimension: mask & 1 ? "practitioner" : mask & 2 ? "room" : "equipment",
      });
      expect(assignment).toBeNull();
      expect(referenceAssignment(snapshot, buildMinimalRequest(), demoNow)).toBeNull();
      expect(isBookable(snapshot, buildMinimalRequest(), demoNow)).toBe(false);
    }
  }
});

it("ranks by confirmed local-day load before codepoint IDs and honors the requested practitioner", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.policy.patientMaxBookingsPerDay = 20;
  snapshot.clinic.timezone = "Asia/Kolkata";
  snapshot.practitioners = ["a", "\u{10000}", "\uE000"].map((id) => ({
    ...snapshot.practitioners[0]!,
    id,
  }));
  snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "a-room" });
  const request = buildMinimalRequest();
  // Previous UTC date, same Kolkata date as the request. Cancelled load must not count.
  snapshot.bookings = [
    {
      id: "confirmed",
      patientId: request.patientId,
      serviceId: request.serviceId,
      practitionerId: "a",
      roomId: "room-test",
      start: demoNow - 600,
      end: demoNow - 585,
      status: "confirmed",
    },
    {
      id: "cancelled",
      patientId: request.patientId,
      serviceId: request.serviceId,
      practitionerId: "\uE000",
      roomId: "room-test",
      start: demoNow - 600,
      end: demoNow - 585,
      status: "cancelled",
    },
  ];
  const result = evaluate(snapshot, request).assignment;
  expect(result?.practitionerId).toBe("\uE000");
  expect(result?.roomId).toBe("a-room");
  expect(result).toEqual(referenceAssignment(snapshot, request, demoNow));
  request.practitionerId = "a";
  expect(evaluate(snapshot, request).assignment?.practitionerId).toBe("a");
  snapshot.practitioners[0]!.timeOff = [
    { id: "leave", from: request.start, to: request.start + 60, reason: "Synthetic" },
  ];
  expect(isBookable(snapshot, request, demoNow)).toBe(false);
});

it("rejects invalid public inputs without throwing or exposing partial evaluations", () => {
  expect(isBookable(null, {}, demoNow)).toBe(false);
  expect(
    isBookable(buildMinimalSnapshot(), { ...buildMinimalRequest(), start: demoNow + 121 }, demoNow),
  ).toBe(false);
  expect(
    isBookable(buildMinimalSnapshot(), { ...buildMinimalRequest(), patientId: "missing" }, demoNow),
  ).toBe(false);
  expect(isBookable(buildMinimalSnapshot(), buildMinimalRequest(), NaN)).toBe(false);
});

it("reference and matrix hand-check midnight coverage and both trailing buffer directions", () => {
  const snapshot = buildMinimalSnapshot();
  const request = buildMinimalRequest({ start: demoNow - 555 }); // Sunday 23:45 UTC
  const hours = [
    { weekday: 7, from: "23:30", to: "24:00" },
    { weekday: 1, from: "00:00", to: "01:00" },
  ];
  snapshot.clinic.openingHours = hours;
  snapshot.practitioners[0]!.workingHours = hours;
  snapshot.services[0]!.durationMin = 30;
  snapshot.services[0]!.bufferAfterMin = 15;
  snapshot.policy.patientMaxBookingsPerDay = 20;
  const now = request.start - 120;
  expect(evaluate(snapshot, request, now).assignment).toEqual(
    referenceAssignment(snapshot, request, now),
  );
  expect(isBookable(snapshot, request, now)).toBe(true);
  for (const offset of [-30, 45]) {
    snapshot.bookings = [
      {
        id: "adjacent",
        patientId: request.patientId,
        serviceId: request.serviceId,
        practitionerId: "practitioner-test",
        roomId: "room-test",
        start: request.start + offset,
        end: request.start + offset + 15,
        status: "confirmed",
      },
    ];
    // Exactly at the 15-minute buffer boundary: feasible in either direction.
    expect(isBookable(snapshot, request, now)).toBe(true);
    expect(referenceAssignment(snapshot, request, now)).not.toBeNull();
    snapshot.bookings[0]!.start += offset < 0 ? 1 : -1;
    snapshot.bookings[0]!.end += offset < 0 ? 1 : -1;
    expect(isBookable(snapshot, request, now)).toBe(false);
    expect(referenceRows(snapshot, request, now)[0]!.rules).toEqual(["practitioner-buffer"]);
    expect(evaluate(snapshot, request, now).matrix.facts.map((f) => f.ruleId)).toEqual([
      "practitioner-buffer",
    ]);
  }
});

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

// Include a feasible-domain generator so differential checks cannot pass on universal rejection.
const mixedCases = fc.oneof(
  resourceRuleCaseArbitrary,
  fc
    .tuple(fc.array(fc.boolean(), { minLength: 1, maxLength: 8 }), fc.boolean())
    .map(([qualified, preferred]) => {
      const snapshot = buildMinimalSnapshot();
      snapshot.practitioners = qualified.map((skill, i) => ({
        ...snapshot.practitioners[0]!,
        id: `p-${i}`,
        skills: skill ? ["consult"] : [],
      }));
      const request = buildMinimalRequest();
      if (preferred) request.practitionerId = "p-0";
      return { snapshot, request, now: demoNow };
    }),
);

it(
  "P1/P2/P8/P9: reference rows and witnesses agree, including shuffled and frozen inputs",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(mixedCases, ({ snapshot, request, now }) => {
        const before = structuredClone({ snapshot, request });
        freeze(snapshot);
        freeze(request);
        const actual = evaluate(snapshot, request, now);
        const reference = referenceRows(snapshot, request, now);
        expect(isBookable(snapshot, request, now)).toBe(
          reference.some((r) => r.rules.length === 0),
        );
        expect(actual.assignment).toEqual(referenceAssignment(snapshot, request, now));
        if (actual.assignment !== null) {
          expect(AssignmentSchema.safeParse(actual.assignment).success).toBe(true);
          expect(
            reference.find(
              (r) => JSON.stringify(r.assignment) === JSON.stringify(actual.assignment),
            )?.rules,
          ).toEqual([]);
        }
        for (const row of actual.matrix.rows) {
          const expected = reference.find(
            (r) => JSON.stringify(r.assignment) === JSON.stringify(row.assignment),
          );
          const rules = row.factIds.map(
            (id) => actual.matrix.facts.find((f) => f.id === id)!.ruleId,
          );
          expect([...new Set(rules)].sort()).toEqual(expected?.rules);
        }
        expect(evaluate(snapshot, request, now)).toEqual(actual);
        expect({ snapshot, request }).toEqual(before);
        const shuffled = structuredClone(snapshot);
        shuffled.practitioners.reverse();
        shuffled.rooms.reverse();
        shuffled.equipment.reverse();
        shuffled.services.reverse();
        shuffled.patients.reverse();
        shuffled.bookings.reverse();
        shuffled.clinic.openingHours.reverse();
        shuffled.clinic.closedDates.reverse();
        for (const p of shuffled.practitioners) {
          p.workingHours.reverse();
          p.breaks.reverse();
          p.timeOff.reverse();
          p.skills.reverse();
        }
        for (const r of shuffled.rooms) {
          r.capabilities.reverse();
          r.maintenance.reverse();
        }
        for (const e of shuffled.equipment) e.maintenance.reverse();
        expect(evaluate(shuffled, request, now)).toEqual(actual);
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);
