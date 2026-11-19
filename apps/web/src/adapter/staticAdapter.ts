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

const scenarios = [
  { id: "H1", label: "Minor procedure", day: 1, time: "14:30", serviceId: "minor-procedure" },
  { id: "H2", label: "Ultrasound", day: 3, time: "10:00", serviceId: "ultrasound" },
  { id: "H3", label: "Same-day consultation", day: 0, time: "10:00", serviceId: "consult" },
  {
    id: "H4",
    label: "Physiotherapy follow-up",
    day: 2,
    time: "11:00",
    serviceId: "physio-follow-up",
    patientId: "patient-1",
  },
  {
    id: "H5",
    label: "Physiotherapy assessment",
    day: 2,
    time: "16:00",
    serviceId: "physio-assessment",
  },
  { id: "H6", label: "Wound dressing", day: 1, time: "11:00", serviceId: "dressing" },
  {
    id: "H7",
    label: "Consultation with Dr. Okafor",
    day: 2,
    time: "09:00",
    serviceId: "consult",
    practitionerId: "okafor",
  },
  { id: "H8", label: "Blood test", day: 1, time: "11:00", serviceId: "bloods" },
];

const parameters = new Set(["scenarioId", "audience", "date", "serviceId", "practitionerId"]);
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
  narration: ReturnType<typeof TemplateNarrator.renderStaff>,
  display: TemplateDisplay,
) {
  const sentences = new Map(
    narration.details.groups.flatMap(({ sentences }) =>
      sentences.flatMap(({ text, factIds }) => factIds.map((id) => [id, text] as const)),
    ),
  );
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
  audience: "patient" | "staff",
  display: TemplateDisplay,
) {
  const evaluated = evaluate(snapshot, request, { now: demoNow });
  const context = { requesterPatientId: request.patientId };
  const patient = audience === "patient" ? projectForAudience(evaluated, "patient", context) : null;
  const result = patient ?? evaluated;
  const narration = patient
    ? TemplateNarrator.renderPatient(patient, display)
    : TemplateNarrator.renderStaff(evaluated, display);

  if (result.status === "invalid_request") return { status: result.status, narration };
  const practitionerName = (id: string | null) =>
    id === null ? "Any practitioner" : (display.practitioners?.get(id) ?? "Practitioner");
  if (result.status === "bookable")
    return {
      status: result.status,
      practitioner: practitionerName(result.assignment.practitionerId),
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
    candidates: "adminFix" in result ? staffCandidates(result, narration, display) : [],
    alternatives: result.alternatives.map(({ assignment, changes }, index) => {
      const preference = changes.find((change) => change.field === "practitionerId");
      return {
        title: narration.alternatives[index] ?? readable(assignment.start),
        changes: changes.map(changeText),
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

function availability(snapshot: ClinicSnapshot, request: BookingRequest, date: string) {
  const { timezone, openingHours, slotGridMinutes } = snapshot.clinic;
  const hours = timeValue(datedSchedule(openingHours, date, timezone));
  if (hours.length === 0) return [];
  const starts = timeValue(gridStarts(date, timezone, slotGridMinutes));
  return starts
    .filter((start) => hours.some(({ from, to }) => start >= from && start < to))
    .map((start) => ({
      start,
      time: timeValue(formatOffsetInstant(start, timezone)).slice(11, 16),
      available: isBookable(snapshot, { ...request, start }, demoNow),
    }));
}

/** Curated Riverside options and the synchronous, audience-projected slot operation. */
export const staticAdapter = {
  scenarios: scenarios.map(({ id, label }) => ({ id, label })),

  open(query: string, selectedStart?: unknown) {
    const params = new URLSearchParams(query);
    for (const key of params.keys()) {
      if (!parameters.has(key) || params.getAll(key).length > 1) return null;
    }

    const scenario = scenarios.find(({ id }) => id === (params.get("scenarioId") ?? "H1"));
    const audience = params.get("audience") ?? "patient";
    if (!scenario || (audience !== "patient" && audience !== "staff")) return null;
    if (params.has("date") && !DateSchema.safeParse(params.get("date")).success) return null;

    const snapshot = ClinicSnapshotSchema.parse(buildScenario(scenario.id));
    const { timezone } = snapshot.clinic;
    const defaultDate = timeValue(
      addLocalDays(timeValue(localDate(demoNow, timezone)), scenario.day),
    );
    const date = params.get("date") ?? defaultDate;
    const firstDate = timeValue(localDate(snapshot.coverage.from, timezone));
    const lastDate = timeValue(localDate(snapshot.coverage.to - 1, timezone));
    if (date < firstDate || date > lastDate) return null;
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
      start,
      instant: timeValue(formatOffsetInstant(start, timezone)),
      serviceId: service.id,
      service: service.displayName,
      practitionerId: practitioner?.id ?? anyPractitioner,
      practitioner: practitioner?.displayName ?? "Any practitioner",
      clock: timeValue(formatOffsetInstant(demoNow, timezone)),
      dates,
      services,
      practitioners,
      starts: availability(snapshot, request, date),
      check: () => check(snapshot, request, audience, display),
    };
  },
};

export type Selection = NonNullable<ReturnType<typeof staticAdapter.open>>;
export type SlotCheck = ReturnType<Selection["check"]>;
