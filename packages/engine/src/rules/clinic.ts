import type { Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";

/** Clinic closures precede hours evidence; adjacent opening intervals form continuous coverage. */
export function checkClinic(context: RuleContext): Fact[] {
  const { snapshot, clinicDays, interval } = context;
  const subject = { type: "clinic", id: snapshot.clinic.id } as const;
  const closed = clinicDays.filter(
    (day) => day.hours.length === 0 || snapshot.clinic.closedDates.includes(day.date),
  );
  if (closed.length > 0)
    return closed.map((day) => makeFact("clinic-closed-day", subject, { date: day.date }));
  let covered = interval.from;
  const hours = clinicDays
    .flatMap((day) => day.hours)
    .sort((a, b) => a.from - b.from || a.to - b.to);
  for (const opening of hours) {
    if (opening.from > covered) break;
    covered = Math.max(covered, opening.to);
    if (covered >= interval.to) return [];
  }
  return [makeFact("clinic-hours", subject, { date: context.date }, interval)];
}

/** First empty dimension only; incompatible nonempty pools belong to resource rules. */
export function checkMissingResource({ snapshot, service }: RuleContext): Fact[] {
  const dimension =
    snapshot.practitioners.length === 0
      ? "practitioner"
      : snapshot.rooms.length === 0
        ? "room"
        : service.requiredEquipmentType !== undefined && snapshot.equipment.length === 0
          ? "equipment"
          : null;
  return dimension === null
    ? []
    : [makeFact("resource-missing", { type: "clinic", id: snapshot.clinic.id }, { dimension })];
}
