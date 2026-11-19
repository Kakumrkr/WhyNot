import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { RangeExplanationSchema, type Fact, type RangeRequest } from "@whynot/contracts";
import { explainRange, isBookable, parseOffsetInstant, projectForAudience } from "@whynot/engine";
import {
  buildMinimalSnapshot,
  buildScenario,
  demoNow,
  riversideMinute,
} from "../../fixtures/src/index.js";

const request: RangeRequest = {
  patientId: "patient-test",
  serviceId: "consult",
  fromDate: "2026-11-16",
  days: 1,
};
const run = (...args: Parameters<typeof explainRange>) =>
  RangeExplanationSchema.parse(explainRange(...args));

function pairs(facts: Fact[], ids: string[]) {
  return [
    ...new Set(
      ids.map((id) => {
        const fact = facts.find((entry) => entry.id === id)!;
        return JSON.stringify([fact.ruleId, fact.subject.id]);
      }),
    ),
  ].sort();
}

for (const id of ["H9", "H10", "H11"]) {
  it(`${id} matches the authored range causes and verified opening`, () => {
    const golden: {
      now: { day: number; time: string };
      request: RangeRequest;
      commonCause: string[][];
      excludedPractitioners?: string[];
      segments?: { from: string; to: string; evidence: string[][] }[];
      nextAvailable: { day: number; time: string; practitionerId: string } | null;
    } = JSON.parse(
      readFileSync(new URL(`../../fixtures/scenarios/${id}.json`, import.meta.url), "utf8"),
    );
    const snapshot = buildScenario(id);
    const now = riversideMinute(golden.now.day, golden.now.time);
    const result = run(snapshot, golden.request, now);
    if (result.status !== "fully_blocked") throw new Error(`Expected blocked range for ${id}`);
    expect(pairs(result.facts, result.commonCause)).toEqual(
      golden.commonCause.map((pair) => JSON.stringify(pair)).sort(),
    );
    if (golden.excludedPractitioners !== undefined) {
      expect(
        result.facts
          .filter(
            ({ id, ruleId }) => ruleId === "practitioner-skill" && result.context.includes(id),
          )
          .map(({ subject }) => subject.id),
      ).toEqual(golden.excludedPractitioners);
    }
    if (golden.segments !== undefined)
      expect(
        result.segments.map((segment) => {
          if (segment.closedDay) throw new Error("H11 clinic is open");
          return [segment.from, segment.to, pairs(result.facts, segment.factIds)];
        }),
      ).toEqual(
        golden.segments.map(({ from, to, evidence }) => [
          riversideMinute(1, from),
          riversideMinute(1, to),
          evidence.map((pair) => JSON.stringify(pair)).sort(),
        ]),
      );
    if (golden.nextAvailable === null) expect(result.nextAvailable).toBeNull();
    else {
      expect(result.nextAvailable?.assignment).toMatchObject({
        practitionerId: golden.nextAvailable.practitionerId,
        start: riversideMinute(golden.nextAvailable.day, golden.nextAvailable.time),
      });
      expect(isBookable(snapshot, result.nextAvailable?.request, now)).toBe(true);
    }
  });
}

it("keeps H1's opening separate from the H11 bookings and projection", () => {
  const slot = {
    patientId: "patient-0",
    serviceId: "minor-procedure",
    start: riversideMinute(1, "14:45"),
  };
  expect(isBookable(buildScenario("H1"), slot, demoNow)).toBe(true);
  expect(isBookable(buildScenario("H11"), slot, demoNow)).toBe(false);
  const result = run(
    buildScenario("H11"),
    { patientId: slot.patientId, serviceId: slot.serviceId, fromDate: "2026-11-17", days: 1 },
    riversideMinute(1, "08:30"),
  );
  const projected = projectForAudience(result, "patient", { requesterPatientId: slot.patientId });
  const serialized = JSON.stringify(projected);
  expect(serialized).not.toMatch(
    /h11-consult|Fictional annual leave|patient-0|consult-1|cryo-unit/,
  );
  expect(projectForAudience(projected, "patient", { requesterPatientId: slot.patientId })).toEqual(
    projected,
  );
});

it("counts only real starts fitting each opening and emits closed dates without bounds", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.durationMin = 30;
  snapshot.clinic.openingHours = [
    { weekday: 1, from: "11:01", to: "12:00" },
    { weekday: 1, from: "13:00", to: "13:30" },
  ];
  expect(run(snapshot, { ...request, days: 2 }, demoNow)).toMatchObject({
    status: "has_availability",
    bookableCount: 3,
    commonCause: [],
    context: [],
    segments: [],
  });
  snapshot.policy.minNoticeMin = 600;
  const result = run(snapshot, { ...request, days: 2 }, { now: demoNow, searchDays: 1 });
  if (result.status !== "fully_blocked") throw new Error("Expected blocked range");
  expect(result.commonCause).toEqual([]);
  expect(result.segments).toMatchObject([
    { closedDay: false, memberStarts: [riversideMinute(0, "11:15"), riversideMinute(0, "11:30")] },
    { closedDay: false, memberStarts: [riversideMinute(0, "13:00")] },
    { closedDay: true, date: "2026-11-17", memberStarts: [] },
  ]);
  expect(result.segments[2]).not.toHaveProperty("from");
});

it("preserves a preference through budget and coverage truncation before allowing a fallback", () => {
  const snapshot = buildMinimalSnapshot();
  const preferred = snapshot.practitioners[0]!;
  preferred.workingHours = [];
  const hours = [{ weekday: 2, from: "08:00", to: "08:30" }];
  snapshot.clinic.openingHours = hours;
  snapshot.practitioners.push({ ...preferred, id: "alternative", workingHours: hours });
  const wanted = { ...request, practitionerId: preferred.id };
  expect(run(snapshot, wanted, { now: demoNow, searchDays: 1, budgetEvals: 1 })).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "budget_exhausted", evaluated: 1 },
  });
  expect(run(snapshot, wanted, { now: demoNow, searchDays: 1, budgetEvals: 2 })).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "budget_exhausted", evaluated: 2 },
  });
  expect(run(snapshot, wanted, { now: demoNow, searchDays: 1, budgetEvals: 3 })).toMatchObject({
    nextSearch: { status: "complete", evaluated: 3 },
    nextAvailable: {
      assignment: { start: riversideMinute(1, "08:00"), practitionerId: "alternative" },
      changes: expect.arrayContaining([
        { field: "practitionerId", from: preferred.id, to: "alternative" },
      ]),
    },
  });
  snapshot.coverage.to = riversideMinute(1, "08:15");
  expect(run(snapshot, wanted, { now: demoNow, searchDays: 1 })).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "window_limited", evaluated: 1 },
  });
  snapshot.coverage.to = riversideMinute(1, "00:00");
  expect(run(snapshot, wanted, { now: demoNow, searchDays: 1 })).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "window_limited", from: null, to: null, evaluated: 0 },
  });
});

it("counts overlapping opening entries once and keeps valid open dates with no fitting start", () => {
  const snapshot = buildMinimalSnapshot();
  const hours = [
    { weekday: 1, from: "11:30", to: "12:30" },
    { weekday: 1, from: "11:00", to: "12:00" },
  ];
  snapshot.clinic.openingHours = hours;
  expect(run(snapshot, request, demoNow)).toMatchObject({
    status: "has_availability",
    bookableCount: 6,
  });
  snapshot.clinic.openingHours = [
    { weekday: 1, from: "11:01", to: "11:15" },
    { weekday: 2, from: "11:00", to: "12:00" },
  ];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  const result = run(snapshot, request, { now: demoNow, searchDays: 1 });
  expect(result).toMatchObject({
    status: "fully_blocked",
    commonCause: [],
    context: [],
    segments: [],
    facts: [],
    nextAvailable: { assignment: { start: riversideMinute(1, "11:00") } },
  });
  expect(
    projectForAudience(result, "patient", { requesterPatientId: request.patientId }),
  ).toMatchObject({
    nextAvailable: { assignment: { practitionerId: "practitioner-test" } },
  });
});

it("merges adjacent starts blocked by distinct booking windows and retains both facts", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.clinic.openingHours = [{ weekday: 1, from: "11:00", to: "11:30" }];
  snapshot.patients.push({ ...snapshot.patients[0]!, id: "other-patient" });
  snapshot.bookings = [0, 15].map((offset) => ({
    id: `booking-${offset}`,
    patientId: "other-patient",
    serviceId: request.serviceId,
    practitionerId: "practitioner-test",
    roomId: "room-test",
    start: demoNow + 120 + offset,
    end: demoNow + 135 + offset,
    status: "confirmed",
  }));
  const result = run(snapshot, request, { now: demoNow, searchDays: 1 });
  if (result.status !== "fully_blocked") throw new Error("Expected blocked range");
  expect(result.segments).toMatchObject([
    {
      closedDay: false,
      from: demoNow + 120,
      to: demoNow + 150,
      memberStarts: [demoNow + 120, demoNow + 135],
      factIds: result.commonCause,
    },
  ]);
  expect(result.facts.map(({ ruleId, window }) => [ruleId, window])).toEqual([
    ["practitioner-busy", { from: demoNow + 120, to: demoNow + 135 }],
    ["practitioner-busy", { from: demoNow + 135, to: demoNow + 150 }],
  ]);
});

it("validates references, dates, day counts, the clock and requested coverage", () => {
  const snapshot = buildMinimalSnapshot();
  for (const [candidate, now] of [
    [{ ...request, practitionerId: "unknown" }, demoNow],
    [{ ...request, days: 8 }, demoNow],
    [{ ...request, fromDate: "2026-02-30" }, demoNow],
    [{ ...request, fromDate: "2026-11-15" }, demoNow],
    [request, { now: demoNow, budgetEvals: 0 }],
  ] as const)
    expect(run(snapshot, candidate, now).status).toBe("invalid_request");
});

it("preserves both grid starts during a fold and rejects an ambiguous recurring opening", () => {
  function minute(iso: string) {
    const result = parseOffsetInstant(iso);
    if (!result.ok) throw new Error("Expected an explicit test instant");
    return result.value;
  }
  const snapshot = buildMinimalSnapshot();
  snapshot.coverage = {
    from: minute("2026-10-25T00:00:00+01:00"),
    to: minute("2026-10-27T00:00:00Z"),
  };
  snapshot.clinic.openingHours = [{ weekday: 7, from: "00:30", to: "03:00" }];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  snapshot.services[0]!.eligibility = "referral_required";
  const wanted = { ...request, fromDate: "2026-10-25" };
  const options = { now: snapshot.coverage.from, searchDays: 1 };
  const result = run(snapshot, wanted, options);
  if (result.status !== "fully_blocked") throw new Error("Expected blocked range");
  const members = result.segments.flatMap(({ memberStarts }) => memberStarts);
  expect(members).toHaveLength(14);
  expect(members).toContain(minute("2026-10-25T01:00:00+01:00"));
  expect(members).toContain(minute("2026-10-25T01:00:00Z"));
  snapshot.clinic.openingHours[0]!.from = "01:15";
  expect(run(snapshot, wanted, options)).toMatchObject({
    status: "invalid_request",
    errors: [{ code: "unsupported_wall_time" }],
  });
});

it("includes the 14th forward day and excludes the next calendar date", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.clinic.closedDates = ["2026-11-16", "2026-11-23"];
  const options = { now: demoNow };
  expect(run(snapshot, request, options)).toMatchObject({
    nextAvailable: { assignment: { start: riversideMinute(14, "08:00") } },
  });
  snapshot.clinic.closedDates.push("2026-11-30");
  expect(run(snapshot, request, options)).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "complete", to: riversideMinute(15, "00:00"), evaluated: 0 },
  });
});

it("counts and finds appointments across touching same-day and overnight openings", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.durationMin = 30;
  snapshot.clinic.openingHours = [
    { weekday: 2, from: "11:00", to: "11:15" },
    { weekday: 2, from: "11:15", to: "11:30" },
  ];
  snapshot.practitioners[0]!.workingHours = [{ weekday: 2, from: "11:00", to: "11:30" }];
  const tuesday = { ...request, fromDate: "2026-11-17" };
  const options = { now: demoNow, searchDays: 1 };
  expect(run(snapshot, tuesday, options)).toMatchObject({
    status: "has_availability",
    bookableCount: 1,
  });
  expect(run(snapshot, request, options)).toMatchObject({
    nextAvailable: { assignment: { start: riversideMinute(1, "11:00") } },
  });

  snapshot.clinic.openingHours = [
    { weekday: 2, from: "23:45", to: "24:00" },
    { weekday: 3, from: "00:00", to: "00:15" },
  ];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  expect(run(snapshot, tuesday, options)).toMatchObject({
    status: "has_availability",
    bookableCount: 1,
  });
  const opening = run(snapshot, request, options);
  expect(opening).toMatchObject({
    nextAvailable: {
      assignment: { start: riversideMinute(1, "23:45"), end: riversideMinute(2, "00:15") },
    },
  });
  if (opening.status !== "fully_blocked") throw new Error("Expected a next opening");
  expect(isBookable(snapshot, opening.nextAvailable?.request, demoNow)).toBe(true);

  snapshot.coverage.to = riversideMinute(2, "00:00");
  expect(run(snapshot, tuesday, options)).toMatchObject({
    status: "invalid_request",
    errors: [{ code: "outside_coverage" }],
  });
  expect(run(snapshot, request, options)).toMatchObject({
    nextAvailable: null,
    nextSearch: { status: "window_limited", evaluated: 0 },
  });
});

it("keeps different-cause start windows disjoint across a local grid gap", () => {
  const snapshot = buildMinimalSnapshot();
  const midnight = parseOffsetInstant("2026-03-29T00:00:00Z");
  const nextDate = parseOffsetInstant("2026-03-30T00:00:00+01:00");
  const lateStart = parseOffsetInstant("2026-03-29T02:15:00+01:00");
  if (!midnight.ok || !nextDate.ok || !lateStart.ok) throw new Error("Expected explicit instants");
  snapshot.coverage = { from: midnight.value, to: nextDate.value + 1440 };
  snapshot.clinic.slotGridMinutes = 45;
  snapshot.clinic.openingHours = [{ weekday: 7, from: "00:00", to: "04:00" }];
  snapshot.practitioners[0]!.workingHours = [{ weekday: 7, from: "00:00", to: "00:30" }];
  snapshot.policy.minNoticeMin = 60;
  const result = run(
    snapshot,
    { ...request, fromDate: "2026-03-29" },
    { now: midnight.value, searchDays: 1 },
  );
  if (result.status !== "fully_blocked") throw new Error("Expected blocked range");
  expect(result.commonCause).toEqual([]);
  expect(result.segments).toMatchObject([
    { closedDay: false, from: midnight.value, to: lateStart.value },
    { closedDay: false, from: lateStart.value },
  ]);
  expect(
    result.segments.map(({ factIds }) => [
      ...new Set(result.facts.filter(({ id }) => factIds.includes(id)).map(({ ruleId }) => ruleId)),
    ]),
  ).toEqual([["min-notice"], ["practitioner-hours"]]);
});
