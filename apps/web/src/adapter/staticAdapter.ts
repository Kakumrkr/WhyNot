import {
  BookingRequestSchema,
  ClinicSnapshotSchema,
  DateSchema,
  type Alternative,
  type BookingRequest,
  type ClinicSnapshot,
  type StaffEvaluation,
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
import { TemplateNarrator, type TemplateDisplay } from "@whynot/narrator";
import { calendarRange } from "./calendarRange.js";
import { policyPreview } from "./policyPreview.js";
import { scenarios } from "./scenarios.js";
import { staffInspector } from "./staffInspector.js";

const parameters = new Set(["scenarioId", "audience", "date", "serviceId", "practitionerId"]);
const calendarPeriods = [
  { days: 1, label: "One day" },
  { days: 5, label: "Five days" },
  { days: 7, label: "Seven days" },
];
export const anyPractitioner = "any";

function timeValue<T>(result: { ok: true; value: T } | { ok: false }): T {
  if (!result.ok) throw new Error("Invalid curated scenario time");
  return result.value;
}

function options(entries: readonly { id: string; displayName: string }[]) {
  return entries.map(({ id, displayName }) => ({ id, label: displayName }));
}

function labels(entries: readonly { id: string; displayName: string }[]) {
  return new Map(entries.map(({ id, displayName }) => [id, displayName]));
}

function staffCandidates(
  result: Extract<StaffEvaluation, { status: "blocked" }>,
  sentences: ReadonlyMap<string, string>,
  display: TemplateDisplay,
) {
  return result.explanation.perCandidateSummary.map(({ practitionerId, candidate, factIds }) => ({
    practitioner: display.practitioners?.get(practitionerId),
    room: display.rooms?.get(candidate.roomId),
    equipment: candidate.equipmentId ? display.equipment?.get(candidate.equipmentId) : undefined,
    blockers: factIds.map((id) => {
      const sentence = sentences.get(id);
      if (sentence === undefined) throw new Error("Missing candidate blocker template");
      return sentence;
    }),
  }));
}

function check(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  now: number,
  audience: "patient" | "staff",
  display: TemplateDisplay,
) {
  const evaluated = evaluate(snapshot, request, {
    now,
    trace: audience === "staff",
    includeAdminFix: audience === "staff",
  });
  const context = { requesterPatientId: request.patientId };
  const patient = audience === "patient" ? projectForAudience(evaluated, "patient", context) : null;
  const result = patient ?? evaluated;
  const narration = patient
    ? TemplateNarrator.renderPatient(patient, display)
    : TemplateNarrator.renderStaff(evaluated, display);

  if (result.status === "invalid_request") return { status: result.status, narration };
  const practitionerName = (id: string | null) =>
    id === null ? "Any practitioner" : (display.practitioners?.get(id) ?? "Practitioner");
  const sentences = new Map(
    narration.details.groups.flatMap(({ sentences }) =>
      sentences.flatMap(({ text, factIds }) => factIds.map((id) => [id, text] as const)),
    ),
  );
  const inspector =
    patient || evaluated.status === "invalid_request"
      ? null
      : staffInspector(evaluated, sentences, display);
  if (result.status === "bookable")
    return {
      status: result.status,
      practitioner: practitionerName(result.assignment.practitionerId),
      inspector,
    };

  const instant = (start: number) => timeValue(formatOffsetInstant(start, display.timeZone));
  const readable = (start: number) => {
    const iso = instant(start);
    return `${iso.slice(0, 10)} at ${iso.slice(11, 16)}`;
  };
  const changeText = (change: Alternative["changes"][number]) =>
    change.field === "start"
      ? {
          label: "Start",
          from: readable(change.from),
          to: readable(change.to),
        }
      : {
          label: "Practitioner",
          from: practitionerName(change.from),
          to: practitionerName(change.to),
        };
  return {
    status: result.status,
    narration,
    inspector,
    candidates: "adminFix" in result ? staffCandidates(result, sentences, display) : [],
    suggestedChanges: "adminFix" in result ? result.adminFix?.changes : undefined,
    alternatives: result.alternatives.map((alternative, index) => {
      const { assignment, changes, category, cost } = alternative;
      const preference = changes.find((change) => change.field === "practitionerId");
      return {
        title: narration.alternatives[index] ?? readable(assignment.start),
        changes: changes.map(changeText),
        category,
        cost,
        start: assignment.start,
        date: instant(assignment.start).slice(0, 10),
        practitionerId: preference ? preference.to : request.practitionerId,
      };
    }),
    search: {
      note: narration.searchNote ?? "The search completed for this window.",
      coverage:
        result.search.status === "disabled"
          ? null
          : {
              from: readable(result.search.from),
              to: readable(result.search.to),
              evaluated: result.search.evaluated,
            },
    },
  };
}

function availability(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  date: string,
  now: number,
) {
  const { timezone, openingHours, slotGridMinutes, closedDates } = snapshot.clinic;
  if (closedDates.includes(date)) return [];
  const hours = timeValue(datedSchedule(openingHours, date, timezone));
  if (hours.length === 0) return [];
  const starts = timeValue(gridStarts(date, timezone, slotGridMinutes));
  return starts
    .filter((start) => hours.some(({ from, to }) => start >= from && start < to))
    .map((start) => ({
      start,
      time: timeValue(formatOffsetInstant(start, timezone)).slice(11, 16),
      available: isBookable(snapshot, { ...request, start }, now),
    }));
}

/** Curated Riverside options and the synchronous, audience-projected slot operation. */
export const staticAdapter = {
  scenarios: scenarios.map(({ id, label }) => ({ id, label })),

  open(query: string, selectedStart?: unknown, selectedDays?: unknown) {
    const params = new URLSearchParams(query);
    for (const key of params.keys()) {
      if (!parameters.has(key) || params.getAll(key).length > 1) return null;
    }

    const scenario = scenarios.find(({ id }) => id === (params.get("scenarioId") ?? "H1"));
    const audience = params.get("audience") ?? "patient";
    if (!scenario || (audience !== "patient" && audience !== "staff")) return null;
    if (params.has("date") && !DateSchema.safeParse(params.get("date")).success) return null;
    const preferredDays =
      calendarPeriods.find((entry) => entry.days === selectedDays)?.days ?? scenario.days ?? 1;

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
    const firstDate = timeValue(localDate(snapshot.coverage.from, timezone));
    const lastDate = timeValue(localDate(snapshot.coverage.to - 1, timezone));
    if (date < firstDate || date > lastDate) return null;
    const periods = calendarPeriods
      .map((period) => ({ ...period, endDate: timeValue(addLocalDays(date, period.days - 1)) }))
      .filter(({ endDate }) => endDate <= lastDate);
    const period = periods.find(({ days }) => days === preferredDays) ?? periods.at(-1);
    if (!period) throw new Error("No calendar period for a covered date");
    const { days, endDate } = period;
    const fallback = timeValue(resolveRecurringBoundary(date, scenario.time, timezone));
    const start =
      typeof selectedStart === "number" &&
      Number.isSafeInteger(selectedStart) &&
      selectedStart >= snapshot.coverage.from &&
      selectedStart < snapshot.coverage.to &&
      timeValue(localDate(selectedStart, timezone)) === date &&
      timeValue(isOnLocalGrid(selectedStart, timezone, snapshot.clinic.slotGridMinutes))
        ? selectedStart
        : fallback;
    const service = snapshot.services.find(
      ({ id }) => id === (params.get("serviceId") ?? scenario.serviceId),
    );
    const preferred = params.get("practitionerId") ?? scenario.practitionerId;
    const practitionerId = preferred === anyPractitioner ? undefined : preferred;
    const practitioner = snapshot.practitioners.find(({ id }) => id === practitionerId);
    if (!service || (practitionerId !== undefined && !practitioner)) return null;

    const request = BookingRequestSchema.parse({
      patientId: scenario.patientId ?? "patient-0",
      serviceId: service.id,
      start,
      ...(practitioner ? { practitionerId: practitioner.id } : {}),
    });

    const services = options(snapshot.services);
    const practitioners = options(snapshot.practitioners);
    const display = {
      timeZone: timezone,
      services: labels(snapshot.services),
      practitioners: labels(snapshot.practitioners),
      rooms: labels(snapshot.rooms),
      equipment: labels(snapshot.equipment),
    };
    const dates: string[] = [];
    for (let day = firstDate; day <= lastDate; day = timeValue(addLocalDays(day, 1))) {
      dates.push(day);
    }

    return {
      scenarioId: scenario.id,
      audience,
      timezone,
      date,
      days,
      endDate,
      periods,
      start,
      instant: timeValue(formatOffsetInstant(start, timezone)),
      serviceId: service.id,
      service: service.displayName,
      practitionerId: practitioner?.id ?? anyPractitioner,
      practitioner: practitioner?.displayName ?? "Any practitioner",
      clock: timeValue(formatOffsetInstant(now, timezone)),
      dates,
      services,
      practitioners,
      starts: availability(snapshot, request, date, now),
      check: () => check(snapshot, request, now, audience, display),
      range: () =>
        calendarRange(
          snapshot,
          {
            fromDate: date,
            days,
            patientId: request.patientId,
            serviceId: request.serviceId,
            ...(request.practitionerId === undefined
              ? {}
              : { practitionerId: request.practitionerId }),
          },
          now,
          audience,
          display,
        ),
      policy: audience === "staff" ? policyPreview(snapshot, request, now, display) : null,
    };
  },
};

export type Selection = NonNullable<ReturnType<typeof staticAdapter.open>>;
export type SlotCheck = ReturnType<Selection["check"]>;
