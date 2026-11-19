import fc from "fast-check";
import { expect, it } from "vitest";
import { PatientRangeExplanationSchema, type Booking, type RangeRequest } from "@whynot/contracts";
import { evaluate, explainRange, projectForAudience } from "@whynot/engine";
import { buildMinimalSnapshot, demoNow, riversideMinute } from "../../fixtures/src/index.js";
import { referenceRows } from "./reference/feasibility.js";

const numRuns = Number(process.env.FC_NUM_RUNS ?? 500);
const fromDate = "2026-11-16";
const dates = [fromDate, "2026-11-17", "2026-11-18"];
const starts = dates.map((_, day) =>
  [0, 15, 30, 45].map((offset) => riversideMinute(day, "11:00") + offset),
);
const hours = [1, 2, 3].map((weekday) => ({ weekday, from: "11:00", to: "12:00" }));

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

it(
  "P13/P14: range membership, common proof, forward search and projection match their independent obligations",
  { timeout: 120000 },
  () => {
    fc.assert(
      fc.property(
        fc.record({
          days: fc.integer({ min: 1, max: 2 }),
          closed: fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }),
          notice: fc.integer({ min: 100, max: 200 }),
          referral: fc.boolean(),
          preferred: fc.boolean(),
          missing: fc.boolean(),
          privateLeave: fc.boolean(),
          booked: fc.array(fc.boolean(), { minLength: 3, maxLength: 3 }),
          budgetEvals: fc.integer({ min: 1, max: 9 }),
        }),
        ({
          days,
          closed,
          notice,
          referral,
          preferred,
          missing,
          privateLeave,
          booked,
          budgetEvals,
        }) => {
          const snapshot = buildMinimalSnapshot();
          snapshot.clinic.openingHours = hours;
          snapshot.clinic.closedDates = dates.filter((_, index) => closed[index]);
          const doctor = snapshot.practitioners[0]!;
          const other = { ...doctor, id: "other-practitioner", workingHours: hours };
          doctor.workingHours = hours.slice(0, 2);
          if (privateLeave)
            doctor.timeOff = [
              {
                id: "private-leave-id",
                reason: "private-reason",
                from: starts[0]![0]!,
                to: starts[1]![3]! + 15,
              },
            ];
          snapshot.practitioners.push(other);
          snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "other-room" });
          snapshot.patients.push({ ...snapshot.patients[0]!, id: "private-other-patient" });
          const request: RangeRequest = {
            fromDate,
            days,
            serviceId: "consult",
            patientId: "patient-test",
            ...(preferred ? { practitionerId: doctor.id } : {}),
          };
          snapshot.policy.minNoticeMin = notice;
          if (referral) snapshot.services[0]!.eligibility = "referral_required";
          if (missing) snapshot.rooms = [];
          else
            snapshot.bookings = booked.flatMap((occupied, day): Booking[] =>
              occupied
                ? [
                    {
                      id: `private-booking-${day}`,
                      patientId: "private-other-patient",
                      serviceId: "consult",
                      practitionerId: doctor.id,
                      roomId: "room-test",
                      start: starts[day]![1]!,
                      end: starts[day]![2]!,
                      status: "confirmed",
                    },
                  ]
                : [],
            );
          const options = { now: demoNow, searchDays: 1, budgetEvals };
          const reordered = structuredClone(snapshot);
          for (const entries of [
            reordered.bookings,
            reordered.practitioners,
            reordered.rooms,
            reordered.patients,
            reordered.clinic.closedDates,
          ])
            entries.reverse();
          freeze(snapshot);
          freeze(request);
          const actual = explainRange(snapshot, request, options);
          expect(explainRange(reordered, request, options)).toEqual(actual);

          function bookable(start: number, practitionerId?: string) {
            const { patientId, serviceId } = request;
            return referenceRows(
              snapshot,
              {
                start,
                patientId,
                serviceId,
                ...(practitionerId === undefined ? {} : { practitionerId }),
              },
              demoNow,
            ).some(({ rules }) => rules.length === 0);
          }
          const eligible = starts
            .slice(0, days)
            .flatMap((day, index) => (closed[index] ? [] : day));
          const count = eligible.filter((start) => bookable(start, request.practitionerId)).length;
          if (count > 0) {
            expect(actual).toMatchObject({
              status: "has_availability",
              bookableCount: count,
              segments: [],
              commonCause: [],
              context: [],
            });
            return;
          }
          if (actual.status !== "fully_blocked")
            throw new Error("Expected a fully blocked generated range");
          expect(actual.segments.flatMap(({ memberStarts }) => memberStarts)).toEqual(eligible);
          expect(
            actual.segments.filter(({ closedDay }) => closedDay).map(({ date }) => date),
          ).toEqual(dates.slice(0, days).filter((_, index) => closed[index]));
          const projected = PatientRangeExplanationSchema.parse(
            projectForAudience(actual, "patient", { requesterPatientId: request.patientId }),
          );
          expect(JSON.stringify(projected)).not.toMatch(
            /private-|patient-test|room-test|other-room|practitioner-time-off|timeOffId|bookingId/,
          );

          for (const segment of actual.segments) {
            if (segment.closedDay) {
              expect(
                actual.facts.some(
                  ({ id, ruleId }) =>
                    segment.factIds.includes(id) && ruleId === "clinic-closed-day",
                ),
              ).toBe(true);
              if (actual.commonCause.length > 0)
                expect(actual.commonCause).toEqual(expect.arrayContaining(segment.factIds));
              continue;
            }
            for (const start of segment.memberStarts) {
              const { patientId, serviceId, practitionerId } = request;
              const evaluated = evaluate(
                snapshot,
                {
                  patientId,
                  serviceId,
                  start,
                  ...(practitionerId === undefined ? {} : { practitionerId }),
                },
                { now: demoNow, trace: true, alternatives: false, includeAdminFix: false },
              );
              if (evaluated.status !== "blocked" || evaluated.trace === undefined)
                throw new Error("Expected complete slot evidence");
              const proof = new Set(
                actual.commonCause.length > 0
                  ? actual.commonCause
                  : [...segment.factIds, ...actual.context],
              );
              if (evaluated.explanation.basis === "missing_resource") {
                expect(proof.has(evaluated.explanation.facts[0]!.id)).toBe(true);
              } else {
                expect(evaluated.trace.candidates.length).toBeGreaterThan(0);
                expect(
                  evaluated.trace.candidates.every(({ factIds }) =>
                    factIds.some((id) => proof.has(id)),
                  ),
                ).toBe(true);
              }
            }
          }
          const following = closed[days] ? [] : starts[days]!;
          const tiers =
            request.practitionerId === undefined
              ? [undefined]
              : [request.practitionerId, undefined];
          const attempts = tiers.flatMap((practitionerId) =>
            following.map((start) => ({ start, practitionerId })),
          );
          const first = attempts
            .slice(0, budgetEvals)
            .findIndex(({ start, practitionerId }) => bookable(start, practitionerId));
          if (first >= 0) {
            expect(actual.nextAvailable?.assignment.start).toBe(attempts[first]!.start);
            expect(actual.nextSearch).toMatchObject({ status: "complete", evaluated: first + 1 });
            const opening = actual.nextAvailable!;
            expect(bookable(opening.request.start, opening.request.practitionerId)).toBe(true);
            expect(opening.changes.some(({ field }) => field === "practitionerId")).toBe(
              preferred && attempts[first]!.practitionerId === undefined,
            );
          } else {
            expect(actual.nextAvailable).toBeNull();
            expect(actual.nextSearch.status).toBe(
              attempts.length > budgetEvals ? "budget_exhausted" : "complete",
            );
          }
        },
      ),
      { numRuns },
    );
  },
);
