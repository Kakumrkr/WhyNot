import { DateTime } from "luxon";
import {
  ClockSchema,
  ClockEndSchema,
  DateSchema,
  MinuteSchema,
  OffsetIsoSchema,
  WeeklyHoursSchema,
  type ValidationIssue,
  type WeeklyHours,
  type Window,
} from "@whynot/contracts";

export type TimeResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };
type Interval = Pick<Window, "from" | "to">;
const success = <T>(value: T): TimeResult<T> => ({ ok: true, value });
const failure = (
  message: string,
  path: ValidationIssue["path"],
  code: ValidationIssue["code"] = "invalid_request",
): TimeResult<never> => ({ ok: false, issues: [{ code, path, message }] });

// Anchoring every construction avoids Luxon's fromISO/fromObject implicit clock reads.
function calendar(date: string): DateTime | null {
  if (!DateSchema.safeParse(date).success) return null;
  const [year, month, day] = date.split("-").map(Number);
  const value = DateTime.fromMillis(0, { zone: "UTC", locale: "en" }).set({
    year,
    month,
    day,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  return value.isValid && value.toISODate() === date ? value : null;
}

function atMinute(minute: number, zone: string): TimeResult<DateTime> {
  if (!MinuteSchema.safeParse(minute).success)
    return failure("Expected a safe integer UTC minute", ["minute"]);
  const value = DateTime.fromMillis(minute * 60000, { zone, locale: "en" });
  if (!value.isValid || !DateSchema.safeParse(value.toISODate()).success)
    return failure("Unsupported instant or timezone", ["timezone"]);
  if (value.second !== 0 || value.millisecond !== 0)
    return failure("Timezone offset is not minute-aligned", ["timezone"], "unsupported_wall_time");
  return success(value);
}

/** Parse an explicit-offset instant without rounding sub-minute values. */
export function parseOffsetInstant(iso: string): TimeResult<number> {
  if (!OffsetIsoSchema.safeParse(iso).success)
    return failure("Expected an explicit-offset ISO timestamp", ["start"]);
  const base = calendar(iso.slice(0, 10));
  const hour = Number(iso.slice(11, 13));
  const minute = Number(iso.slice(14, 16));
  if (base === null || iso.slice(17, 19) !== "00")
    return failure("Instant must have minute precision", ["start"]);
  const suffix = iso.slice(19);
  const offset =
    suffix === "Z"
      ? 0
      : (Number(suffix.slice(1, 3)) * 60 + Number(suffix.slice(4, 6))) *
        (suffix.startsWith("-") ? -1 : 1);
  return addMinutes(base.toMillis() / 60000, hour * 60 + minute - offset);
}

/** Format an instant with the supplied zone's explicit offset. */
export function formatOffsetInstant(minute: number, zone: string): TimeResult<string> {
  const value = atMinute(minute, zone);
  if (!value.ok) return value;
  const iso = value.value.toISO({ suppressMilliseconds: true });
  return iso === null ? failure("Cannot format instant", ["minute"]) : success(iso);
}

/** Get the clinic calendar date of an instant. */
export function localDate(minute: number, zone: string): TimeResult<string> {
  const value = atMinute(minute, zone);
  if (!value.ok) return value;
  const date = value.value.toISODate();
  return date === null ? failure("Cannot resolve local date", ["minute"]) : success(date);
}

/** Shift a date in the local calendar, independently of elapsed DST day length. */
export function addLocalDays(date: string, days: number): TimeResult<string> {
  const base = calendar(date);
  if (base === null || !Number.isSafeInteger(days))
    return failure("Expected a date and safe integer day count", ["date"]);
  const shifted = base.plus({ days }).toISODate();
  return shifted !== null && DateSchema.safeParse(shifted).success
    ? success(shifted)
    : failure("Local date arithmetic overflow", ["date"]);
}

/** Count calendar days rather than elapsed 24-hour periods. */
export function localDateDifference(from: string, to: string): TimeResult<number> {
  const first = calendar(from);
  const last = calendar(to);
  return first === null || last === null
    ? failure("Expected calendar dates", ["date"])
    : success((last.toMillis() - first.toMillis()) / 86400000);
}

/** Add elapsed minutes, rejecting unsafe arithmetic instead of rounding. */
export function addMinutes(start: number, minutes: number): TimeResult<number> {
  return [start, minutes, start + minutes].every(Number.isSafeInteger)
    ? success(start + minutes)
    : failure("Minute arithmetic requires safe integers", ["minute"]);
}

/** Advance by exact elapsed days of 1440 minutes, including across DST changes. */
export function addElapsedDays(start: number, days: number): TimeResult<number> {
  return Number.isSafeInteger(days)
    ? addMinutes(start, days * 1440)
    : failure("Expected a safe integer day count", ["days"]);
}

/** Resolve a recurring wall boundary; folds and gaps are unsupported, never shifted. */
export function resolveRecurringBoundary(
  date: string,
  clock: string,
  zone: string,
  end = false,
): TimeResult<number> {
  if (!(end ? ClockEndSchema : ClockSchema).safeParse(clock).success)
    return failure("Invalid schedule clock boundary", ["clock"]);
  if (clock === "24:00") {
    const next = addLocalDays(date, 1);
    return next.ok ? resolveRecurringBoundary(next.value, "00:00", zone) : next;
  }
  const base = calendar(date);
  if (base === null) return failure("Invalid calendar date", ["date"]);
  const hour = Number(clock.slice(0, 2));
  const minute = Number(clock.slice(3, 5));
  const wall = base.set({ hour, minute });
  const value = wall.setZone(zone, { keepLocalTime: true });
  if (!value.isValid) return failure("Unknown timezone", ["timezone"]);
  if (value.toISODate() !== date || value.hour !== hour || value.minute !== minute)
    return failure(
      "Nonexistent recurring wall boundary",
      ["date", date, clock],
      "unsupported_wall_time",
    );
  if (value.getPossibleOffsets().length !== 1)
    return failure(
      "Ambiguous recurring wall boundary",
      ["date", date, clock],
      "unsupported_wall_time",
    );
  const minuteInstant = value.toMillis() / 60000;
  return Number.isSafeInteger(minuteInstant)
    ? success(minuteInstant)
    : failure("Boundary is not minute-aligned", ["date", date, clock], "unsupported_wall_time");
}

/** Materialize only this date's weekly intervals, preserving end-only next midnight. */
export function datedSchedule(
  hours: WeeklyHours,
  date: string,
  zone: string,
): TimeResult<Interval[]> {
  const base = calendar(date);
  if (base === null || !WeeklyHoursSchema.safeParse(hours).success)
    return failure("Invalid date or weekly schedule", ["hours"]);
  // Validate the zone even when this weekday has no intervals.
  const probe = atMinute(base.toMillis() / 60000, zone);
  if (!probe.ok) return probe;
  const intervals: Interval[] = [];
  for (const entry of hours.filter((item) => item.weekday === base.weekday)) {
    const from = resolveRecurringBoundary(date, entry.from, zone);
    if (!from.ok) return from;
    const to = resolveRecurringBoundary(date, entry.to, zone, true);
    if (!to.ok) return to;
    intervals.push({ from: from.value, to: to.value });
  }
  return success(intervals.sort((a, b) => a.from - b.from || a.to - b.to));
}

/** Split an authored overnight schedule across weekdays; equal endpoints are invalid. */
export function splitOvernightHours(
  weekday: number,
  from: string,
  to: string,
): TimeResult<WeeklyHours> {
  if (
    !Number.isInteger(weekday) ||
    weekday < 1 ||
    weekday > 7 ||
    !ClockSchema.safeParse(from).success ||
    !ClockEndSchema.safeParse(to).success ||
    from === to
  )
    return failure("Invalid overnight schedule", ["hours"]);
  if (from < to) return success([{ weekday, from, to }]);
  return success([
    { weekday, from, to: "24:00" },
    ...(to === "00:00" ? [] : [{ weekday: (weekday % 7) + 1, from: "00:00", to }]),
  ]);
}

/** Local clock minutes since midnight; fold instants share the same wall minute. */
export function localMinuteOfDay(minute: number, zone: string): TimeResult<number> {
  const value = atMinute(minute, zone);
  return value.ok ? success(value.value.hour * 60 + value.value.minute) : value;
}

/** Check local midnight alignment; service duration does not define the start grid. */
export function isOnLocalGrid(minute: number, zone: string, grid: number): TimeResult<boolean> {
  if (!Number.isSafeInteger(grid) || grid <= 0)
    return failure("Expected a positive integer grid", ["grid"]);
  const wall = localMinuteOfDay(minute, zone);
  return wall.ok ? success(wall.value % grid === 0) : wall;
}

/** Enumerate actual instants on a local date: omit gaps, retain both fold occurrences. */
export function gridStarts(date: string, zone: string, grid: number): TimeResult<number[]> {
  if (!Number.isSafeInteger(grid) || grid <= 0)
    return failure("Expected a positive integer grid", ["grid"]);
  const from = resolveRecurringBoundary(date, "00:00", zone);
  if (!from.ok) return from;
  const to = resolveRecurringBoundary(date, "24:00", zone, true);
  if (!to.ok) return to;
  const starts: number[] = [];
  for (let minute = from.value; minute < to.value; minute++) {
    const aligned = isOnLocalGrid(minute, zone, grid);
    if (!aligned.ok) return aligned;
    if (aligned.value) starts.push(minute);
  }
  return success(starts);
}

/** Half-open overlap: touching boundaries do not overlap. Inputs must be valid intervals. */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.from < b.to && b.from < a.to;
}

/** Full containment accepts an appointment ending exactly at closing. */
export function intervalContains(outer: Interval, inner: Interval): boolean {
  return outer.from <= inner.from && inner.to <= outer.to;
}
