import fc from "fast-check";
import { expect, it } from "vitest";
import {
  StaffEvaluationSchema,
  type Alternative,
  type BookingRequest,
  type CostWeights,
  type EvaluateOptions,
} from "@whynot/contracts";
import { evaluate } from "@whynot/engine";
import { buildMinimalRequest, buildMinimalSnapshot } from "../../fixtures/src/index.js";
import { referenceAssignment } from "./reference/feasibility.js";

const day = 1440;
const midnight = Date.UTC(2026, 10, 16) / 60000;
const start = midnight + 12 * 60;
const now = midnight - day;
const weights = { timeOfDay: 1, day: 6, practitioner: 8, earlier: 0.1 };

function blocked(
  snapshot: ReturnType<typeof buildMinimalSnapshot>,
  request: BookingRequest,
  options: Partial<EvaluateOptions> = {},
) {
  const result = evaluate(snapshot, request, { now, trace: true, ...options });
  if (result.status !== "blocked") throw new Error(`Expected blocked, got ${result.status}`);
  return result;
}

function tinyClinic(first: number, last: number) {
  const snapshot = buildMinimalSnapshot();
  snapshot.clinic.timezone = "UTC";
  snapshot.clinic.slotGridMinutes = 360;
  snapshot.clinic.openingHours = [1, 2, 7].map((weekday) => ({
    weekday,
    from: "00:00",
    to: "24:00",
  }));
  snapshot.coverage = { from: midnight + first, to: midnight + last };
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  snapshot.practitioners.push({ ...snapshot.practitioners[0]!, id: "doctor-b" });
  snapshot.policy.minNoticeMin = 0;
  snapshot.rooms[0]!.maintenance = [{ id: "canonical-block", from: start, to: start + 15 }];
  return snapshot;
}

it("rejects zero and invalid evaluation budgets, and distinguishes a cap from completion at the cap", () => {
  const snapshot = tinyClinic(12 * 60, 18 * 60 + 15);
  const request = buildMinimalRequest({ start });
  const alternatives = { max: 3, searchDays: 0, budgetEvals: 1 };
  for (const budgetEvals of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
    expect(
      evaluate(snapshot, request, { now, alternatives: { ...alternatives, budgetEvals } }).status,
    ).toBe("invalid_request");
  const atCap = blocked(snapshot, request, { alternatives });
  expect(atCap.search).toEqual({
    status: "window_limited",
    from: start,
    to: midnight + 18 * 60 + 15,
    evaluated: 1,
  });
  expect(atCap.alternatives).toHaveLength(1);
  const complete = blocked(tinyClinic(0, day), request, {
    alternatives: { ...alternatives, budgetEvals: 3 },
  });
  expect(complete.search).toEqual({
    status: "complete",
    from: midnight,
    to: midnight + day,
    evaluated: 3,
  });
});

it("reports incomplete empty and partial results and the actual attempted interval at budget one", () => {
  const snapshot = tinyClinic(0, day);
  const request = buildMinimalRequest({ start });
  const cap = { max: 3, searchDays: 0, budgetEvals: 1 };
  const partial = blocked(snapshot, request, { alternatives: cap });
  expect(partial.alternatives).toHaveLength(1);
  const later = midnight + 18 * 60;
  expect(partial.search).toEqual({
    status: "budget_exhausted",
    from: later,
    to: later + 15,
    evaluated: 1,
  });
  snapshot.practitioners.length = 0;
  const empty = blocked(snapshot, request, { alternatives: cap });
  expect(empty.alternatives).toEqual([]);
  expect(empty.search).toEqual(partial.search);
  expect(empty.trace?.alternatives).toEqual([
    { request: { ...request, start: later }, bookable: false },
  ]);
  const noEligibleStart = blocked(snapshot, request, {
    now: midnight + day,
    alternatives: { ...cap, searchDays: 1 },
  });
  expect(noEligibleStart.search).toEqual({
    status: "window_limited",
    from: midnight,
    to: midnight + day,
    evaluated: 0,
  });
});

it("reports a window limit when a late start needs coverage beyond the final local date", () => {
  const snapshot = tinyClinic(0, day);
  snapshot.clinic.slotGridMinutes = 15;
  snapshot.clinic.openingHours = [
    { weekday: 1, from: "23:45", to: "24:00" },
    { weekday: 2, from: "00:00", to: "00:15" },
  ];
  for (const practitioner of snapshot.practitioners)
    practitioner.workingHours = snapshot.clinic.openingHours;
  snapshot.services[0]!.durationMin = 30;
  const request = buildMinimalRequest({ start });
  const options = { alternatives: { max: 1, searchDays: 0, budgetEvals: 3000 } };
  const clipped = blocked(snapshot, request, options);
  expect(clipped.alternatives).toEqual([]);
  expect(clipped.search.status).toBe("window_limited");
  snapshot.coverage.to += 15;
  const full = blocked(snapshot, request, options);
  expect(full.search.status).toBe("complete");
  expect(full.alternatives[0]?.assignment).toMatchObject({
    start: midnight + day - 15,
    end: midnight + day + 15,
  });
});

it("keeps a finite winner when larger costs overflow outside the requested results", () => {
  const snapshot = tinyClinic(0, day);
  snapshot.clinic.slotGridMinutes = 15;
  const request = buildMinimalRequest({ start });
  const options = {
    alternatives: { max: 1, searchDays: 0, budgetEvals: 3000 },
    costWeights: { timeOfDay: Number.MAX_VALUE, day: 1, practitioner: 1, earlier: 0 },
  };
  const result = blocked(snapshot, request, options);
  expect(result.alternatives).toHaveLength(1);
  expect(result.alternatives[0]).toMatchObject({
    request: { start: start - 15 },
    cost: Number.MAX_VALUE,
  });
});

function cost(clock: number, offset: number, changed: boolean, candidate: number, w: CostWeights) {
  return (
    (Math.abs(clock - 720) / 15) * w.timeOfDay +
    Math.abs(offset) * w.day +
    (candidate < start ? w.earlier : 0) +
    (changed ? w.practitioner : 0)
  );
}

it(
  "P6/P7/P16: agrees with an exhaustive independent reference for tiny UTC domains",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(
        fc.record({
          radius: fc.integer({ min: 0, max: 1 }),
          budget: fc.integer({ min: 1, max: 29 }),
          max: fc.integer({ min: 1, max: 6 }),
          preference: fc.boolean(),
          clipStart: fc.boolean(),
          clipEnd: fc.boolean(),
          notice: fc.integer({ min: 0, max: day + 720 }),
          bookableMask: fc.integer({ min: 0, max: 4095 }),
          customWeights: fc.boolean(),
        }),
        ({
          radius,
          budget,
          max,
          preference,
          clipStart,
          clipEnd,
          notice,
          bookableMask,
          customWeights,
        }) => {
          const coverageFrom = -radius * day + (clipStart ? 360 : 0);
          const coverageTo = (radius + 1) * day - (clipEnd ? 360 : 0);
          const snapshot = tinyClinic(coverageFrom, coverageTo);
          snapshot.policy.minNoticeMin = notice;
          snapshot.practitioners[0]!.timeOff = Array.from({ length: 12 }, (_, index) => ({
            id: `leave-${index}`,
            from: midnight - day + index * 360,
            to: midnight - day + index * 360 + 15,
            reason: "Synthetic leave",
          })).filter((_, index) => (bookableMask & (1 << index)) === 0);
          const preferred = snapshot.practitioners[0]!.id;
          const request = buildMinimalRequest({
            start,
            ...(preference ? { practitionerId: preferred } : {}),
          });
          const costWeights = customWeights
            ? { timeOfDay: 0.5, day: 3, practitioner: 2, earlier: 0 }
            : weights;
          const possible: {
            request: BookingRequest;
            cost: number;
            category: Alternative["category"];
          }[] = [];
          for (let offset = -radius; offset <= radius; offset++)
            for (const clock of [0, 360, 720, 1080]) {
              const candidate = midnight + offset * day + clock;
              if (
                candidate < midnight + coverageFrom ||
                candidate + 15 > midnight + coverageTo ||
                candidate < now + notice
              )
                continue;
              for (const practitionerId of preference ? [preferred, "doctor-b"] : [undefined]) {
                const changed = practitionerId !== request.practitionerId;
                if (candidate === start && !changed) continue;
                possible.push({
                  request: {
                    ...request,
                    start: candidate,
                    ...(practitionerId === undefined ? {} : { practitionerId }),
                  },
                  cost: cost(clock, offset, changed, candidate, costWeights),
                  category:
                    offset !== 0 ? "other-day" : changed ? "other-practitioner" : "same-day",
                });
              }
            }
          possible.sort(
            (a, b) =>
              a.cost - b.cost ||
              a.request.start - b.request.start ||
              (a.request.practitionerId! < b.request.practitionerId!
                ? -1
                : a.request.practitionerId === b.request.practitionerId
                  ? 0
                  : 1),
          );
          const prefix = possible.slice(0, budget);
          const checked = prefix.map((entry) => ({
            ...entry,
            assignment: referenceAssignment(snapshot, entry.request, now),
          }));
          const verified = checked.flatMap((entry) =>
            entry.assignment === null ? [] : [{ ...entry, assignment: entry.assignment }],
          );
          const firstPerCategory = ["same-day", "other-practitioner", "other-day"]
            .map((category) => verified.findIndex((entry) => entry.category === category))
            .filter((index) => index !== -1)
            .sort((a, b) => a - b);
          const expected = [
            ...firstPerCategory.map((index) => verified[index]!),
            ...verified.filter((_, index) => !firstPerCategory.includes(index)),
          ].slice(0, max);
          const before = structuredClone({ snapshot, request });
          Object.freeze(snapshot);
          Object.freeze(request);
          const result = blocked(snapshot, request, {
            alternatives: { max, searchDays: radius, budgetEvals: budget },
            costWeights,
          });
          expect({ snapshot, request }).toEqual(before);
          expect(StaffEvaluationSchema.safeParse(result).success).toBe(true);
          for (const alternative of result.alternatives) {
            expect(alternative.changes).toEqual([
              ...(alternative.request.start === start
                ? []
                : [{ field: "start", from: start, to: alternative.request.start }]),
              ...(alternative.request.practitionerId === request.practitionerId
                ? []
                : [{ field: "practitionerId", from: preferred, to: "doctor-b" }]),
            ]);
          }
          expect(
            result.alternatives.map(({ request, assignment, category, cost }) => ({
              request,
              assignment,
              category,
              cost,
            })),
          ).toEqual(expected);
          expect(
            new Set(
              result.alternatives.map(({ assignment }) =>
                JSON.stringify([assignment.start, assignment.practitionerId]),
              ),
            ).size,
          ).toBe(result.alternatives.length);
          expect(result.trace?.alternatives).toEqual(
            checked.map((entry) => ({
              request: entry.request,
              bookable: entry.assignment !== null,
            })),
          );
          expect(result.search).toEqual({
            status:
              possible.length > budget
                ? "budget_exhausted"
                : clipStart || clipEnd
                  ? "window_limited"
                  : "complete",
            from:
              possible.length > budget
                ? Math.min(...prefix.map((entry) => entry.request.start))
                : midnight + coverageFrom,
            to:
              possible.length > budget
                ? Math.max(...prefix.map((entry) => entry.request.start)) + 15
                : midnight + coverageTo,
            evaluated: prefix.length,
          });
        },
      ),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);

it("keeps both fold instants on the local grid and uses the earlier penalty only by instant", () => {
  const fold = Date.UTC(2026, 9, 25, 0, 30) / 60000;
  const snapshot = buildMinimalSnapshot();
  snapshot.policy.minNoticeMin = 0;
  snapshot.clinic.openingHours = [{ weekday: 7, from: "00:00", to: "04:00" }];
  snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
  snapshot.coverage = { from: fold - 90, to: fold + 24 * 60 };
  snapshot.rooms[0]!.maintenance = [{ id: "first-fold", from: fold, to: fold + 15 }];
  const result = blocked(
    snapshot,
    { ...buildMinimalRequest(), start: fold },
    {
      now: fold - 90,
      alternatives: { max: 1, searchDays: 0, budgetEvals: 1 },
    },
  );
  expect(result.alternatives[0]).toMatchObject({
    request: { start: fold + 60 },
    cost: 0,
    category: "same-day",
  });
});

it.each([15, 61])(
  "checks every local date during a %i-minute midnight rollback appointment",
  (durationMin) => {
    const firstMidnight = Date.parse("2009-11-01T03:00:00Z") / 60000;
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.timezone = "America/Goose_Bay";
    snapshot.coverage = { from: firstMidnight - 180, to: firstMidnight + 180 };
    snapshot.policy.minNoticeMin = 0;
    snapshot.services[0]!.durationMin = durationMin;
    snapshot.clinic.openingHours = [{ weekday: 7, from: "00:01", to: "04:00" }];
    snapshot.practitioners[0]!.workingHours = snapshot.clinic.openingHours;
    const request = { ...buildMinimalRequest(), start: firstMidnight };
    const atRollback = blocked(snapshot, request, {
      now: snapshot.coverage.from,
      alternatives: false,
    });
    expect(atRollback.explanation.facts).toContainEqual(
      expect.objectContaining({
        ruleId: "clinic-closed-day",
        params: { date: "2009-10-31" },
      }),
    );
    const secondMidnight = { ...request, start: firstMidnight + 60 };
    const search = blocked(snapshot, secondMidnight, {
      now: snapshot.coverage.from,
      alternatives: { max: 1, searchDays: 0, budgetEvals: 1 },
    });
    expect(search.trace?.alternatives).toEqual([{ request, bookable: false }]);
  },
);

it("defaults to three results, fourteen local days, and a 3000-attempt trace cap", () => {
  const snapshot = tinyClinic(-day, 16 * day);
  snapshot.clinic.slotGridMinutes = 1;
  const request = buildMinimalRequest({ start });
  const result = blocked(snapshot, request);
  expect(result.alternatives).toHaveLength(3);
  expect(result.search).toMatchObject({ status: "budget_exhausted", evaluated: 3000 });
  expect(result.trace?.alternativesTruncated).toBe(false);
  const extended = blocked(snapshot, request, {
    alternatives: { max: 3, searchDays: 14, budgetEvals: 3001 },
  });
  expect(extended.search.evaluated).toBe(3001);
  expect(extended.trace?.alternatives).toHaveLength(3000);
  expect(extended.trace?.alternativesTruncated).toBe(true);
  snapshot.clinic.slotGridMinutes = 360;
  expect(blocked(snapshot, request).search).toMatchObject({
    status: "window_limited",
    from: midnight - day,
    to: midnight + 15 * day,
  });
});

it("orders equal rounded costs by instant over a large domain at budget one", () => {
  const first = Date.parse("0001-01-01T00:00:00Z") / 60000;
  const snapshot = tinyClinic(first - midnight, 18 * 60);
  const request = buildMinimalRequest({ start });
  const result = blocked(snapshot, request, {
    now: first,
    alternatives: { max: 1, searchDays: Number.MAX_SAFE_INTEGER, budgetEvals: 1 },
    costWeights: { timeOfDay: 100, day: Number.MIN_VALUE, practitioner: 8, earlier: 1 },
  });
  expect(result.search).toMatchObject({ status: "budget_exhausted", evaluated: 1 });
  expect(result.trace?.alternatives[0]?.request.start).toBe(first + 720);
});
