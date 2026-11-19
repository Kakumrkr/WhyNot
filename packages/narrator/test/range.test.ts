import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { explainRange, projectForAudience } from "../../engine/src/index.js";
import { buildScenario, riversideMinute } from "../../fixtures/src/index.js";
import { TemplateNarrator } from "../src/index.js";

function hero(id: string) {
  const { request, now, guidance } = JSON.parse(
    readFileSync(new URL(`../../fixtures/scenarios/${id}.json`, import.meta.url), "utf8"),
  );
  const snapshot = buildScenario(id);
  const staff = explainRange(snapshot, request, riversideMinute(now.day, now.time));
  const patient = projectForAudience(staff, "patient", { requesterPatientId: request.patientId });
  const display = {
    timeZone: snapshot.clinic.timezone,
    practitioners: new Map(snapshot.practitioners.map(({ id, displayName }) => [id, displayName])),
  };
  return { staff, patient, display, guidance };
}

it("puts the referral first and suppresses time-by-time detail in H9", () => {
  const { patient, display, guidance } = hero("H9");
  const output = TemplateNarrator.renderPatientRange(patient, display);
  expect(output.headline).toContain("requires a referral");
  expect(output.guidance).toEqual([{ text: guidance, factIds: output.commonCause[0]!.factIds }]);
  expect(output.segments).toEqual([]);
  expect(output.nextAvailable).toBeNull();
});

it("shows H10 working hours as the cause and the same practitioner's verified opening", () => {
  const { patient, display } = hero("H10");
  const output = TemplateNarrator.renderPatientRange(patient, display);
  expect(output.headline).toMatch(/Dr. Lena Okafor's working hours on Friday/);
  expect(output.nextAvailable).toMatch(/10:00.* with Dr. Lena Okafor/);
});

it("describes H11 as three start windows and cites projected evidence without staff details", () => {
  const { staff, patient, display } = hero("H11");
  if (patient.status !== "fully_blocked") throw new Error("Expected blocked range for narration");
  const output = TemplateNarrator.renderPatientRange(patient, display);
  expect(output.segments.map(({ label }) => label)).toEqual([
    expect.stringMatching(/^Starts from .*08:00.* to before 10:30$/),
    expect.stringMatching(/^Starts from .*10:30.* to before 16:00$/),
    expect.stringMatching(/^Starts from .*16:00.* to before 17:45$/),
  ]);
  expect(output.segments[0]?.sentences[0]?.text).toContain("2 hours");
  expect(output.segments[1]?.sentences.map(({ text }) => text)).toEqual(
    expect.arrayContaining([
      "Dr. Asha Rao is already booked at these starts.",
      "Dr. Vikram Mehta is unavailable for these starts.",
    ]),
  );
  for (const [index, segment] of output.segments.entries())
    expect(segment.sentences.flatMap(({ factIds }) => factIds).sort()).toEqual(
      [...patient.segments[index]!.factIds].sort(),
    );
  expect(JSON.stringify(output)).not.toMatch(/annual leave|h11-consult|patient-0/);
  expect(JSON.stringify(TemplateNarrator.renderStaffRange(staff, display))).toContain(
    "Fictional annual leave",
  );
});
