import { EvaluateOptionsSchema, schemaVersion, type PolicyPatch } from "@whynot/contracts";
import { engineVersion, evaluate, simulatePolicyChanges } from "@whynot/engine";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";
import { expect, it } from "vitest";

function capture(snapshot: ReturnType<typeof buildMinimalSnapshot>, start: number, now = demoNow) {
  const request = buildMinimalRequest({ start });
  const options = EvaluateOptionsSchema.parse({ now, alternatives: false });
  const original = evaluate(snapshot, request, options);
  if (original.status === "invalid_request") throw new Error("Invalid test capture");
  return {
    snapshot,
    request,
    options,
    now,
    engineVersion,
    schemaVersion,
    supportedInputVersion: true,
    policyVersionId: snapshot.policy.versionId,
    originalStatus: original.status,
    originalMeta: original.meta,
    originalErrors: undefined,
  };
}

function freeze(value: unknown) {
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}

it("rechecks notice and buffer boundaries independently with the original clock and bookings", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.policy.patientMaxBookingsPerDay = 2;
  snapshot.services[0]!.bufferAfterMin = 15;
  snapshot.bookings.push({
    id: "old-booking",
    patientId: "patient-test",
    serviceId: "consult",
    practitionerId: "practitioner-test",
    roomId: "room-test",
    start: demoNow + 60,
    end: demoNow + 75,
    status: "confirmed",
  });
  const start = demoNow + 75;
  const earlier = capture(snapshot, start, demoNow - 15);
  const later = capture(snapshot, start, demoNow + 15);
  const patch: PolicyPatch = [
    { entity: "policy", field: "minNoticeMin", value: 75 },
    { entity: "service", id: "consult", field: "bufferAfterMin", value: 0 },
  ];
  const records = [earlier, earlier, later, capture(snapshot, demoNow + 120)];
  const original = structuredClone(records);
  freeze(records);
  freeze(patch);
  expect(simulatePolicyChanges(records, patch)).toEqual({
    total: 4,
    eligible: 4,
    newlyFeasible: 2,
    stillBlocked: 1,
    stillFeasible: 1,
    noLongerFeasible: 0,
    unsupported: 0,
    incomplete: 0,
    invalid: 0,
    inapplicable: 0,
    examples: [
      { start, before: "blocked", after: "bookable" },
      { start, before: "blocked", after: "blocked" },
      { start: demoNow + 120, before: "bookable", after: "bookable" },
    ],
  });
  expect(records).toEqual(original);
});

it("separates unsupported, incomplete, and inapplicable captures from the eligible denominator", () => {
  const record = capture(buildMinimalSnapshot(), demoNow + 120);
  const other = buildMinimalSnapshot();
  other.services.push({ ...other.services[0]!, id: "historical-only" });
  const applicable = capture(other, demoNow + 120);
  const changes = [
    { entity: "policy", field: "minNoticeMin", value: 135 },
    { entity: "service", id: "historical-only", field: "bufferAfterMin", value: 0 },
  ];
  expect(
    simulatePolicyChanges(
      [
        { ...record, engineVersion: "unavailable" },
        { ...record, options: { now: demoNow } },
        { ...record, originalStatus: "blocked" },
        record,
        applicable,
      ],
      changes,
    ),
  ).toMatchObject({
    total: 5,
    eligible: 1,
    newlyFeasible: 0,
    stillBlocked: 0,
    stillFeasible: 0,
    noLongerFeasible: 1,
    unsupported: 1,
    incomplete: 2,
    inapplicable: 1,
  });
  expect(simulatePolicyChanges([record], [])).toBeNull();
});
