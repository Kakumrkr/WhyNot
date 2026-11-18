import { expect, it } from "vitest";
import { PatientEvaluationSchema, StaffEvaluationSchema } from "@whynot/contracts";
import { evaluate, projectForAudience } from "@whynot/engine";
import {
  buildMinimalRequest,
  buildMinimalSnapshot,
  buildScenario,
  demoNow,
  riversideMinute,
} from "../../fixtures/src/index.js";

it("projects H1's primary staff leave to public practitioner unavailability", () => {
  const snapshot = buildScenario("H1");
  const request = {
    patientId: "patient-0",
    serviceId: "minor-procedure",
    start: riversideMinute(1, "14:30"),
  };
  const now = riversideMinute(0, "09:00");
  const staff = evaluate(snapshot, request, { now, trace: true });
  const context = { requesterPatientId: request.patientId };
  expect(projectForAudience(staff, "staff", context)).toBe(staff);
  const patient = PatientEvaluationSchema.parse(projectForAudience(staff, "patient", context));
  if (patient.status !== "blocked") throw new Error("Expected the H1 blocker");
  expect(patient.explanation.primary).toHaveLength(6);
  const unavailable = patient.explanation.facts.find(
    (fact) => fact.ruleId === "practitioner-unavailable" && fact.practitionerId === "mehta",
  );
  expect(unavailable).toEqual({
    id: expect.stringMatching(/^fact-\d+$/),
    ruleId: "practitioner-unavailable",
    practitionerId: "mehta",
    params: {},
  });
  expect(patient.explanation.primary).toContain(unavailable?.id);
  expect(JSON.stringify(patient)).not.toMatch(/h1-procedure|patient-2|practitioner-time-off/);

  const nextRequest = { ...request, start: riversideMinute(1, "14:45") };
  const next = evaluate(snapshot, nextRequest, { now, trace: true });
  if (next.status !== "bookable" || staff.status !== "blocked")
    throw new Error("Expected H1's opening and original blocked result");
  const assignment = {
    practitionerId: next.assignment.practitionerId,
    start: next.assignment.start,
    end: next.assignment.end,
  };
  expect(PatientEvaluationSchema.parse(projectForAudience(next, "patient", context))).toEqual({
    status: "bookable",
    assignment,
    meta: next.meta,
  });
  const changes = [{ field: "start" as const, from: request.start, to: nextRequest.start }];
  const withAlternative = StaffEvaluationSchema.parse({
    ...staff,
    alternatives: [
      {
        request: nextRequest,
        assignment: next.assignment,
        category: "same-day",
        cost: 15,
        changes,
      },
    ],
    search: { status: "complete", from: request.start, to: nextRequest.start + 15, evaluated: 2 },
    adminFix: {
      factIds: [staff.explanation.primary[0]],
      changes: [{ entity: "policy", field: "minNoticeMin", value: 0 }],
      viaCandidate: next.assignment,
      cost: 1,
    },
  });
  const projected = PatientEvaluationSchema.parse(
    projectForAudience(withAlternative, "patient", context),
  );
  expect(projected).toEqual({
    ...patient,
    alternatives: [{ assignment, category: "same-day", cost: 15, changes }],
    search: withAlternative.status === "blocked" ? withAlternative.search : undefined,
  });
  expect(PatientEvaluationSchema.safeParse({ ...projected, trace: staff.trace }).success).toBe(
    false,
  );
});

it("preserves coverage when multiple incapable resources share one public fact", () => {
  const snapshot = buildMinimalSnapshot();
  const request = buildMinimalRequest();
  snapshot.services[0]!.requiredRoomCapability = "INTERNAL-CAPABILITY";
  snapshot.rooms.push({ ...snapshot.rooms[0]!, id: "PRIVATE-ROOM" });
  const staff = evaluate(snapshot, request, { now: demoNow, trace: true });
  if (staff.status !== "blocked") throw new Error("Expected a capability blocker");
  expect(staff.explanation.primary).toHaveLength(2);
  expect(staff.trace?.candidates).toHaveLength(2);
  const patient = PatientEvaluationSchema.parse(
    projectForAudience(staff, "patient", { requesterPatientId: request.patientId }),
  );
  expect(patient).toMatchObject({
    status: "blocked",
    explanation: {
      basis: "matrix",
      primary: ["fact-1"],
      facts: [{ id: "fact-1", ruleId: "resource-unavailable", params: {} }],
      groups: [{ id: "group-1", kind: "resources", factIds: ["fact-1"] }],
    },
  });
  expect(JSON.stringify(patient)).not.toMatch(/PRIVATE-|INTERNAL-CAPABILITY|room-capability/);
});

it("allowlists validation fields and omits arbitrary path and message text", () => {
  const context = { requesterPatientId: "patient-test" };
  const patient = projectForAudience(
    {
      status: "invalid_request",
      errors: [
        { code: "unknown_reference", path: ["request", "practitionerId"], message: "PRIVATE-ID" },
        { code: "invalid_request", path: ["request", "PRIVATE-PATH"], message: "PRIVATE-INPUT" },
        { code: "invalid_snapshot", path: ["bookings", 0, "id"], message: "PRIVATE-BOOKING" },
      ],
    },
    "patient",
    context,
  );
  expect(PatientEvaluationSchema.parse(patient)).toEqual({
    status: "invalid_request",
    errors: [
      { code: "unknown_reference", field: "practitionerId" },
      { code: "invalid_request", field: "request" },
      { code: "invalid_snapshot", field: "snapshot" },
    ],
  });
  expect(projectForAudience(patient, "patient", context)).toEqual(patient);
});
