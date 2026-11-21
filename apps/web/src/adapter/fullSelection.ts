import type { BookingRequest, RangeRequest } from "@whynot/contracts";
import {
  addLocalDays,
  formatOffsetInstant,
  isOnLocalGrid,
  localDate,
  parseOffsetInstant,
  resolveRecurringBoundary,
} from "@whynot/engine";
import type { TemplateDisplay } from "@whynot/narrator";
import type { ClinicConfig } from "./httpAdapter.js";
import {
  calendarWindow,
  labels,
  options,
  practitionerPreference,
  preferredCalendarDays,
  timeValue,
  type SelectionView,
  type parseSelection,
} from "./requestSelection.js";

export type LinkSelection = NonNullable<ReturnType<typeof parseSelection>>;

/** Resolve a validated link against the live clinic configuration in this scope. */
export function fullSelection(
  config: ClinicConfig,
  { audience, params, scenario }: LinkSelection,
  historyStart: unknown,
  historyDays: unknown,
) {
  const { timezone, slotGridMinutes } = config.clinic;
  const windowFrom = timeValue(parseOffsetInstant(config.demoWindow.from));
  const windowTo = timeValue(parseOffsetInstant(config.demoWindow.to));
  const coverageFrom = timeValue(parseOffsetInstant(config.coverage.from));
  const coverageTo = timeValue(parseOffsetInstant(config.coverage.to));
  if (coverageFrom > windowFrom || windowFrom >= windowTo || windowTo > coverageTo)
    throw new Error("Invalid clinic coverage");
  const firstDate = timeValue(localDate(windowFrom, timezone));
  const lastDate = timeValue(localDate(windowTo - 1, timezone));
  const coverageFirst = timeValue(localDate(coverageFrom, timezone));
  const coverageLast = timeValue(localDate(coverageTo - 1, timezone));
  const date = params.get("date") ?? timeValue(addLocalDays(config.demoDate, scenario.day));
  if (date < coverageFirst || date > coverageLast) return null;
  const period = calendarWindow(
    date < firstDate ? date : firstDate,
    date > lastDate ? date : lastDate,
    date,
    preferredCalendarDays(historyDays, scenario.days),
    coverageLast,
  );
  const serviceId = params.get("serviceId") ?? scenario.serviceId;
  const practitionerId = practitionerPreference(
    params.get("practitionerId") ?? scenario.practitionerId,
  );
  const service = config.services.find(({ id }) => serviceId === id);
  const practitioner = config.practitioners.find(({ id }) => practitionerId === id);
  if (!service || (practitionerId !== undefined && !practitioner)) return null;

  const selected =
    typeof historyStart === "number" &&
    Number.isSafeInteger(historyStart) &&
    historyStart >= coverageFrom &&
    historyStart < coverageTo &&
    timeValue(localDate(historyStart, timezone)) === date &&
    timeValue(isOnLocalGrid(historyStart, timezone, slotGridMinutes));
  const start = selected
    ? historyStart
    : timeValue(resolveRecurringBoundary(date, scenario.time, timezone));
  const instant = timeValue(formatOffsetInstant(start, timezone));
  const display: TemplateDisplay = {
    timeZone: timezone,
    services: labels(config.services),
    practitioners: labels(config.practitioners),
  };
  const patientId = scenario.patientId ?? "patient-0";
  const identity = {
    patientId,
    serviceId,
    ...(practitionerId === undefined ? {} : { practitionerId }),
  };
  const slot: BookingRequest = { ...identity, start };
  const range: RangeRequest = { ...identity, fromDate: date, days: period.days };
  const view = {
    ...period,
    scenarioId: scenario.id,
    audience,
    timezone,
    date,
    start,
    instant,
    time: instant.slice(11, 16),
    serviceId,
    service: service.displayName,
    practitionerId,
    practitioner: practitioner?.displayName ?? "Any practitioner",
    clock: timeValue(formatOffsetInstant(timeValue(parseOffsetInstant(config.now)), timezone)),
    services: options(config.services),
    practitioners: options(config.practitioners),
  } satisfies SelectionView;
  return { view, display, slot, range, identity, requester: { audience, patientId } };
}

export type FullSelection = NonNullable<ReturnType<typeof fullSelection>>;
