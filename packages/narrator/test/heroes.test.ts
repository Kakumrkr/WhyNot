import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { PatientExplanation } from "@whynot/contracts";
import { evaluate, projectForAudience } from "../../engine/src/index.js";
import { buildScenario, riversideMinute } from "../../fixtures/src/index.js";
import { TemplateNarrator, type TemplateNarration } from "../src/index.js";

function checkCitations(
  narration: TemplateNarration,
  explanation: Pick<PatientExplanation, "primary" | "groups"> & {
    facts: { id: string; ruleId: string }[];
  },
) {
  expect(narration.source).toBe("template");
  expect(narration.primary.sentences.map(({ factIds }) => factIds)).toEqual(
    explanation.primary.map((id) => [id]),
  );
  expect(
    narration.details.groups.map(({ id, sentences }) => [
      id,
      sentences.map(({ factIds }) => factIds),
    ]),
  ).toEqual(explanation.groups.map(({ id, factIds }) => [id, factIds.map((factId) => [factId])]));
  for (const guidance of narration.guidance) {
    expect(guidance.factIds).toHaveLength(1);
    expect(explanation.facts.find(({ id }) => id === guidance.factIds[0])?.ruleId).toMatch(
      /^patient-eligibility-/,
    );
  }
}

for (let i = 1; i <= 8; i++) {
  it(`H${i} renders the authored patient and staff text with exact proof and group citations`, () => {
    const golden: {
      id: string;
      day: number;
      time: string;
      serviceId: string;
      patientId: string;
      practitionerId?: string;
      templates: { patient: string[]; staff: string[]; guidance?: string[] };
    } = JSON.parse(
      readFileSync(new URL(`../../fixtures/scenarios/H${i}.json`, import.meta.url), "utf8"),
    );
    const snapshot = buildScenario(golden.id);
    const request = {
      patientId: golden.patientId,
      serviceId: golden.serviceId,
      start: riversideMinute(golden.day, golden.time),
      ...(golden.practitionerId === undefined ? {} : { practitionerId: golden.practitionerId }),
    };
    const staff = evaluate(snapshot, request, { now: riversideMinute(0, "09:00"), trace: true });
    const patient = projectForAudience(staff, "patient", { requesterPatientId: request.patientId });
    if (staff.status !== "blocked" || patient.status !== "blocked")
      throw new Error("Expected a blocked hero");
    const display = {
      timeZone: snapshot.clinic.timezone,
      practitioners: new Map(
        snapshot.practitioners.map(({ id, displayName }) => [id, displayName]),
      ),
      rooms: new Map(snapshot.rooms.map(({ id, displayName }) => [id, displayName])),
      equipment: new Map(snapshot.equipment.map(({ id, displayName }) => [id, displayName])),
    };
    const publicText = TemplateNarrator.renderPatient(patient, display);
    const staffText = TemplateNarrator.renderStaff(staff, display);
    expect(publicText.primary.sentences.map(({ text }) => text).sort()).toEqual(
      [...golden.templates.patient].sort(),
    );
    expect(staffText.primary.sentences.map(({ text }) => text).sort()).toEqual(
      [...golden.templates.staff].sort(),
    );
    expect(publicText.guidance.map(({ text }) => text)).toEqual(golden.templates.guidance ?? []);
    checkCitations(publicText, patient.explanation);
    checkCitations(staffText, staff.explanation);
    expect(TemplateNarrator.renderPatient(patient, display)).toEqual(publicText);
    if (i === 1) {
      const context = publicText.details.groups.find(
        ({ label }) => label === "Practitioner qualifications",
      );
      expect(context?.sentences.map(({ text }) => text).sort()).toEqual([
        "Dr. Lena Okafor does not offer this service.",
        "Nurse Priya Iyer does not offer this service.",
        "Physio Tom Harris does not offer this service.",
        "Sonographer Mei Chen does not offer this service.",
      ]);
      expect(JSON.stringify(publicText)).not.toMatch(
        /mehta-leave|Fictional annual leave|h1-procedure/,
      );
    }
    if (i === 4) expect(publicText.alternatives).toEqual([]);
  });
}
