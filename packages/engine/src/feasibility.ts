import type { Assignment } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { buildMatrix } from "./matrix.js";
import { validateRequest, type RuleContext } from "./validateRequest.js";
import { checkClinic, checkMissingResource } from "./rules/clinic.js";
import { checkTiming } from "./rules/timing.js";
import { checkPatient } from "./rules/patient.js";
import { checkPractitioner } from "./rules/practitioner.js";
import { checkPreference } from "./rules/preference.js";
import { checkRoom } from "./rules/room.js";
import { checkEquipment } from "./rules/equipment.js";

function practitionerCounts(context: RuleContext): Map<string, number> {
  const counts = new Map<string, number>();
  for (const booking of context.snapshot.bookings) {
    if (booking.status === "confirmed" && context.bookingDates.get(booking.id) === context.date)
      counts.set(booking.practitionerId, (counts.get(booking.practitionerId) ?? 0) + 1);
  }
  return counts;
}

/** Pick a valid witness by confirmed local-day load, then canonical resource IDs. */
export function chooseAssignment(
  context: RuleContext,
  matrix = buildMatrix(context),
): Assignment | null {
  const counts = practitionerCounts(context);
  const valid = matrix.rows.filter((row) => row.factIds.length === 0).map((row) => row.assignment);
  valid.sort(
    (a, b) =>
      (counts.get(a.practitionerId) ?? 0) - (counts.get(b.practitionerId) ?? 0) ||
      compareIds(a.practitionerId, b.practitionerId) ||
      compareIds(a.roomId, b.roomId) ||
      compareIds(a.equipmentId ?? "", b.equipmentId ?? ""),
  );
  return valid[0] ?? null;
}

function passesGlobalRules(context: RuleContext): boolean {
  return (
    checkMissingResource(context).length === 0 &&
    checkClinic(context).length === 0 &&
    checkPatient(context).length === 0 &&
    checkTiming(context).length === 0
  );
}

function practitionerAvailable(
  context: RuleContext,
  p: RuleContext["snapshot"]["practitioners"][number],
) {
  return (
    checkPreference(context, p.id).length === 0 && checkPractitioner(context, p, true).length === 0
  );
}

/** Recheck all rule dimensions and return a canonical witness without an explanation matrix. */
export function verifyAssignment(context: RuleContext): Assignment | null {
  if (!passesGlobalRules(context)) return null;
  const { snapshot, service, interval } = context;
  const sorted = <T extends { id: string }>(entries: readonly T[]) =>
    [...entries].sort((a, b) => compareIds(a.id, b.id));
  const room = sorted(snapshot.rooms).find((r) => checkRoom(context, r, true).length === 0);
  if (room === undefined) return null;
  const equipment =
    service.requiredEquipmentType === undefined
      ? null
      : sorted(snapshot.equipment).find((e) => checkEquipment(context, e, true).length === 0);
  if (equipment === undefined) return null;
  const preferredId = context.request.practitionerId;
  const practitioners =
    preferredId === undefined
      ? snapshot.practitioners.filter((p) => practitionerAvailable(context, p))
      : snapshot.practitioners.filter(
          (p) => p.id === preferredId && practitionerAvailable(context, p),
        );
  const counts = practitioners.length > 1 ? practitionerCounts(context) : new Map<string, number>();
  const [practitioner] = practitioners.sort(
    (a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || compareIds(a.id, b.id),
  );
  if (practitioner === undefined) return null;
  return {
    practitionerId: practitioner.id,
    roomId: room.id,
    equipmentId: equipment?.id ?? null,
    start: interval.from,
    end: interval.to,
  };
}

/** True iff a real assignment satisfies every rule; invalid untrusted input returns false. */
export function isBookable(snapshot: unknown, request: unknown, now: unknown): boolean {
  const result = validateRequest(snapshot, request, { now, alternatives: false });
  if (!result.ok) return false;
  const context = result.value;
  if (!passesGlobalRules(context)) return false;
  // Independent dimensions make a witness exist iff each pool has an admissible member.
  return (
    context.snapshot.practitioners.some((p) => practitionerAvailable(context, p)) &&
    context.snapshot.rooms.some((r) => checkRoom(context, r, true).length === 0) &&
    (context.service.requiredEquipmentType === undefined ||
      context.snapshot.equipment.some((e) => checkEquipment(context, e, true).length === 0))
  );
}
