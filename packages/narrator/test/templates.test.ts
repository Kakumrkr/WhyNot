import { expect, it } from "vitest";
import { PublicRuleIdSchema, StaffEvaluationSchema, type ClinicSnapshot } from "@whynot/contracts";
import { catalog, evaluate, projectForAudience } from "../../engine/src/index.js";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";
import { TemplateNarrator } from "../src/index.js";

const display = {
  timeZone: "Europe/London",
  practitioners: new Map([["practitioner-test", "Dr. Example"]]),
};
const context = { requesterPatientId: "patient-test" };
const metadata = {
  schemaVersion: 1,
  engineVersion: "test",
  policyVersionId: "v1",
  evaluatedAt: demoNow,
} as const;
const date = "2026-11-16";
const count = { date, count: 1, limit: 1 };
const booking = { bookingId: "private-booking" };

it("covers every staff catalog rule and its projected patient template", () => {
  const params = {
    "clinic-closed-day": { date },
    "clinic-hours": { date },
    "min-notice": { requiredMin: 120, actualMin: 20 },
    "max-advance": { maxAdvanceDays: 1, actualMin: 1540 },
    "patient-eligibility-returning": {},
    "patient-eligibility-referral": { serviceId: "private-service" },
    "patient-daily-limit": count,
    "request-practitioner": { practitionerId: "practitioner-test" },
    "practitioner-skill": { requiredSkill: "consult" },
    "practitioner-hours": { date },
    "practitioner-break": { date, from: "11:00", to: "11:15" },
    "practitioner-time-off": { timeOffId: "private-leave", reason: "Private staff reason" },
    "practitioner-busy": booking,
    "practitioner-buffer": { ...booking, serviceId: "private-service", bufferMin: 15 },
    "practitioner-daily-cap": count,
    "room-capability": { requiredCapability: "private-capability" },
    "room-maintenance": { windowId: "private-maintenance" },
    "room-busy": booking,
    "room-turnover": { ...booking, serviceId: "private-service", turnoverMin: 15 },
    "equipment-type": { requiredType: "private-type" },
    "equipment-maintenance": { windowId: "private-maintenance" },
    "equipment-busy": booking,
    "resource-missing": { dimension: "equipment" },
  } satisfies Record<keyof typeof catalog, object>;
  const publicRules = new Set<string>();
  for (const rule of Object.values(catalog)) {
    const id = `private-fact-${rule.id}`;
    const subject = rule.id.startsWith("practitioner-")
      ? { type: "practitioner", id: "practitioner-test" }
      : { type: "room", id: "private-resource" };
    const staff = StaffEvaluationSchema.parse({
      status: "blocked",
      explanation: {
        basis: rule.id === "resource-missing" ? "missing_resource" : "matrix",
        primary: [id],
        groups: [{ id: "private-group", kind: "resources", factIds: [id] }],
        perCandidateSummary: [],
        optimal: true,
        facts: [
          {
            id,
            ruleId: rule.id,
            ruleVersion: rule.version,
            kind: rule.family,
            subject,
            visibility: rule.visibility,
            relaxableBy: rule.relaxableBy,
            params: params[rule.id],
          },
        ],
      },
      alternatives: [],
      search: { status: "disabled", from: null, to: null, evaluated: 0 },
      adminFix: null,
      meta: metadata,
    });
    const staffNarration = TemplateNarrator.renderStaff(staff, display);
    expect(staffNarration.primary.sentences).toEqual([
      { text: expect.stringMatching(/\.$/), factIds: [id] },
    ]);
    const projected = projectForAudience(staff, "patient", context);
    if (projected.status !== "blocked") throw new Error("Expected a blocked template fixture");
    publicRules.add(projected.explanation.facts[0]!.ruleId);
    const publicNarration = TemplateNarrator.renderPatient(projected, display);
    expect(publicNarration.primary.sentences).toEqual([
      { text: expect.stringMatching(/\.$/), factIds: ["fact-1"] },
    ]);
    expect(JSON.stringify(publicNarration)).not.toMatch(
      /private-|Private staff reason|after-appointment buffer for service/,
    );
  }
  expect(publicRules).toEqual(new Set(PublicRuleIdSchema.options));
});

function blockedPatient(snapshot: ClinicSnapshot) {
  const staff = evaluate(snapshot, buildMinimalRequest(), { now: demoNow, alternatives: false });
  const patient = projectForAudience(staff, "patient", context);
  if (patient.status !== "blocked") throw new Error("Expected a blocked test fixture");
  return patient;
}

it("keeps referral guidance cited and separate from verified alternatives", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.eligibility = "referral_required";
  const patient = blockedPatient(snapshot);
  const narration = TemplateNarrator.renderPatient(patient, display);
  expect(narration.primary.sentences[0]?.text).toBe(
    "This service requires a referral, and the clinic has none on file for you.",
  );
  expect(narration.guidance).toEqual([
    {
      text: "Changing the time will not resolve the referral requirement. Ask the clinic how to get a referral for this service.",
      factIds: patient.explanation.primary,
    },
  ]);
  expect(narration.alternatives).toEqual([]);
});

it("gives the actual appointment count when existing bookings exceed the daily limit", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.bookings = [0, 30].map((offset) => ({
    id: `previous-${offset}`,
    patientId: context.requesterPatientId,
    practitionerId: "practitioner-test",
    roomId: "room-test",
    serviceId: "consult",
    start: demoNow + offset,
    end: demoNow + offset + 15,
    status: "confirmed",
  }));
  const narration = TemplateNarrator.renderPatient(blockedPatient(snapshot), display);
  expect(narration.primary.sentences).toEqual([
    { text: "You have 2 appointments that day. The limit is 1.", factIds: ["fact-1"] },
  ]);
});

it("renders structural failures and time-independent capability proofs without suggesting another time", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.requiredRoomCapability = "procedure";
  const incompatible = TemplateNarrator.renderPatient(blockedPatient(snapshot), display);
  expect(incompatible.headline).toBe(
    "This service is unavailable here with the current practitioners and resources.",
  );
  snapshot.rooms = [];
  const missing = TemplateNarrator.renderPatient(blockedPatient(snapshot), display);
  expect(missing.primary.sentences).toEqual([
    { text: "The clinic has no rooms available for booking.", factIds: ["fact-1"] },
  ]);
  expect(missing.alternatives).toEqual([]);
});

it.each([
  ["00:30", "00:45", "01:15"],
  ["01:05", "01:15", "01:30"],
])(
  "shows the offset when maintenance from %s UTC ends in the repeated local hour",
  (from, start, to) => {
    const minute = (time: string) => Date.parse(`2026-10-25T${time}:00Z`) / 60000;
    const snapshot = buildMinimalSnapshot();
    const request = { ...buildMinimalRequest(), start: minute(start) };
    const hours = [{ weekday: 7, from: "00:00", to: "06:00" }];
    snapshot.coverage = { from: request.start - 1440, to: request.start + 1440 };
    snapshot.clinic.openingHours = hours;
    snapshot.practitioners[0]!.workingHours = hours;
    snapshot.rooms[0]!.maintenance = [
      { id: "fold-maintenance", from: minute(from), to: minute(to) },
    ];
    const staff = evaluate(snapshot, request, { now: request.start - 120 });
    const patient = projectForAudience(staff, "patient", context);
    const narration = TemplateNarrator.renderPatient(patient, display);
    expect(narration.primary.sentences).toEqual([
      {
        text: expect.stringMatching(
          new RegExp(`^A room is under maintenance until ${to} GMT(?:\\+0)?\\.$`),
        ),
        factIds: ["fact-1"],
      },
    ]);
  },
);

it("renders only supplied alternatives and describes incomplete searches accurately", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.policy.minNoticeMin = 121;
  const patient = blockedPatient(snapshot);
  const from = demoNow + 120;
  const to = demoNow + 180;
  const render = (search: typeof patient.search) =>
    TemplateNarrator.renderPatient({ ...patient, search }, display).searchNote;
  expect(render(patient.search)).toBe("The clinic did not search for alternatives.");
  expect(render({ status: "complete", from, to, evaluated: 4 })).toMatch(
    /^No alternatives were found from 16 Nov 2026, 11:00 GMT(?:\+0)? to 16 Nov 2026, 12:00 GMT(?:\+0)?\.$/,
  );
  expect(render({ status: "budget_exhausted", from, to, evaluated: 3 })).toMatch(
    /openings may still be available/,
  );
  expect(render({ status: "window_limited", from, to, evaluated: 3 })).toMatch(
    /More schedule data is needed/,
  );

  const opening = evaluate(snapshot, buildMinimalRequest({ start: from + 15 }), { now: demoNow });
  if (opening.status !== "bookable") throw new Error("Expected an available test slot");
  const projected = projectForAudience(opening, "patient", context);
  if (projected.status !== "bookable") throw new Error("Expected a projected opening");
  const withAlternative = TemplateNarrator.renderPatient(
    {
      ...patient,
      search: { status: "complete", from, to, evaluated: 4 },
      alternatives: [
        {
          assignment: projected.assignment,
          category: "same-day",
          cost: 1,
          changes: [{ field: "start", from, to: from + 15 }],
        },
      ],
    },
    display,
  );
  expect(withAlternative.alternatives).toEqual([
    expect.stringMatching(/^16 Nov 2026, 11:15 GMT(?:\+0)? with Dr\. Example$/),
  ]);
  expect(withAlternative.searchNote).toBeNull();
  expect(() => TemplateNarrator.renderPatient(opening, display)).toThrow();
});
