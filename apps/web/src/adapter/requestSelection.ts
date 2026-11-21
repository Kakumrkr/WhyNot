import { DateSchema } from "@whynot/contracts";
import { addLocalDays } from "@whynot/engine";
import { scenarios } from "./scenarios.js";

type DisplayOption = { id: string; label: string };
export type AppointmentStarts = { start: number; time: string; available: boolean }[];
export type SelectionView = {
  scenarioId: string | undefined;
  audience: "patient" | "staff";
  timezone: string;
  date: string;
  days: number;
  endDate: string;
  periods: { days: number; label: string }[];
  start: number | null;
  instant: string | null;
  time: string | undefined;
  serviceId: string;
  service: string;
  practitionerId: string | undefined;
  practitioner: string;
  clock: string;
  dates: string[];
  services: DisplayOption[];
  practitioners: DisplayOption[];
};

const parameters = new Set(["scenarioId", "audience", "date", "serviceId", "practitionerId"]);
const calendarPeriods = [
  { days: 1, label: "One day" },
  { days: 5, label: "Five days" },
  { days: 7, label: "Seven days" },
];
export const anyPractitioner = "any";

export function preferredCalendarDays(selected: unknown, defaultDays = 1) {
  return calendarPeriods.find(({ days }) => days === selected)?.days ?? defaultDays;
}

export function timeValue<T>(result: { ok: true; value: T } | { ok: false }): T {
  if (!result.ok) throw new Error("Invalid curated scenario time");
  return result.value;
}

export function options(entries: readonly { id: string; displayName: string }[]): DisplayOption[] {
  return entries.map(({ id, displayName }) => ({ id, label: displayName }));
}

export function labels(entries: readonly { id: string; displayName: string }[]) {
  return new Map(entries.map(({ id, displayName }) => [id, displayName]));
}

/** Parse the curated link without putting appointment state or imported inputs in the URL. */
export function parseSelection(query: string, allowBase = false) {
  const params = new URLSearchParams(query);
  for (const key of params.keys()) {
    if (!parameters.has(key) || params.getAll(key).length > 1) return null;
  }
  const defaultId = allowBase ? baseScenario.id : "H1";
  const scenarioId = params.get("scenarioId") ?? defaultId;
  const scenario =
    allowBase && scenarioId === baseScenario.id
      ? baseScenario
      : scenarios.find(({ id }) => id === scenarioId);
  const audience = params.get("audience") ?? "patient";
  if (!scenario || (audience !== "patient" && audience !== "staff")) return null;
  if (params.has("date") && !DateSchema.safeParse(params.get("date")).success) return null;
  return { scenario, audience, params } as const;
}

export const baseScenario: (typeof scenarios)[number] = {
  id: "base",
  label: "Riverside clinic",
  day: 0,
  time: "11:00",
  serviceId: "consult",
};

export function practitionerPreference(id: string | undefined) {
  return id === anyPractitioner ? undefined : id;
}

export function calendarWindow(
  firstDate: string,
  lastDate: string,
  date: string,
  days?: number,
  through = lastDate,
) {
  const periods = calendarPeriods.flatMap((period) => {
    const end = addLocalDays(date, period.days - 1);
    return end.ok && end.value <= through ? [{ ...period, endDate: end.value }] : [];
  });
  // When the chosen duration no longer fits, use the longest remaining option.
  const preferred = preferredCalendarDays(days);
  const period = periods.find((entry) => entry.days === preferred) ?? periods.at(-1);
  if (!period) throw new Error("No calendar period for a covered date");
  const dates: string[] = [];
  for (let day = firstDate; ; day = timeValue(addLocalDays(day, 1))) {
    dates.push(day);
    if (day === lastDate) break;
  }
  return { periods, dates, days: period.days, endDate: period.endDate };
}
