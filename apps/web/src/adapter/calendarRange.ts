import type { ClinicSnapshot, RangeRequest } from "@whynot/contracts";
import { explainRange, formatOffsetInstant, projectForAudience } from "@whynot/engine";
import { TemplateNarrator, type TemplateDisplay } from "@whynot/narrator";

/** Project before producing calendar copy or extracting a navigable request. */
export function calendarRange(
  snapshot: ClinicSnapshot,
  request: RangeRequest,
  now: number,
  audience: "patient" | "staff",
  display: TemplateDisplay,
) {
  const evaluated = explainRange(snapshot, request, now);
  const patient =
    audience === "patient"
      ? projectForAudience(evaluated, "patient", { requesterPatientId: request.patientId })
      : null;
  const result = patient ?? evaluated;
  const narration = patient
    ? TemplateNarrator.renderPatientRange(patient, display)
    : TemplateNarrator.renderStaffRange(evaluated, display);
  const opening = result.status === "fully_blocked" ? result.nextAvailable : null;
  if (opening === null) return { narration, next: null };

  const { start } = opening.assignment;
  const preference = opening.changes.find((change) => change.field === "practitionerId");
  const instant = formatOffsetInstant(start, display.timeZone);
  if (!instant.ok || narration.nextAvailable === null)
    throw new Error("Missing display information for a verified opening");
  return {
    narration,
    next: {
      date: instant.value.slice(0, 10),
      start,
      practitionerId: preference ? preference.to : request.practitionerId,
      label: narration.nextAvailable,
      changesPractitioner: preference !== undefined,
    },
  };
}
