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

/** Pick a valid witness by confirmed local-day load, then canonical resource IDs. */
export function chooseAssignment(
  context: RuleContext,
  matrix = buildMatrix(context),
): Assignment | null {
  const counts = new Map<string, number>();
  for (const booking of context.snapshot.bookings) {
    if (booking.status === "confirmed" && context.bookingDates.get(booking.id) === context.date)
      counts.set(booking.practitionerId, (counts.get(booking.practitionerId) ?? 0) + 1);
  }
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

/** True iff a real assignment satisfies every rule; invalid untrusted input returns false. */
export function isBookable(snapshot: unknown, request: unknown, now: unknown): boolean {
  const result = validateRequest(snapshot, request, { now });
  if (!result.ok) return false;
  const context = result.value;
  if (
    checkMissingResource(context).length > 0 ||
    checkClinic(context).length > 0 ||
    checkPatient(context).length > 0 ||
    checkTiming(context).length > 0
  )
    return false;
  // Independent dimensions make a witness exist iff each pool has an admissible member.
  return (
    context.snapshot.practitioners.some(
      (p) =>
        checkPreference(context, p.id).length === 0 &&
        checkPractitioner(context, p, true).length === 0,
    ) &&
    context.snapshot.rooms.some((r) => checkRoom(context, r).length === 0) &&
    (context.service.requiredEquipmentType === undefined ||
      context.snapshot.equipment.some((e) => checkEquipment(context, e).length === 0))
  );
}
