import { BookingRequestSchema, ClinicSnapshotSchema, DateSchema } from "@whynot/contracts";
import {
  addLocalDays,
  evaluate,
  formatOffsetInstant,
  localDate,
  projectForAudience,
  resolveRecurringBoundary,
} from "@whynot/engine";
import { buildScenario, demoNow } from "@whynot/fixtures";

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

function timeValue<T>(result: { ok: true; value: T } | { ok: false }): T {
  if (!result.ok) throw new Error("Invalid curated scenario time");
  return result.value;
}

/** Curated Riverside options and the synchronous, audience-projected slot operation. */
export const staticAdapter = {
  scenarios: scenarios.map(({ id, label }) => ({ id, label })),

  open(query: string) {
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
    const start = resolveRecurringBoundary(date, scenario.time, timezone);
    const service = snapshot.services.find(
      ({ id }) => id === (params.get("serviceId") ?? scenario.serviceId),
    );
    const practitionerId = params.get("practitionerId") ?? scenario.practitionerId;
    const practitioner = snapshot.practitioners.find(({ id }) => id === practitionerId);
    if (!start.ok || !service || (practitionerId !== undefined && !practitioner)) return null;

    const request = BookingRequestSchema.parse({
      patientId: scenario.patientId ?? "patient-0",
      serviceId: service.id,
      start: start.value,
      ...(practitioner ? { practitionerId: practitioner.id } : {}),
    });

    const result = projectForAudience(
      evaluate(snapshot, request, { now: demoNow, alternatives: false }),
      audience,
      { requesterPatientId: request.patientId },
    );
    if (result.status === "invalid_request") return null;

    return {
      scenarioId: scenario.id,
      audience,
      timezone,
      date,
      time: scenario.time,
      service: service.displayName,
      practitioner: practitioner?.displayName ?? "Any practitioner",
      clock: timeValue(formatOffsetInstant(demoNow, timezone)),
      status: result.status,
    };
  },
};
