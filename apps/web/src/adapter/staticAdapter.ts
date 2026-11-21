import {
  BookingRequestSchema,
  ClinicSnapshotSchema,
  schemaVersion,
  type BookingRequest,
  type ClinicSnapshot,
  type SyntheticSnapshotEnvelope,
} from "@whynot/contracts";
import {
  addLocalDays,
  datedSchedule,
  evaluate,
  formatOffsetInstant,
  gridStarts,
  isBookable,
  isOnLocalGrid,
  localDate,
  projectForAudience,
  resolveRecurringBoundary,
} from "@whynot/engine";
import { buildScenario, demoNow } from "@whynot/fixtures";
import type { TemplateDisplay } from "@whynot/narrator/templates";
import { calendarRange } from "./calendarRange.js";
import { policyPreview } from "./policyPreview.js";
import { scenarios } from "./scenarios.js";
import { renderSlot } from "./renderSlot.js";
import {
  calendarWindow,
  labels,
  options,
  parseSelection,
  practitionerPreference,
  preferredCalendarDays,
  timeValue,
  type SelectionView,
} from "./requestSelection.js";

function check(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  now: number,
  audience: "patient" | "staff",
  display: TemplateDisplay,
) {
  const result = evaluate(snapshot, request, {
    now,
    trace: audience === "staff",
    includeAdminFix: audience === "staff",
  });
  return renderSlot(
    audience === "patient"
      ? {
          audience,
          result: projectForAudience(result, audience, { requesterPatientId: request.patientId }),
        }
      : { audience, result },
    request,
    display,
  );
}

function availability(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  date: string,
  now: number,
  importedDuration?: number,
) {
  const { timezone, openingHours, slotGridMinutes, closedDates } = snapshot.clinic;
  if (closedDates.includes(date)) return [];
  const schedule = datedSchedule(openingHours, date, timezone);
  if (!schedule.ok && importedDuration !== undefined) return [];
  const hours = timeValue(schedule);
  if (hours.length === 0) return [];
  const grid = gridStarts(date, timezone, slotGridMinutes);
  const starts = importedDuration === undefined ? timeValue(grid) : grid.ok ? grid.value : [];
  const scheduled = starts
    .filter((start) => hours.some(({ from, to }) => start >= from && start < to))
    .filter(
      (start) =>
        importedDuration === undefined ||
        (start >= snapshot.coverage.from && start + importedDuration <= snapshot.coverage.to),
    )
    .map((start) => {
      const instant = timeValue(formatOffsetInstant(start, timezone));
      return { start, time: instant.slice(11, 16), offset: instant.slice(19) };
    });
  const counts = new Map<string, number>();
  for (const { time } of scheduled) counts.set(time, (counts.get(time) ?? 0) + 1);
  return scheduled.map(({ start, time, offset }) => ({
    start,
    time: counts.get(time) === 1 ? time : `${time} (UTC${offset === "Z" ? "+00:00" : offset})`,
    available: isBookable(snapshot, { ...request, start }, now),
  }));
}

type ImportedSelections = {
  audience?: "patient" | "staff";
  date?: string;
  days?: number;
  start?: number | null;
  serviceId?: string;
  practitionerId?: string | undefined;
};

function openSnapshot(
  envelope: SyntheticSnapshotEnvelope,
  {
    scenarioId,
    date: preferredDate,
    audience,
    days: preferredDays,
    start: selectedStart,
    serviceId,
    practitionerId,
    patientId,
    fallbackTime,
  }: Omit<ImportedSelections, "audience" | "start"> & {
    scenarioId?: string;
    audience: "patient" | "staff";
    start?: unknown;
    patientId: string;
    fallbackTime?: string;
  },
) {
  const { snapshot, now } = envelope;
  const { timezone, slotGridMinutes } = snapshot.clinic;
  const firstDate = timeValue(localDate(snapshot.coverage.from, timezone));
  const lastDate = timeValue(localDate(snapshot.coverage.to - 1, timezone));
  const date = preferredDate ?? firstDate;
  if (date < firstDate || date > lastDate) return null;
  const { periods, days, endDate, dates } = calendarWindow(
    firstDate,
    lastDate,
    date,
    preferredDays,
  );
  const service = snapshot.services.find(({ id }) => id === serviceId);
  const practitioner = snapshot.practitioners.find(({ id }) => id === practitionerId);
  if (!service || (practitionerId !== undefined && !practitioner)) return null;
  const preference = practitioner ? { practitionerId: practitioner.id } : {};
  const baseRequest = { patientId, serviceId: service.id, ...preference };
  // Availability checks supply their own start. Use the same request preferences for each check.
  const starts = availability(
    snapshot,
    { ...baseRequest, start: snapshot.coverage.from },
    date,
    now,
    scenarioId === undefined ? service.durationMin : undefined,
  );
  const selected =
    typeof selectedStart === "number" &&
    Number.isSafeInteger(selectedStart) &&
    selectedStart >= snapshot.coverage.from &&
    selectedStart < snapshot.coverage.to &&
    (scenarioId !== undefined || selectedStart + service.durationMin <= snapshot.coverage.to) &&
    timeValue(localDate(selectedStart, timezone)) === date &&
    timeValue(isOnLocalGrid(selectedStart, timezone, slotGridMinutes));
  const grid =
    !selected && fallbackTime === undefined && starts.length === 0
      ? gridStarts(date, timezone, slotGridMinutes)
      : null;
  const start = selected
    ? selectedStart
    : fallbackTime !== undefined
      ? timeValue(resolveRecurringBoundary(date, fallbackTime, timezone))
      : (starts[0]?.start ??
        (grid?.ok
          ? grid.value.find(
              (minute) =>
                minute >= snapshot.coverage.from &&
                minute + service.durationMin <= snapshot.coverage.to,
            )
          : undefined) ??
        null);
  const request = start === null ? null : BookingRequestSchema.parse({ ...baseRequest, start });
  const instant = start === null ? null : timeValue(formatOffsetInstant(start, timezone));
  const time = starts.find((option) => option.start === start)?.time ?? instant?.slice(11, 16);
  const services = options(snapshot.services);
  const practitioners = options(snapshot.practitioners);
  const display = {
    timeZone: timezone,
    services: labels(snapshot.services),
    practitioners: labels(snapshot.practitioners),
    rooms: labels(snapshot.rooms),
    equipment: labels(snapshot.equipment),
  };

  const view = {
    scenarioId,
    audience,
    timezone,
    date,
    days,
    endDate,
    periods,
    start,
    instant,
    time,
    serviceId: service.id,
    service: service.displayName,
    practitionerId: practitioner?.id,
    practitioner: practitioner?.displayName ?? "Any practitioner",
    clock: timeValue(formatOffsetInstant(now, timezone)),
    dates,
    services,
    practitioners,
  } satisfies SelectionView;
  return {
    ...view,
    envelope,
    starts,
    check: () => (request ? check(snapshot, request, now, audience, display) : null),
    range: () =>
      calendarRange(
        snapshot,
        {
          fromDate: date,
          days,
          patientId,
          serviceId: service.id,
          ...preference,
        },
        now,
        audience,
        display,
      ),
    policy: request && audience === "staff" ? policyPreview(snapshot, request, now, display) : null,
  };
}

/** Curated Riverside options and the synchronous, audience-projected slot operation. */
export const staticAdapter = {
  scenarios: scenarios.map(({ id, label }) => ({ id, label })),

  open(query: string, selectedStart?: unknown, selectedDays?: unknown) {
    const selection = parseSelection(query);
    if (!selection) return null;
    const { scenario, audience, params } = selection;
    const preferredDays = preferredCalendarDays(selectedDays, scenario.days);

    const snapshot = ClinicSnapshotSchema.parse(buildScenario(scenario.id));
    const { timezone } = snapshot.clinic;
    const demoDate = timeValue(localDate(demoNow, timezone));
    const defaultDate = timeValue(addLocalDays(demoDate, scenario.day));
    const now = scenario.now
      ? timeValue(
          resolveRecurringBoundary(
            timeValue(addLocalDays(demoDate, scenario.now.day)),
            scenario.now.time,
            timezone,
          ),
        )
      : demoNow;
    const date = params.get("date") ?? defaultDate;
    return openSnapshot(
      { schemaVersion, snapshot, now },
      {
        scenarioId: scenario.id,
        date,
        audience,
        days: preferredDays,
        start: selectedStart,
        serviceId: params.get("serviceId") ?? scenario.serviceId,
        practitionerId: practitionerPreference(
          params.get("practitionerId") ?? scenario.practitionerId,
        ),
        patientId: scenario.patientId ?? "patient-0",
        fallbackTime: scenario.time,
      },
    );
  },

  openImported(envelope: SyntheticSnapshotEnvelope, changes: ImportedSelections = {}) {
    const { snapshot } = envelope;
    const patient = snapshot.patients[0];
    const service = snapshot.services[0];
    if (!patient || !service) return null;
    return openSnapshot(envelope, {
      ...changes,
      audience: changes.audience ?? "patient",
      patientId: patient.id,
      serviceId: changes.serviceId ?? service.id,
    });
  },
};
