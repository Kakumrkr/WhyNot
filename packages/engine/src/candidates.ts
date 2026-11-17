import type { Assignment } from "@whynot/contracts";
import type { RuleContext } from "./validateRequest.js";

/** Compare Unicode codepoints, independently of locale and UTF-16 surrogate ordering. */
export function compareIds(a: string, b: string): number {
  const left = Array.from(a, (char) => char.codePointAt(0)!);
  const right = Array.from(b, (char) => char.codePointAt(0)!);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i]! - right[i]!;
  }
  return left.length - right.length;
}

/** Enumerate real combinations, retaining incompatible resources as ordinary evidence. */
export function enumerateCandidates({ snapshot, service, interval }: RuleContext): Assignment[] {
  const sorted = <T extends { id: string }>(entries: T[]) =>
    [...entries].sort((a, b) => compareIds(a.id, b.id));
  const equipmentIds =
    service.requiredEquipmentType === undefined
      ? [null]
      : sorted(snapshot.equipment).map((entry) => entry.id);
  return sorted(snapshot.practitioners).flatMap((practitioner) =>
    sorted(snapshot.rooms).flatMap((room) =>
      equipmentIds.map((equipmentId) => ({
        practitionerId: practitioner.id,
        roomId: room.id,
        equipmentId,
        start: interval.from,
        end: interval.to,
      })),
    ),
  );
}
