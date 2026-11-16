import {
  ClinicSnapshotSchema,
  EvaluationInputSchema,
  type BookingRequest,
  type ClinicSnapshot,
} from "@whynot/contracts";

/** Frozen demo clock: Monday 2026-11-16 09:00 Europe/London, independent of runtime. */
export const demoNow = 29913660;

/** Build a fresh, authored minimal synthetic clinic; this is not the Riverside scenario set. */
export function buildMinimalSnapshot(overrides: Partial<ClinicSnapshot> = {}): ClinicSnapshot {
  return ClinicSnapshotSchema.parse({
    clinic: {
      id: "clinic-test",
      name: "Synthetic Test Clinic",
      timezone: "Europe/London",
      slotGridMinutes: 15,
      openingHours: [{ weekday: 1, from: "08:00", to: "18:00" }],
      closedDates: [],
    },
    coverage: { from: demoNow - 1440, to: demoNow + 31 * 1440 },
    practitioners: [
      {
        id: "practitioner-test",
        displayName: "Test Practitioner",
        role: "GP",
        skills: ["consult"],
        workingHours: [{ weekday: 1, from: "08:00", to: "18:00" }],
        breaks: [],
        timeOff: [],
      },
    ],
    rooms: [{ id: "room-test", displayName: "Test Room", capabilities: [], maintenance: [] }],
    equipment: [],
    services: [
      {
        id: "consult",
        displayName: "Test Consultation",
        durationMin: 15,
        requiredSkill: "consult",
        bufferAfterMin: 0,
        roomTurnoverMin: 0,
        eligibility: "any",
      },
    ],
    patients: [
      { id: "patient-test", displayName: "Test Patient", isReturning: true, referrals: [] },
    ],
    bookings: [],
    policy: {
      versionId: "policy-test-v1",
      minNoticeMin: 120,
      maxAdvanceDays: 30,
      patientMaxBookingsPerDay: 1,
    },
    ...overrides,
  });
}

/** Build a reference-valid request for the minimal fixture, without claiming feasibility. */
export function buildMinimalRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  const request = {
    patientId: "patient-test",
    serviceId: "consult",
    start: demoNow + 120,
    ...overrides,
  };
  return EvaluationInputSchema.parse({
    snapshot: buildMinimalSnapshot(),
    request,
    options: { now: demoNow },
  }).request;
}
