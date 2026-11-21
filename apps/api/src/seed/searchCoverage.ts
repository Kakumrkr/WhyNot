import { EvaluateOptionsSchema, RangeOptionsSchema, type ClinicSnapshot } from "@whynot/contracts";
import { addLocalDays, addMinutes, localDate, resolveRecurringBoundary } from "@whynot/engine";

function shiftMidnight(minute: number, days: number, timezone: string): number {
  const date = localDate(minute, timezone);
  if (!date.ok) throw new Error("Invalid Riverside coverage date");
  const shifted = addLocalDays(date.value, days);
  if (!shifted.ok) throw new Error("Riverside search date exceeds the calendar");
  const midnight = resolveRecurringBoundary(shifted.value, "00:00", timezone);
  if (!midnight.ok) throw new Error("Unsupported Riverside search boundary");
  return midnight.value;
}

/** Include the full default search domains outside the authored demo dates. */
export function riversideSearchCoverage(
  snapshot: ClinicSnapshot,
  now: number,
): ClinicSnapshot["coverage"] {
  const { alternatives } = EvaluateOptionsSchema.parse({ now });
  const alternativeDays = alternatives === false ? 0 : alternatives.searchDays;
  const rangeDays = RangeOptionsSchema.parse({ now }).searchDays;
  const { timezone } = snapshot.clinic;
  const from = shiftMidnight(snapshot.coverage.from, -alternativeDays, timezone);
  const end = shiftMidnight(snapshot.coverage.to, Math.max(alternativeDays, rangeDays), timezone);
  const duration = snapshot.services.reduce(
    (max, service) => Math.max(max, service.durationMin),
    0,
  );
  const to = addMinutes(end, duration);
  if (!to.ok) throw new Error("Riverside search appointment exceeds the calendar");
  return { from, to: to.value };
}
