import type { ClinicSnapshot, Fact, StaffEvaluation } from "../src/index.js";

export const snapshot = {
  clinic: {
    id: "clinic",
    name: "Test Clinic",
    timezone: "Europe/London",
    slotGridMinutes: 15,
    openingHours: [{ weekday: 1, from: "08:00", to: "18:00" }],
    closedDates: [],
  },
  coverage: { from: 0, to: 1440 },
  practitioners: [
    {
      id: "doctor",
      displayName: "Doctor",
      role: "GP",
      skills: ["consult"],
      workingHours: [],
      breaks: [],
      timeOff: [],
    },
  ],
  rooms: [{ id: "room", displayName: "Room", capabilities: [], maintenance: [] }],
  equipment: [],
  services: [
    {
      id: "consult",
      displayName: "Consultation",
      durationMin: 15,
      requiredSkill: "consult",
      bufferAfterMin: 0,
      roomTurnoverMin: 0,
      eligibility: "any",
    },
  ],
  patients: [{ id: "patient", displayName: "Patient", isReturning: true, referrals: [] }],
  bookings: [],
  policy: { versionId: "v1", minNoticeMin: 120, maxAdvanceDays: 30, patientMaxBookingsPerDay: 1 },
} satisfies ClinicSnapshot;
export const request = { patientId: "patient", serviceId: "consult", start: 120 };
export const assignment = {
  practitionerId: "doctor",
  roomId: "room",
  equipmentId: null,
  start: 120,
  end: 135,
};
export const meta = {
  schemaVersion: 1,
  engineVersion: "test",
  policyVersionId: "v1",
  evaluatedAt: 0,
} as const;
export const disabled = { status: "disabled", from: null, to: null, evaluated: 0 } as const;
export const fact = {
  id: "notice:clinic",
  ruleId: "min-notice",
  ruleVersion: 1,
  kind: "timing-policy",
  subject: { type: "clinic", id: "clinic" },
  params: { requiredMin: 120, actualMin: 60 },
  visibility: "public",
  relaxableBy: ["patient", "admin"],
} satisfies Fact;
export const explanation = {
  basis: "matrix",
  primary: [fact.id],
  facts: [fact],
  optimal: true,
  groups: [{ id: "request", kind: "request", factIds: [fact.id] }],
  perCandidateSummary: [],
} as const;
export const blocked = {
  status: "blocked",
  explanation: {
    ...explanation,
    primary: [fact.id],
    facts: [fact],
    groups: [{ id: "request", kind: "request", factIds: [fact.id] }],
    perCandidateSummary: [],
  },
  alternatives: [],
  search: disabled,
  adminFix: null,
  meta,
} satisfies StaffEvaluation;
export const publicFact = {
  id: "fact-1",
  ruleId: "min-notice",
  params: { requiredMin: 120, actualMin: 60 },
};
export const patientBlocked = {
  status: "blocked",
  explanation: { basis: "matrix", primary: ["fact-1"], facts: [publicFact], groups: [] },
  alternatives: [],
  search: disabled,
  meta,
};
export const alternative = {
  request: { ...request, start: 150 },
  assignment: { ...assignment, start: 150, end: 165 },
  category: "same-day",
  cost: 2,
  changes: [{ field: "start", from: 120, to: 150 }],
};
