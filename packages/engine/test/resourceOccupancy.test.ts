import { expect, it } from "vitest";
import { buildMinimalRequest } from "../../fixtures/src/index.js";
import { booking, context, instant } from "./requestTestHelpers.js";
import { resourceFacts, resourceSnapshot, ruleIds } from "./resourceTestHelpers.js";
import { validateRequest } from "../src/validateRequest.js";
import { checkPractitioner } from "../src/rules/practitioner.js";

const start = buildMinimalRequest().start;
const busy = ["equipment-busy", "practitioner-busy", "room-busy"];
const buffers = ["practitioner-buffer", "room-turnover"];

it("half-open occupancy: one-minute overlaps, exact adjacency, cancellations and unrelated resources", () => {
  for (const [from, to, expected] of [
    [start - 15, start, []],
    [start - 15, start + 1, busy],
    [start + 14, start + 30, busy],
    [start + 15, start + 30, []],
  ] as const) {
    const snapshot = resourceSnapshot();
    snapshot.bookings = [booking(from, { end: to, equipmentId: "unit" })];
    expect(ruleIds(resourceFacts(snapshot))).toEqual(expected);
    snapshot.bookings[0]!.status = "cancelled";
    expect(resourceFacts(snapshot)).toEqual([]);
  }
  const snapshot = resourceSnapshot();
  snapshot.practitioners.push({ ...snapshot.practitioners[0]!, id: "other" });
  snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "other" });
  snapshot.equipment.push({ ...snapshot.equipment[0]!, id: "other" });
  snapshot.bookings = [
    booking(start, { practitionerId: "other", roomId: "other", equipmentId: "other" }),
  ];
  expect(resourceFacts(snapshot)).toEqual([]);
});

it("existing buffers end exactly; one minute earlier blocks and grounds the existing service", () => {
  const snapshot = resourceSnapshot();
  snapshot.services.push({
    ...snapshot.services[0]!,
    id: "previous",
    bufferAfterMin: 15,
    roomTurnoverMin: 15,
  });
  snapshot.bookings = [booking(start - 30, { serviceId: "previous", equipmentId: "unit" })];
  expect(resourceFacts(snapshot)).toEqual([]);
  const facts = resourceFacts(snapshot, start - 1);
  expect(ruleIds(facts)).toEqual(buffers);
  expect(facts.map((fact) => fact.params)).toEqual([
    { bookingId: "booking-test", serviceId: "previous", bufferMin: 15 },
    { bookingId: "booking-test", serviceId: "previous", turnoverMin: 15 },
  ]);
  expect(facts.map((fact) => fact.window)).toEqual(Array(2).fill({ from: start - 15, to: start }));
});

it("requested trailing buffers reach the next booking, with exact equality accepted", () => {
  const snapshot = resourceSnapshot();
  snapshot.services[0]!.bufferAfterMin = 15;
  snapshot.services[0]!.roomTurnoverMin = 15;
  snapshot.services.push({
    ...snapshot.services[0]!,
    id: "next",
    bufferAfterMin: 0,
    roomTurnoverMin: 0,
  });
  snapshot.bookings = [booking(start + 30, { serviceId: "next", equipmentId: "unit" })];
  expect(resourceFacts(snapshot)).toEqual([]);
  const facts = resourceFacts(snapshot, start + 1);
  expect(ruleIds(facts)).toEqual(buffers);
  expect(facts.map((fact) => fact.params)).toEqual([
    { bookingId: "booking-test", serviceId: "consult", bufferMin: 15 },
    { bookingId: "booking-test", serviceId: "consult", turnoverMin: 15 },
  ]);
  expect(facts.map((fact) => fact.window)).toEqual(
    Array(2).fill({ from: start + 16, to: start + 31 }),
  );
  snapshot.bookings[0]!.start = start + 14;
  expect(ruleIds(resourceFacts(snapshot))).toEqual(busy);
});

it("finds all long overlaps and earlier long buffers behind short predecessors", () => {
  const snapshot = resourceSnapshot();
  snapshot.services.push({
    ...snapshot.services[0]!,
    id: "long-buffer",
    bufferAfterMin: 180,
    roomTurnoverMin: 180,
  });
  snapshot.bookings = [
    booking(start - 180, { id: "long", end: start + 90, equipmentId: "unit" }),
    booking(start - 120, { id: "buffer", serviceId: "long-buffer", equipmentId: "unit" }),
    booking(start - 30, { id: "short", equipmentId: "unit" }),
  ];
  const facts = resourceFacts(snapshot);
  expect(ruleIds(facts)).toEqual([...busy, ...buffers].sort());
  expect(facts.filter((fact) => fact.ruleId.endsWith("busy")).map((fact) => fact.params)).toEqual(
    Array(3).fill({ bookingId: "long" }),
  );
  snapshot.bookings.reverse();
  expect(resourceFacts(snapshot)).toEqual(facts);
});

it("cross-midnight occupancy and buffers use instants while caps count local starts", () => {
  const snapshot = resourceSnapshot();
  snapshot.clinic.timezone = "Asia/Kolkata";
  const midnight = instant("2026-11-17T00:00:00+05:30");
  snapshot.practitioners[0]!.workingHours = [
    { weekday: 1, from: "23:00", to: "24:00" },
    { weekday: 2, from: "00:00", to: "01:00" },
  ];
  snapshot.practitioners[0]!.dailyCap = 1;
  snapshot.bookings = [booking(midnight - 30, { end: midnight + 1, equipmentId: "unit" })];
  expect(ruleIds(resourceFacts(snapshot, midnight))).toEqual(busy);
  snapshot.bookings[0]!.end = midnight;
  snapshot.services[0]!.bufferAfterMin = 15;
  snapshot.services[0]!.roomTurnoverMin = 15;
  expect(ruleIds(resourceFacts(snapshot, midnight))).toEqual(buffers);
  snapshot.bookings[0]!.status = "cancelled";
  expect(resourceFacts(snapshot, midnight)).toEqual([]);
});

it("daily cap uses practitioner override, default fallback, exact count and confirmed starts only", () => {
  const snapshot = resourceSnapshot();
  snapshot.policy.defaultDailyCap = 1;
  snapshot.bookings = [
    booking(start - 60),
    booking(start - 30, { id: "cancelled", status: "cancelled" }),
  ];
  const run = () => {
    const ctx = context(snapshot);
    return checkPractitioner(ctx, ctx.snapshot.practitioners[0]!);
  };
  expect(run()[0]?.params).toEqual({ date: "2026-11-16", count: 1, limit: 1 });
  snapshot.practitioners[0]!.dailyCap = 2;
  expect(run()).toEqual([]);
  snapshot.practitioners[0]!.dailyCap = 0;
  snapshot.bookings = [];
  expect(run()[0]?.params).toEqual({ date: "2026-11-16", count: 0, limit: 0 });
  delete snapshot.practitioners[0]!.dailyCap;
  delete snapshot.policy.defaultDailyCap;
  expect(run()).toEqual([]);
});

it("validation rejects unsafe buffered endpoints before resource evaluation", () => {
  const snapshot = resourceSnapshot();
  snapshot.services[0]!.bufferAfterMin = Number.MAX_SAFE_INTEGER;
  expect(validateRequest(snapshot, buildMinimalRequest(), { now: start }).ok).toBe(false);
  snapshot.services[0]!.bufferAfterMin = 0;
  snapshot.services.push({
    ...snapshot.services[0]!,
    id: "overflow",
    roomTurnoverMin: Number.MAX_SAFE_INTEGER,
  });
  snapshot.bookings = [booking(start - 60, { serviceId: "overflow" })];
  expect(validateRequest(snapshot, buildMinimalRequest(), { now: start }).ok).toBe(false);
  snapshot.bookings[0]!.status = "cancelled";
  expect(validateRequest(snapshot, buildMinimalRequest(), { now: start }).ok).toBe(true);
});
