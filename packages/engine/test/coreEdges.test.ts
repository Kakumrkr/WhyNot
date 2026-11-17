import { expect, it } from "vitest";
import fc from "fast-check";
import { DateTime } from "luxon";
import { resolveRecurringBoundary } from "@whynot/engine";
import { evaluate, localDate, datedSchedule, parseOffsetInstant } from "@whynot/engine";
import type { ClinicSnapshot, BookingRequest } from "@whynot/contracts";
import { bookingLocalDates, validatedDatedSchedules } from "../src/time.js";
import { buildMinimalSnapshot, buildMinimalRequest, demoNow } from "../../fixtures/src/index.js";
import { booking } from "./requestTestHelpers.js";

const edges: {
  name: string;
  setup: (s: ClinicSnapshot, r: BookingRequest) => void;
  expected: string[];
}[] = [
  {
    name: "closing boundary",
    setup: (_s, r) => {
      r.start = demoNow + 525;
    },
    expected: [],
  },
  {
    name: "closing overflow",
    setup: (_s, r) => {
      r.start = demoNow + 540;
    },
    expected: ["clinic-hours"],
  },
  {
    name: "break starts at appointment end",
    setup: (s) => {
      s.practitioners[0]!.breaks = [{ weekday: 1, from: "11:15", to: "11:30" }];
    },
    expected: [],
  },
  {
    name: "break starts at appointment start",
    setup: (s) => {
      s.practitioners[0]!.breaks = [{ weekday: 1, from: "11:00", to: "11:15" }];
    },
    expected: ["practitioner-break"],
  },
  {
    name: "adjacent booking",
    setup: (s, r) => {
      s.policy.patientMaxBookingsPerDay = 5;
      s.bookings = [booking(r.start - 15)];
    },
    expected: [],
  },
  {
    name: "zero buffers",
    setup: (s, r) => {
      s.policy.patientMaxBookingsPerDay = 5;
      s.bookings = [booking(r.start + 15)];
    },
    expected: [],
  },
  {
    name: "no qualified practitioner",
    setup: (s) => {
      s.practitioners[0]!.skills = [];
    },
    expected: ["practitioner-skill"],
  },
  {
    name: "no capable room",
    setup: (s) => {
      s.services[0]!.requiredRoomCapability = "imaging";
    },
    expected: ["room-capability"],
  },
  {
    name: "patient limit plus notice canonical tie",
    setup: (s, r) => {
      s.bookings = [booking(r.start - 60)];
      s.policy.minNoticeMin = 121;
    },
    expected: ["min-notice"],
  },
  {
    name: "preference plus leave",
    setup: (s, r) => {
      r.practitionerId = "practitioner-test";
      s.practitioners.push({ ...s.practitioners[0]!, id: "other" });
      s.practitioners[0]!.timeOff = [
        { id: "leave", from: r.start, to: r.start + 60, reason: "Fictional" },
      ];
    },
    expected: ["practitioner-time-off", "request-practitioner"],
  },
  {
    name: "equipment-only occupancy",
    setup: (s, r) => {
      s.services[0]!.requiredEquipmentType = "scanner";
      s.equipment = [{ id: "unit", displayName: "Scanner", type: "scanner", maintenance: [] }];
      s.policy.patientMaxBookingsPerDay = 5;
      s.practitioners.push({ ...s.practitioners[0]!, id: "other" });
      s.rooms.push({ ...s.rooms[0]!, id: "other" });
      s.bookings = [
        booking(r.start, { equipmentId: "unit", practitionerId: "other", roomId: "other" }),
      ];
    },
    expected: ["equipment-busy"],
  },
  {
    name: "maintenance midnight adjacency",
    setup: (s, r) => {
      s.rooms[0]!.maintenance = [{ id: "maintenance", from: r.start - 660, to: r.start - 645 }];
    },
    expected: [],
  },
  {
    name: "advance exact boundary",
    setup: (s, r) => {
      s.policy.maxAdvanceDays = 1;
      r.start = demoNow + 1440;
      s.clinic.openingHours.push({ weekday: 2, from: "08:00", to: "18:00" });
      s.practitioners[0]!.workingHours = s.clinic.openingHours;
    },
    expected: [],
  },
  { name: "exact notice", setup: () => {}, expected: [] },
  {
    name: "exact daily cap",
    setup: (s, r) => {
      s.policy.patientMaxBookingsPerDay = 5;
      s.practitioners[0]!.dailyCap = 1;
      s.bookings = [booking(r.start - 60)];
    },
    expected: ["practitioner-daily-cap"],
  },
  {
    name: "cancelled booking",
    setup: (s, r) => {
      s.bookings = [booking(r.start, { status: "cancelled" })];
    },
    expected: [],
  },
];
for (const edge of edges)
  it(`core authored edge: ${edge.name}`, () => {
    const s = buildMinimalSnapshot(),
      r = buildMinimalRequest();
    edge.setup(s, r);
    const result = evaluate(s, r, { now: demoNow });
    expect(result.status).toBe(edge.expected.length === 0 ? "bookable" : "blocked");
    if (result.status === "blocked")
      expect(
        result.explanation.primary
          .map((id) => result.explanation.facts.find((f) => f.id === id)!.ruleId)
          .sort(),
      ).toEqual([...edge.expected].sort());
  });

it(
  "batch dates match individual conversion across DST, midnight, historical offsets and supported-year limits",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -100000000, max: 100000000 }), { maxLength: 25 }),
        fc.constantFrom(
          "Europe/London",
          "Asia/Kolkata",
          "America/Chicago",
          "Africa/Monrovia",
          "Pacific/Apia",
          "UTC",
        ),
        (minutes, zone) => {
          const expected = minutes.map((minute) => localDate(minute, zone));
          const result = bookingLocalDates(
            minutes.map((start, i) => ({ id: String(i), start })),
            zone,
          );
          expect(result.ok).toBe(expected.every((entry) => entry.ok));
          if (result.ok)
            expected.forEach((entry, i) => {
              if (!entry.ok) throw new Error("Expected successful date");
              expect(result.value.get(String(i))).toBe(entry.value);
            });
        },
      ),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
    for (const iso of [
      "0000-01-01T00:00:00Z",
      "9999-12-31T23:59:00Z",
      "2026-03-29T01:00:00Z",
      "2026-10-25T01:00:00Z",
    ]) {
      const parsed = parseOffsetInstant(iso);
      if (!parsed.ok) throw new Error("Authored instant invalid");
      for (const zone of ["Europe/London", "Asia/Kolkata", "Pacific/Apia", "UTC"]) {
        const expected = localDate(parsed.value, zone),
          actual = bookingLocalDates([{ id: "booking", start: parsed.value }], zone);
        expect(actual.ok).toBe(expected.ok);
        if (actual.ok && expected.ok) expect(actual.value.get("booking")).toBe(expected.value);
      }
    }
    expect(bookingLocalDates([{ id: "invalid", start: Number.MAX_SAFE_INTEGER }], "UTC").ok).toBe(
      false,
    );
  },
);

it("batched schedules preserve individual DST boundary errors and dated intervals", () => {
  const schedules = [
    [{ weekday: 7, from: "01:30", to: "03:00" }],
    [{ weekday: 7, from: "00:00", to: "24:00" }],
    [],
  ];
  for (const date of ["2026-03-29", "2026-10-25", "2026-11-15"]) {
    const expected = schedules.map((s) => datedSchedule(s, date, "Europe/London"));
    const actual = validatedDatedSchedules(schedules, date, "Europe/London");
    expect(actual.ok).toBe(expected.every((entry) => entry.ok));
    if (actual.ok)
      expect(actual.value).toEqual(
        expected.map((entry) => {
          if (!entry.ok) throw new Error("Expected valid schedule");
          return entry.value;
        }),
      );
  }
});

it(
  "recurring-boundary shortcut agrees with Luxon's full ambiguity search",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 * 150 }),
        fc.integer({ min: 0, max: 1439 }),
        fc.constantFrom(
          "Europe/London",
          "America/Chicago",
          "Pacific/Apia",
          "Asia/Kolkata",
          "Australia/Lord_Howe",
        ),
        (day, minute, zone) => {
          const base = DateTime.fromMillis(0, { zone: "UTC" })
            .set({ year: 1900, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 })
            .plus({ days: day });
          const date = base.toISODate()!;
          const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
          const local = base
            .set({ hour: Math.floor(minute / 60), minute: minute % 60 })
            .setZone(zone, { keepLocalTime: true });
          const expected =
            local.toISODate() === date &&
            local.hour === Math.floor(minute / 60) &&
            local.minute === minute % 60 &&
            local.getPossibleOffsets().length === 1 &&
            Number.isSafeInteger(local.toMillis() / 60000);
          const actual = resolveRecurringBoundary(date, clock, zone);
          expect(actual.ok).toBe(expected);
          if (actual.ok) expect(actual.value).toBe(local.toMillis() / 60000);
        },
      ),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);
