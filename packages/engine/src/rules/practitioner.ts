import type { Fact, Practitioner } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import { datedSchedule, intervalsOverlap } from "../time.js";
import type { RuleContext } from "../validateRequest.js";
import { canonicalFacts, intervalLookup, occupancyFacts } from "./resourceIntervals.js";

/** Skill, schedules, explicit leave, occupancy and local-date cap for one real practitioner. */
export function checkPractitioner(
  context: RuleContext,
  practitioner: Practitioner,
  stopAtFirst = false,
): Fact[] {
  const { snapshot, service, interval, date, clinicDays, bookingDates } = context;
  const subject = { type: "practitioner", id: practitioner.id } as const;
  const facts: Fact[] = [];
  if (!practitioner.skills.includes(service.requiredSkill))
    facts.push(makeFact("practitioner-skill", subject, { requiredSkill: service.requiredSkill }));
  if (stopAtFirst && facts.length > 0) return facts;
  const validatedHours = context.practitionerHours.get(practitioner.id);
  if (validatedHours === undefined) throw new Error("Validated practitioner schedule missing");
  const hours = [...validatedHours].sort((a, b) => a.from - b.from || a.to - b.to);
  let covered = interval.from;
  for (const hoursWindow of hours) {
    if (hoursWindow.from > covered) break;
    covered = Math.max(covered, hoursWindow.to);
  }
  if (covered < interval.to)
    facts.push(makeFact("practitioner-hours", subject, { date }, interval));
  if (stopAtFirst && facts.length > 0) return facts;
  for (const day of clinicDays) {
    for (const entry of practitioner.breaks) {
      const dated = datedSchedule([entry], day.date, snapshot.clinic.timezone);
      if (!dated.ok) throw new Error("Unsupported break reached resource checks");
      for (const window of dated.value) {
        if (intervalsOverlap(window, interval))
          facts.push(
            makeFact(
              "practitioner-break",
              subject,
              { date: day.date, from: entry.from, to: entry.to },
              window,
            ),
          );
      }
    }
  }
  for (const window of intervalLookup(practitioner.timeOff)(interval))
    facts.push(
      makeFact(
        "practitioner-time-off",
        subject,
        { timeOffId: window.id, reason: window.reason },
        { from: window.from, to: window.to },
      ),
    );
  const bookings = snapshot.bookings.filter(
    (booking) => booking.practitionerId === practitioner.id,
  );
  facts.push(...occupancyFacts(context, subject, bookings, "practitioner"));
  const count = bookings.filter(
    (booking) => booking.status === "confirmed" && bookingDates.get(booking.id) === date,
  ).length;
  const limit = practitioner.dailyCap ?? snapshot.policy.defaultDailyCap;
  if (limit !== undefined && count >= limit)
    facts.push(makeFact("practitioner-daily-cap", subject, { date, count, limit }));
  return canonicalFacts(facts);
}
