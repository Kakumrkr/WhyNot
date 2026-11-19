import assert from "node:assert/strict";
import { log } from "node:console";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import {
  BookingRequestSchema,
  PatientEvaluationSchema,
  StaffEvaluationSchema,
  SyntheticSnapshotEnvelopeSchema,
} from "@whynot/contracts/schemas";
import {
  applyPolicyChanges,
  evaluate,
  explainRange,
  isBookable,
  parseOffsetInstant,
  previewPolicyChanges,
  projectForAudience,
} from "@whynot/engine";
import { TemplateNarrator } from "@whynot/narrator/templates";

const { snapshot, now } = SyntheticSnapshotEnvelopeSchema.parse(
  JSON.parse(readFileSync(new URL("./snapshot.json", import.meta.url), "utf8")),
);
const requestedTime = parseOffsetInstant("2026-11-16T09:00:00+00:00");
assert(requestedTime.ok);
const request = BookingRequestSchema.parse({
  patientId: "case-example",
  serviceId: "intake",
  start: requestedTime.value,
});
const staff = StaffEvaluationSchema.parse(evaluate(snapshot, request, { now }));
assert.equal(staff.status, "blocked");
assert.equal(isBookable(snapshot, request, now), false);

const context = { requesterPatientId: request.patientId };
const patient = PatientEvaluationSchema.parse(projectForAudience(staff, "patient", context));
const display = {
  timeZone: snapshot.clinic.timezone,
  practitioners: new Map(snapshot.practitioners.map(({ id, displayName }) => [id, displayName])),
};
const wording = TemplateNarrator.renderPatient(patient, display);
log(wording.headline);
for (const group of wording.details.groups) {
  for (const sentence of group.sentences) log(sentence.text);
}
const alternative = staff.alternatives[0];
assert(alternative);
assert.equal(alternative.assignment.start, 29913690);
assert(isBookable(snapshot, alternative.request, now));
for (const label of wording.alternatives) log(`Verified opening: ${label}`);

const changes = [{ entity: "policy", field: "minNoticeMin", value: 60 }];
const preview = previewPolicyChanges(snapshot, request, changes, { now, alternatives: false });
assert(preview.ok);
assert.equal(preview.value.baseline.status, "blocked");
assert.equal(preview.value.modified.status, "bookable");
const patched = applyPolicyChanges(snapshot, changes);
assert(patched.ok);
assert(isBookable(patched.value, request, now));
assert.equal(snapshot.policy.minNoticeMin, 90);

const range = explainRange(
  snapshot,
  { patientId: request.patientId, serviceId: request.serviceId, fromDate: "2026-11-16", days: 1 },
  now,
);
assert.equal(range.status, "has_availability");
const patientRange = projectForAudience(range, "patient", context);
log(TemplateNarrator.renderPatientRange(patientRange, display).headline);
