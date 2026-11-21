import type {
  Alternative,
  BookingRequest,
  PatientEvaluation,
  StaffEvaluation,
} from "@whynot/contracts";
import { formatOffsetInstant } from "@whynot/engine";
import { TemplateNarrator, type TemplateDisplay } from "@whynot/narrator/templates";
import { timeValue } from "./requestSelection.js";
import { staffInspector } from "./staffInspector.js";

function staffCandidates(
  result: Extract<StaffEvaluation, { status: "blocked" }>,
  sentences: ReadonlyMap<string, string>,
  display: TemplateDisplay,
) {
  return result.explanation.perCandidateSummary.map(({ practitionerId, candidate, factIds }) => ({
    practitioner: display.practitioners?.get(practitionerId),
    room: display.rooms?.get(candidate.roomId),
    equipment: candidate.equipmentId ? display.equipment?.get(candidate.equipmentId) : undefined,
    blockers: factIds.map((id) => {
      const sentence = sentences.get(id);
      if (sentence === undefined) throw new Error("Missing candidate blocker template");
      return sentence;
    }),
  }));
}

/** Render an already scoped slot evaluation for the shared playground. */
export function renderSlot(
  evaluation:
    | { audience: "patient"; result: PatientEvaluation }
    | { audience: "staff"; result: StaffEvaluation },
  request: Pick<BookingRequest, "practitionerId">,
  display: TemplateDisplay,
) {
  const { result } = evaluation;
  const narration =
    evaluation.audience === "patient"
      ? TemplateNarrator.renderPatient(evaluation.result, display)
      : TemplateNarrator.renderStaff(evaluation.result, display);

  if (result.status === "invalid_request") return { status: result.status, narration };
  const practitionerName = (id: string | null) =>
    id === null ? "Any practitioner" : (display.practitioners?.get(id) ?? "Practitioner");
  const sentences = new Map(
    narration.details.groups.flatMap(({ sentences }) =>
      sentences.flatMap(({ text, factIds }) => factIds.map((id) => [id, text] as const)),
    ),
  );
  const inspector =
    evaluation.audience === "staff" &&
    evaluation.result.status !== "invalid_request" &&
    evaluation.result.trace
      ? staffInspector(evaluation.result, sentences, display)
      : null;
  if (result.status === "bookable")
    return {
      status: result.status,
      practitioner: practitionerName(result.assignment.practitionerId),
      inspector,
    };

  const instant = (start: number) => timeValue(formatOffsetInstant(start, display.timeZone));
  const readable = (start: number) => {
    const iso = instant(start);
    return `${iso.slice(0, 10)} at ${iso.slice(11, 16)}`;
  };
  const changeText = (change: Alternative["changes"][number]) =>
    change.field === "start"
      ? {
          label: "Start",
          from: readable(change.from),
          to: readable(change.to),
        }
      : {
          label: "Practitioner",
          from: practitionerName(change.from),
          to: practitionerName(change.to),
        };
  return {
    status: result.status,
    narration,
    inspector,
    candidates: "adminFix" in result ? staffCandidates(result, sentences, display) : [],
    suggestedChanges: "adminFix" in result ? result.adminFix?.changes : undefined,
    alternatives: result.alternatives.map((alternative, index) => {
      const { assignment, changes, category, cost } = alternative;
      const preference = changes.find((change) => change.field === "practitionerId");
      return {
        title: narration.alternatives[index] ?? readable(assignment.start),
        changes: changes.map(changeText),
        category,
        cost,
        start: assignment.start,
        date: instant(assignment.start).slice(0, 10),
        practitionerId: preference ? preference.to : request.practitionerId,
      };
    }),
    search: {
      note: narration.searchNote ?? "The search completed for this window.",
      coverage:
        result.search.status === "disabled"
          ? null
          : {
              from: readable(result.search.from),
              to: readable(result.search.to),
              evaluated: result.search.evaluated,
            },
    },
  };
}

export type SlotCheck = ReturnType<typeof renderSlot>;
