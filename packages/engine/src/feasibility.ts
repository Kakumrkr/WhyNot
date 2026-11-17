import type { Assignment } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { buildMatrix } from "./matrix.js";
import { validateRequest, type RuleContext } from "./validateRequest.js";

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
  return result.ok && chooseAssignment(result.value) !== null;
}
