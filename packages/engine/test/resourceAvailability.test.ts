import { expect, it } from "vitest";
import { FactSchema } from "@whynot/contracts";
import { buildMinimalRequest } from "../../fixtures/src/index.js";
import { context, instant } from "./requestTestHelpers.js";
import { resourceFacts, resourceSnapshot, ruleIds } from "./resourceTestHelpers.js";
import { checkPractitioner } from "../src/rules/practitioner.js";

const start = buildMinimalRequest().start;

it("skill, room capability and equipment type distinguish missing requirements and incompatible resources", () => {
  const snapshot = resourceSnapshot();
  expect(resourceFacts(snapshot)).toEqual([]);
  snapshot.services[0]!.requiredRoomCapability = "imaging";
  snapshot.practitioners[0]!.skills = [];
  snapshot.equipment[0]!.type = "wrong";
  const facts = resourceFacts(snapshot);
  expect(ruleIds(facts)).toEqual(["equipment-type", "practitioner-skill", "room-capability"]);
  expect(facts.every((fact) => FactSchema.safeParse(fact).success)).toBe(true);
  snapshot.practitioners[0]!.skills = ["consult"];
  snapshot.rooms[0]!.capabilities = ["imaging"];
  snapshot.equipment[0]!.type = "scanner";
  expect(resourceFacts(snapshot)).toEqual([]);
  delete snapshot.services[0]!.requiredRoomCapability;
  delete snapshot.services[0]!.requiredEquipmentType;
  snapshot.rooms[0]!.capabilities = [];
  snapshot.equipment[0]!.maintenance = [{ id: "unused", from: start, to: start + 60 }];
  expect(resourceFacts(snapshot)).toEqual([]);
});

it("working hours accept exact closing and adjacent intervals, reject gaps and missing days", () => {
  const snapshot = resourceSnapshot();
  const practitioner = snapshot.practitioners[0]!;
  practitioner.workingHours = [{ weekday: 1, from: "10:00", to: "11:15" }];
  expect(resourceFacts(snapshot)).toEqual([]);
  expect(ruleIds(resourceFacts(snapshot, start + 1))).toEqual(["practitioner-hours"]);
  expect(ruleIds(resourceFacts(snapshot, start - 61))).toEqual(["practitioner-hours"]);
  practitioner.workingHours = [
    { weekday: 1, from: "10:00", to: "11:05" },
    { weekday: 1, from: "11:05", to: "12:00" },
  ];
  expect(resourceFacts(snapshot)).toEqual([]);
  practitioner.workingHours[1]!.from = "11:06";
  expect(ruleIds(resourceFacts(snapshot))).toEqual(["practitioner-hours"]);
  practitioner.workingHours = [];
  expect(ruleIds(resourceFacts(snapshot))).toEqual(["practitioner-hours"]);
});

it("working hours cover an appointment across local midnight only when both days connect", () => {
  const snapshot = resourceSnapshot();
  snapshot.practitioners[0]!.workingHours = [
    { weekday: 1, from: "23:00", to: "24:00" },
    { weekday: 2, from: "00:00", to: "01:00" },
  ];
  const from = instant("2026-11-16T23:55:00Z");
  expect(resourceFacts(snapshot, from)).toEqual([]);
  snapshot.practitioners[0]!.workingHours.pop();
  expect(ruleIds(resourceFacts(snapshot, from))).toEqual(["practitioner-hours"]);
});

it("break boundaries are half-open, independently grounded and canonically ordered", () => {
  const snapshot = resourceSnapshot();
  snapshot.practitioners[0]!.breaks = [
    { weekday: 1, from: "10:00", to: "11:00" },
    { weekday: 1, from: "11:15", to: "12:00" },
  ];
  expect(resourceFacts(snapshot)).toEqual([]);
  expect(ruleIds(resourceFacts(snapshot, start - 1))).toEqual(["practitioner-break"]);
  expect(ruleIds(resourceFacts(snapshot, start + 1))).toEqual(["practitioner-break"]);
  snapshot.services[0]!.durationMin = 90;
  const facts = resourceFacts(snapshot, start - 30);
  expect(facts).toHaveLength(2);
  expect(facts[0]?.params).toEqual({ date: "2026-11-16", from: "10:00", to: "11:00" });
  snapshot.practitioners[0]!.breaks.reverse();
  expect(resourceFacts(snapshot, start - 30)).toEqual(facts);
  snapshot.practitioners[0]!.breaks.push(snapshot.practitioners[0]!.breaks[0]!);
  expect(resourceFacts(snapshot, start - 30)).toEqual(facts);
});

it("leave and maintenance use stable window IDs, all long overlaps and half-open endpoints", () => {
  const snapshot = resourceSnapshot();
  for (const [from, to, expected] of [
    [start - 10, start, false],
    [start - 10, start + 1, true],
    [start + 14, start + 20, true],
    [start + 15, start + 20, false],
  ] as const) {
    const window = { id: "window", from, to };
    snapshot.practitioners[0]!.timeOff = [{ ...window, reason: "Private reason" }];
    snapshot.rooms[0]!.maintenance = [window];
    snapshot.equipment[0]!.maintenance = [window];
    expect(ruleIds(resourceFacts(snapshot))).toEqual(
      expected ? ["equipment-maintenance", "practitioner-time-off", "room-maintenance"] : [],
    );
  }
  const windows = [
    { id: "long", from: start - 100, to: start + 60 },
    { id: "short", from: start - 30, to: start - 15 },
    { id: "second", from: start + 1, to: start + 2 },
  ];
  snapshot.practitioners[0]!.timeOff = windows.map((window) => ({ ...window, reason: "Private" }));
  snapshot.rooms[0]!.maintenance = windows;
  snapshot.equipment[0]!.maintenance = windows;
  const facts = resourceFacts(snapshot);
  expect(facts).toHaveLength(6);
  expect(new Set(facts.map((fact) => fact.id)).size).toBe(6);
  const leave = facts.find((fact) => fact.ruleId === "practitioner-time-off");
  expect(leave?.visibility).toBe("staff");
  expect(leave?.params).toEqual({ timeOffId: "long", reason: "Private" });
  snapshot.practitioners[0]!.timeOff.reverse();
  // Room and equipment deliberately share the same array: neither check mutates it.
  windows.reverse();
  expect(resourceFacts(snapshot)).toEqual(facts);
});

it("cross-midnight maintenance and end-only midnight breaks preserve their actual windows", () => {
  const snapshot = resourceSnapshot();
  const midnight = instant("2026-11-17T00:00:00Z");
  snapshot.practitioners[0]!.workingHours = [
    { weekday: 1, from: "00:00", to: "24:00" },
    { weekday: 2, from: "00:00", to: "24:00" },
  ];
  snapshot.practitioners[0]!.breaks = [{ weekday: 1, from: "23:30", to: "24:00" }];
  snapshot.rooms[0]!.maintenance = [{ id: "overnight", from: midnight - 30, to: midnight + 30 }];
  expect(ruleIds(resourceFacts(snapshot, midnight - 5))).toEqual([
    "practitioner-break",
    "room-maintenance",
  ]);
  expect(ruleIds(resourceFacts(snapshot, midnight))).toEqual(["room-maintenance"]);
  const ctx = context(snapshot, buildMinimalRequest({ start: midnight - 5 }));
  expect(checkPractitioner(ctx, ctx.snapshot.practitioners[0]!)[0]?.params).toEqual({
    date: "2026-11-16",
    from: "23:30",
    to: "24:00",
  });
});
