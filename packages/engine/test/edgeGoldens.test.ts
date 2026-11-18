import { expect, it } from "vitest";
import type { Booking, BookingRequest, ClinicSnapshot, RuleId } from "@whynot/contracts";
import { evaluate } from "@whynot/engine";
import { buildMinimalSnapshot, buildMinimalRequest, demoNow } from "../../fixtures/src/index.js";

type CaseInput = { snapshot: ClinicSnapshot; request: BookingRequest; now: number };
type Expected =
  | { status: "bookable" }
  | { status: "invalid_request"; code: string }
  | { status: "blocked"; primary: RuleId[]; also?: RuleId[] };

function booking(input: CaseInput, overrides: Partial<Booking> = {}): void {
  const { snapshot, request } = input;
  const otherId = "other-patient";
  snapshot.patients.push({ ...snapshot.patients[0]!, id: otherId });
  snapshot.bookings.push({
    id: "edge-booking",
    patientId: otherId,
    serviceId: request.serviceId,
    practitionerId: snapshot.practitioners[0]!.id,
    roomId: snapshot.rooms[0]!.id,
    start: request.start,
    end: request.start + 15,
    status: "confirmed",
    ...overrides,
  });
}

// Authored from the half-open interval, policy and weighting rules in docs 02/03.
const corpus = {
  schemaVersion: 1,
  snapshot: "minimal",
  cases: [
    [
      "E01",
      "nonexistent recurring boundary across the spring DST transition",
      (input) => {
        const transition = Date.parse("2026-03-29T01:30:00Z") / 60000;
        input.now = transition - 120;
        input.request.start = transition;
        input.snapshot.coverage = { from: transition - 1440, to: transition + 1440 };
        input.snapshot.clinic.openingHours = [{ weekday: 7, from: "01:30", to: "06:00" }];
      },
      { status: "invalid_request", code: "unsupported_wall_time" },
    ],
    [
      "E02",
      "the last appointment ends exactly at closing",
      ({ request }) => {
        request.start = demoNow + 8 * 60 + 45;
      },
      { status: "bookable" },
    ],
    [
      "E03",
      "start exactly at the end of a scheduled break",
      ({ snapshot }) => {
        snapshot.practitioners[0]!.breaks = [{ weekday: 1, from: "10:30", to: "11:00" }];
      },
      { status: "bookable" },
    ],
    [
      "E04",
      "end of positive buffer and turnover exactly meets the next start",
      (input) => {
        input.snapshot.services[0]!.bufferAfterMin = 15;
        input.snapshot.services[0]!.roomTurnoverMin = 15;
        booking(input, { start: input.request.start - 30, end: input.request.start - 15 });
      },
      { status: "bookable" },
    ],
    [
      "E05",
      "zero buffers permit back-to-back occupancy",
      (input) => {
        booking(input, { start: input.request.start - 15, end: input.request.start });
      },
      { status: "bookable" },
    ],
    [
      "E06",
      "the only practitioner lacks the required skill",
      ({ snapshot }) => {
        snapshot.practitioners[0]!.skills = [];
      },
      { status: "blocked", primary: ["practitioner-skill"] },
    ],
    [
      "E07",
      "the only room lacks the required capability",
      ({ snapshot }) => {
        snapshot.services[0]!.requiredRoomCapability = "procedure";
      },
      { status: "blocked", primary: ["room-capability"] },
    ],
    [
      "E08",
      "patient limit and notice both apply; equal weight picks notice by ID",
      (input) => {
        input.now++;
        booking(input, { patientId: input.request.patientId, start: demoNow, end: demoNow + 15 });
      },
      { status: "blocked", primary: ["min-notice"], also: ["patient-daily-limit"] },
    ],
    [
      "E09",
      "requested practitioner is on leave while another is available",
      ({ snapshot, request }) => {
        const preferred = snapshot.practitioners[0]!;
        request.practitionerId = preferred.id;
        snapshot.practitioners.push({ ...preferred, id: "other-practitioner" });
        preferred.timeOff = [
          {
            id: "edge-leave",
            reason: "Synthetic leave",
            from: request.start,
            to: request.start + 15,
          },
        ];
      },
      { status: "blocked", primary: ["practitioner-time-off", "request-practitioner"] },
    ],
    [
      "E10",
      "only equipment is shared with a concurrent booking",
      (input) => {
        const { snapshot, request } = input;
        snapshot.equipment.push({
          id: "shared-unit",
          displayName: "Shared unit",
          type: "scanner",
          maintenance: [],
        });
        snapshot.services[0]!.requiredEquipmentType = "scanner";
        request.practitionerId = snapshot.practitioners[0]!.id;
        snapshot.practitioners.push({ ...snapshot.practitioners[0]!, id: "other-practitioner" });
        snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "other-room" });
        booking(input, {
          practitionerId: "other-practitioner",
          roomId: "other-room",
          equipmentId: "shared-unit",
        });
      },
      { status: "blocked", primary: ["equipment-busy"] },
    ],
    [
      "E11",
      "a maintenance interval crosses local midnight",
      ({ snapshot, request }) => {
        request.start = demoNow + 14 * 60 + 45;
        const hours = [
          { weekday: 1, from: "08:00", to: "24:00" },
          { weekday: 2, from: "00:00", to: "02:00" },
        ];
        snapshot.clinic.openingHours = hours;
        snapshot.practitioners[0]!.workingHours = hours;
        snapshot.services[0]!.durationMin = 30;
        snapshot.rooms[0]!.maintenance = [
          { id: "night-maintenance", from: request.start - 15, to: request.start + 45 },
        ];
      },
      { status: "blocked", primary: ["room-maintenance"] },
    ],
    [
      "E12",
      "exact elapsed advance limit",
      (input) => {
        input.snapshot.policy.maxAdvanceDays = 1;
        input.now = input.request.start - 1440;
      },
      { status: "bookable" },
    ],
    [
      "E13",
      "exact minimum notice",
      (input) => {
        input.now = input.request.start - 120;
      },
      { status: "bookable" },
    ],
    [
      "E14",
      "one confirmed appointment exactly reaches the practitioner cap",
      (input) => {
        input.snapshot.practitioners[0]!.dailyCap = 1;
        booking(input, { start: demoNow, end: demoNow + 15 });
      },
      { status: "blocked", primary: ["practitioner-daily-cap"] },
    ],
    [
      "E15",
      "a cancelled appointment at the same time counts for neither occupancy nor daily limit",
      (input) => {
        booking(input, { patientId: input.request.patientId, status: "cancelled" });
      },
      { status: "bookable" },
    ],
    [
      "E16",
      "canonical fact tie between overlapping booking and working hours",
      (input) => {
        input.snapshot.practitioners[0]!.workingHours = [];
        booking(input);
      },
      { status: "blocked", primary: ["practitioner-busy"], also: ["practitioner-hours"] },
    ],
  ] satisfies [string, string, (input: CaseInput) => void, Expected][],
};

for (const [id, title, override, expected] of corpus.cases) {
  it(`${id} ${title}`, () => {
    const input = {
      snapshot: buildMinimalSnapshot(),
      request: buildMinimalRequest(),
      now: demoNow,
    };
    override(input);
    const result = evaluate(input.snapshot, input.request, { now: input.now });
    expect(result.status).toBe(expected.status);
    if (expected.status === "invalid_request" && result.status === "invalid_request") {
      expect(result.errors.map(({ code }) => code)).toEqual([expected.code]);
    }
    if (expected.status === "blocked" && result.status === "blocked") {
      const { facts, primary } = result.explanation;
      expect(primary.map((factId) => facts.find(({ id }) => id === factId)?.ruleId)).toEqual(
        expected.primary,
      );
      expect(facts.map(({ ruleId }) => ruleId)).toEqual(
        expect.arrayContaining("also" in expected ? expected.also : []),
      );
    }
  });
}
