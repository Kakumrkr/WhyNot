import type { Fact, PublicFact } from "@whynot/contracts";
import { duration, type Format } from "./format.js";

function notice(actual: number): string {
  return actual < 0
    ? "The requested start has already passed."
    : `This request gives ${duration(actual)}.`;
}

function maintenance(name: string, window: PublicFact["window"], format: Format): string {
  return `${name} is under maintenance${window === undefined ? "" : ` until ${format.until(window)}`}.`;
}

const missingResourceText = {
  practitioner: "The clinic has no practitioners available for booking.",
  room: "The clinic has no rooms available for booking.",
  equipment: "The clinic has no equipment available for this service.",
};

/** Render only fields present on a projected public fact. */
export function patientFact(fact: PublicFact, format: Format): string {
  const { params, ruleId, window } = fact;
  const practitioner = format.practitioner(fact.practitionerId);
  switch (ruleId) {
    case "clinic-closed-day":
      return "The clinic is closed that day.";
    case "clinic-hours":
      return "The appointment would run outside the clinic's opening hours.";
    case "min-notice":
      return `The clinic needs at least ${duration(params.requiredMin)} of notice. ${notice(params.actualMin)}`;
    case "max-advance":
      return `The clinic accepts appointments up to ${params.maxAdvanceDays} ${params.maxAdvanceDays === 1 ? "day" : "days"} ahead.`;
    case "patient-eligibility-returning":
      return "This service is available to returning patients.";
    case "patient-eligibility-referral":
      return "This service requires a referral, and the clinic has none on file for you.";
    case "patient-daily-limit":
      if (params.count > params.limit)
        return `You have ${params.count} ${params.count === 1 ? "appointment" : "appointments"} that day. The limit is ${params.limit}.`;
      return params.limit === 0
        ? "The clinic's booking limit does not allow an appointment that day."
        : `You already have the maximum of ${params.limit} ${params.limit === 1 ? "appointment" : "appointments"} that day.`;
    case "request-practitioner":
      return `You requested ${format.practitioner(params.practitionerId)}.`;
    case "practitioner-skill":
      return `${practitioner} does not offer this service.`;
    case "practitioner-hours":
      return `This time is outside ${practitioner}'s working hours.`;
    case "practitioner-unavailable":
      return `${practitioner} is unavailable at this time.`;
    case "practitioner-busy":
      return `${practitioner} is already booked at this time.`;
    case "practitioner-buffer":
      return `${practitioner} needs a ${params.bufferMin}-minute gap between appointments.`;
    case "practitioner-daily-cap":
      return `${practitioner} is fully booked that day.`;
    case "room-maintenance":
      return maintenance("A room", window, format);
    case "room-busy":
      return "A room is already in use at this time.";
    case "room-turnover":
      return `A room needs ${duration(params.turnoverMin)} between appointments.`;
    case "equipment-maintenance":
      return maintenance("A piece of equipment", window, format);
    case "equipment-busy":
      return "A piece of equipment is already in use at this time.";
    case "resource-missing":
      return missingResourceText[params.dimension];
    case "resource-unavailable":
      return "Some resources do not meet this service's requirements.";
  }
}

/** Render staff diagnostics without treating setting values as verified fixes. */
export function staffFact(fact: Fact, format: Format): string {
  const { params, ruleId, subject, window } = fact;
  const practitioner =
    subject.type === "practitioner" ? format.practitioner(subject.id) : "This practitioner";
  const resource =
    subject.type === "room" || subject.type === "equipment"
      ? format.staffResource(subject.type, subject.id)
      : subject.id;
  switch (ruleId) {
    case "clinic-closed-day":
      return `The clinic is closed on ${params.date}.`;
    case "clinic-hours":
      return `The appointment extends outside clinic opening hours on ${params.date}.`;
    case "min-notice":
      return `Minimum notice is ${duration(params.requiredMin)}. ${notice(params.actualMin).replace("This request", "The request")}`;
    case "max-advance":
      return `The advance limit is ${params.maxAdvanceDays} elapsed ${params.maxAdvanceDays === 1 ? "day" : "days"}. The request is ${duration(params.actualMin)} ahead.`;
    case "patient-eligibility-returning":
      return "Service eligibility is returning-only and the patient is new.";
    case "patient-eligibility-referral":
      return `Service ${params.serviceId} requires a referral and the patient has none.`;
    case "patient-daily-limit":
      return `The patient has reached the daily booking limit (${params.count} booked, limit ${params.limit}).`;
    case "request-practitioner":
      return `The request is restricted to ${format.practitioner(params.practitionerId)}.`;
    case "practitioner-skill":
      return `${practitioner} lacks the required skill (${params.requiredSkill}).`;
    case "practitioner-hours":
      return `This time is outside ${practitioner}'s working hours.`;
    case "practitioner-break":
      return `${practitioner} has a scheduled break from ${params.from} to ${params.to}.`;
    case "practitioner-time-off":
      return `${practitioner} is on leave${params.reason ? ` (${params.reason})` : ""}.`;
    case "practitioner-busy":
      return `${practitioner} overlaps booking ${params.bookingId}.`;
    case "practitioner-buffer":
      return `A ${params.bufferMin}-minute after-appointment buffer for service ${params.serviceId} blocks this slot for ${practitioner}.`;
    case "practitioner-daily-cap":
      return `${practitioner} has reached the daily appointment cap (${params.count} booked, limit ${params.limit}).`;
    case "room-capability":
      return `${resource} lacks the required capability (${params.requiredCapability}).`;
    case "room-maintenance":
    case "equipment-maintenance":
      return maintenance(resource, window, format);
    case "room-busy":
    case "equipment-busy":
      return `${resource} overlaps booking ${params.bookingId}.`;
    case "room-turnover":
      return `${resource} needs ${duration(params.turnoverMin)} of turnover for service ${params.serviceId}.`;
    case "equipment-type":
      return `${resource} is not the required equipment type (${params.requiredType}).`;
    case "resource-missing":
      return `The required ${params.dimension} pool is empty.`;
  }
}
