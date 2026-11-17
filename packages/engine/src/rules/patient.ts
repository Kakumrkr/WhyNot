import type { Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";

/** Eligibility and confirmed booking limits concern only the requesting patient. */
export function checkPatient({
  snapshot,
  patient,
  service,
  date,
  bookingDates,
}: RuleContext): Fact[] {
  const subject = { type: "patient", id: patient.id } as const;
  const facts: Fact[] = [];
  if (service.eligibility === "returning_only" && !patient.isReturning)
    facts.push(makeFact("patient-eligibility-returning", subject, {}));
  if (service.eligibility === "referral_required" && !patient.referrals.includes(service.id))
    facts.push(makeFact("patient-eligibility-referral", subject, { serviceId: service.id }));
  const count = snapshot.bookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      booking.patientId === patient.id &&
      bookingDates.get(booking.id) === date,
  ).length;
  const limit = snapshot.policy.patientMaxBookingsPerDay;
  if (count >= limit) facts.push(makeFact("patient-daily-limit", subject, { date, count, limit }));
  return facts;
}
