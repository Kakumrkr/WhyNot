import type {
  ClinicSnapshot,
  PatientRangeExplanation,
  RangeExplanation,
  RangeRequest,
} from "@whynot/contracts";
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
  const result = explainRange(snapshot, request, now);
  return renderRange(
    audience === "patient"
      ? {
          audience,
          result: projectForAudience(result, audience, { requesterPatientId: request.patientId }),
        }
      : { audience, result },
    request,
    display,
  );
}

/** Render the calendar and next-opening navigation from an audience-specific result. */
export function renderRange(
  evaluation:
    | { audience: "patient"; result: PatientRangeExplanation }
    | { audience: "staff"; result: RangeExplanation },
  request: Pick<RangeRequest, "practitionerId">,
  display: TemplateDisplay,
) {
  const { result } = evaluation;
  const narration =
    evaluation.audience === "patient"
      ? TemplateNarrator.renderPatientRange(evaluation.result, display)
      : TemplateNarrator.renderStaffRange(evaluation.result, display);
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
