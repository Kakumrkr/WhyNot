import { localDateDifference, resolveRecurringBoundary } from "@whynot/engine";

export const DEMO_DATE = "2026-11-16";

export type DemoClock = { date: string; now: number };

/** Freeze the demo clock at 09:00 London time on the selected Monday. */
export function demoClock(date = DEMO_DATE): DemoClock {
  const monday = localDateDifference("1970-01-05", date);
  if (!monday.ok || monday.value % 7 !== 0) throw new Error("DEMO_DATE must be a valid Monday");
  const now = resolveRecurringBoundary(date, "09:00", "Europe/London");
  if (!now.ok) throw new Error("DEMO_DATE has an unsupported clock boundary");
  return { date, now: now.value };
}

export const DEMO_NOW = demoClock().now;
