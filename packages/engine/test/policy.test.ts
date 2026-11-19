import type { Booking, PolicyChange } from "@whynot/contracts";
import { applyPolicyChanges, evaluate, isBookable, previewPolicyChanges } from "@whynot/engine";
import { expect, it } from "vitest";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";

const request = buildMinimalRequest();
const options = { now: demoNow, alternatives: false } as const;

function booking(id: string, serviceId: string, start: number, end: number): Booking {
  return {
    id,
    serviceId,
    patientId: request.patientId,
    practitionerId: "practitioner-test",
    roomId: "room-test",
    start: request.start + start,
    end: request.start + end,
    status: "confirmed",
  };
}

it("targets both buffer directions, coalesces shared bounds and uses actual cap counts", () => {
  const snapshot = buildMinimalSnapshot();
  const service = snapshot.services[0]!;
  service.bufferAfterMin = 25;
  service.roomTurnoverMin = 25;
  snapshot.services.push({ ...service, id: "previous" });
  snapshot.policy.defaultDailyCap = 1;
  snapshot.bookings = [
    booking("earlier", "previous", -32, -17),
    booking("closest", "previous", -20, -5),
    booking("next", "previous", 17, 32),
  ];
  const result = evaluate(snapshot, request, options);
  if (result.status !== "blocked" || result.adminFix === null) throw new Error("Expected fix");
  const changes: PolicyChange[] = [
    { entity: "policy", field: "patientMaxBookingsPerDay", value: 4 },
    { entity: "practitioner", id: "practitioner-test", field: "dailyCap", value: 4 },
    { entity: "service", id: "consult", field: "bufferAfterMin", value: 2 },
    { entity: "service", id: "consult", field: "roomTurnoverMin", value: 2 },
    { entity: "service", id: "previous", field: "bufferAfterMin", value: 5 },
    { entity: "service", id: "previous", field: "roomTurnoverMin", value: 5 },
  ];
  expect(result.adminFix.changes).toEqual(changes);
  expect(result.adminFix.factIds).toHaveLength(8);
  expect(result.adminFix.cost).toBe(26);
  const applied = applyPolicyChanges(snapshot, changes);
  if (!applied.ok) throw new Error("Expected a valid patch");
  expect(isBookable(applied.value, request, options.now)).toBe(true);
  for (const [index, change] of changes.entries()) {
    const without = applyPolicyChanges(
      snapshot,
      changes.filter((_, i) => i !== index),
    );
    if (!without.ok) throw new Error("Expected a valid subset");
    expect(isBookable(without.value, request, options.now), change.field).toBe(false);
  }
});

it("chooses a lower-cost candidate and a canonical room on equal costs", () => {
  const snapshot = buildMinimalSnapshot();
  const first = snapshot.practitioners[0]!;
  snapshot.practitioners.unshift({ ...first, id: "a", dailyCap: 0 }, { ...first, id: "b" });
  snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "a" });
  snapshot.policy.minNoticeMin = 121;
  const result = evaluate(snapshot, request, options);
  if (result.status !== "blocked" || result.adminFix === null) throw new Error("Expected fix");
  expect(result.adminFix).toMatchObject({
    changes: [{ entity: "policy", field: "minNoticeMin", value: 120 }],
    viaCandidate: { practitionerId: "b", roomId: "a" },
    cost: 2,
  });
});

it("chooses the same concrete setting and witness after shuffling competing equal-cost fixes", () => {
  const snapshot = buildMinimalSnapshot();
  const first = snapshot.practitioners[0]!;
  snapshot.practitioners = [
    { ...first, id: "z", dailyCap: 0 },
    { ...first, id: "a", dailyCap: 0 },
  ];
  snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "a" });
  snapshot.bookings = [
    { ...booking("cancelled-a", "consult", 0, 15), practitionerId: "a", status: "cancelled" },
    { ...booking("cancelled-z", "consult", 0, 15), practitionerId: "z", status: "cancelled" },
  ];
  const result = evaluate(snapshot, request, options);
  if (result.status !== "blocked" || result.adminFix === null) throw new Error("Expected fix");
  expect(result.adminFix).toMatchObject({
    changes: [{ entity: "practitioner", id: "a", field: "dailyCap", value: 1 }],
    viaCandidate: { practitionerId: "a", roomId: "a" },
    cost: 3,
  });
  snapshot.practitioners.reverse();
  snapshot.rooms.reverse();
  snapshot.bookings.reverse();
  expect(evaluate(snapshot, request, options)).toEqual(result);
});

it("rounds the elapsed advance threshold up to whole days and rejects past-slot notice fixes", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.policy.maxAdvanceDays = 1;
  const advanced = evaluate(snapshot, request, { ...options, now: request.start - 1441 });
  expect(advanced).toMatchObject({
    status: "blocked",
    adminFix: { changes: [{ entity: "policy", field: "maxAdvanceDays", value: 2 }] },
  });
  expect(evaluate(snapshot, request, { ...options, now: request.start + 1 })).toMatchObject({
    status: "blocked",
    adminFix: null,
  });
});

it("does not offer a policy fix for occupancy, provider leave or a referral requirement", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.bookings.push(booking("busy", "consult", 0, 15));
  expect(evaluate(snapshot, request, options)).toMatchObject({ status: "blocked", adminFix: null });
  snapshot.bookings = [];
  snapshot.practitioners[0]!.timeOff.push({
    id: "leave",
    from: request.start,
    to: request.start + 15,
    reason: "Synthetic leave",
  });
  expect(evaluate(snapshot, request, options)).toMatchObject({ status: "blocked", adminFix: null });
  snapshot.practitioners[0]!.timeOff = [];
  snapshot.services[0]!.eligibility = "referral_required";
  expect(evaluate(snapshot, request, options)).toMatchObject({ status: "blocked", adminFix: null });
  expect(
    applyPolicyChanges(snapshot, [
      { entity: "service", id: "consult", field: "eligibility", value: "any" },
    ]),
  ).toMatchObject({ ok: false, issues: [{ code: "invalid_request" }] });
});

it("rejects unknown, invalid and conflicting settings without partially changing the snapshot", () => {
  const snapshot = buildMinimalSnapshot();
  const before = structuredClone(snapshot);
  const change = { entity: "policy", field: "minNoticeMin", value: 100 };
  for (const invalid of [
    [],
    [change, { ...change, value: 80 }],
    [{ ...change, value: -1 }],
    [{ ...change, field: "defaultDailyCap" }],
    [{ ...change, field: "maxAdvanceDays", value: Number.MAX_SAFE_INTEGER }],
    [change, { entity: "service", id: "missing", field: "roomTurnoverMin", value: 0 }],
    [change, { entity: "practitioner", id: "missing", field: "dailyCap", value: 1 }],
    [{ entity: "service", id: "consult", field: "durationMin", value: 0 }],
  ]) {
    expect(applyPolicyChanges(snapshot, invalid)).toMatchObject({ ok: false });
    expect(previewPolicyChanges(snapshot, request, invalid, options)).toMatchObject({ ok: false });
    expect(snapshot).toEqual(before);
  }
  const applied = applyPolicyChanges(snapshot, [change]);
  if (!applied.ok) throw new Error("Expected a valid change");
  applied.value.practitioners[0]!.skills.push("added-on-copy");
  expect(snapshot).toEqual(before);
});
