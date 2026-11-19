import {
  PatientEvaluationSchema,
  type PatientAlternative,
  type PatientEvaluation,
  type PatientExplanation,
  type SearchReport,
  type StaffEvaluation,
} from "@whynot/contracts";
import { patientFact, staffFact } from "./facts.js";
import { createFormat, type Format, type TemplateDisplay } from "./format.js";
import { policySetting } from "./policy.js";
import { renderPatientRange, renderStaffRange } from "./range.js";

export type { TemplateDisplay } from "./format.js";
export type { RangeNarration } from "./range.js";

export type CitedSentence = { text: string; factIds: string[] };

export type TemplateNarration = {
  source: "template";
  status: PatientEvaluation["status"];
  headline: string;
  primary: { label: string; sentences: CitedSentence[] };
  details: { label: string; groups: { id: string; label: string; sentences: CitedSentence[] }[] };
  guidance: CitedSentence[];
  alternatives: string[];
  searchNote: string | null;
  policyFix?: { summary: CitedSentence; settings: string[] };
};

const groupLabels = {
  request: "Appointment request",
  practitioner: "Practitioner availability",
  "capability-context": "Practitioner qualifications",
  resources: "Clinic resources",
} satisfies Record<PatientExplanation["groups"][number]["kind"], string>;

function empty(status: TemplateNarration["status"], headline: string): TemplateNarration {
  return {
    source: "template",
    status,
    headline,
    primary: { label: "Why this time is unavailable", sentences: [] },
    details: { label: "All scheduling conflicts considered", groups: [] },
    guidance: [],
    alternatives: [],
    searchNote: null,
  };
}

function searchNote(search: SearchReport, alternatives: number, format: Format): string | null {
  switch (search.status) {
    case "disabled":
      return "The clinic did not search for alternatives.";
    case "complete":
      return alternatives > 0
        ? null
        : `No alternatives were found from ${format.instant(search.from)} to ${format.instant(search.to)}.`;
    case "budget_exhausted":
      return "The search reached its limit. Other openings may still be available.";
    case "window_limited":
      return "The search covered the available part of the schedule. More schedule data is needed to check the rest of the requested window.";
  }
}

const patientGuidance = {
  "patient-eligibility-returning":
    "Changing the time will not make you eligible for this appointment. Ask the clinic whether an initial appointment or assessment would be appropriate.",
  "patient-eligibility-referral":
    "Changing the time will not resolve the referral requirement. Ask the clinic how to get a referral for this service.",
};

const staffGuidance = {
  "patient-eligibility-returning":
    "Changing the time will not change eligibility. If appropriate, review whether the service should allow new patients.",
  "patient-eligibility-referral":
    "Changing the time will not resolve the referral requirement. Confirm whether a referral can be obtained or is already on file.",
};

const capabilityRules = new Set([
  "practitioner-skill",
  "room-capability",
  "equipment-type",
  "resource-unavailable",
  "resource-missing",
]);

function blocked<F extends { id: string; ruleId: string }>(
  {
    explanation,
    alternatives,
    search,
  }: {
    explanation: Pick<PatientExplanation, "primary" | "groups"> & { facts: F[] };
    alternatives: Pick<PatientAlternative, "assignment" | "changes">[];
    search: SearchReport;
  },
  format: Format,
  renderFact: (fact: F, format: Format) => string,
  guidance: typeof patientGuidance,
): TemplateNarration {
  const narration = empty("blocked", "This appointment is unavailable at the requested time.");
  const sentences = new Map(explanation.facts.map((fact) => [fact.id, renderFact(fact, format)]));
  function cite(id: string): CitedSentence {
    const text = sentences.get(id);
    if (text === undefined) throw new Error("Cannot render an unknown fact reference");
    return { text, factIds: [id] };
  }
  narration.primary.sentences = explanation.primary.map(cite);
  const rules = new Map(explanation.facts.map(({ id, ruleId }) => [id, ruleId]));
  // A proof made entirely of capability facts has no time-dependent cause to word around.
  if (explanation.primary.every((id) => capabilityRules.has(rules.get(id) ?? ""))) {
    narration.headline =
      "This service is unavailable here with the current practitioners and resources.";
  }
  narration.details.groups = explanation.groups.map(({ id, kind, practitionerId, factIds }) => ({
    id,
    label: kind === "practitioner" ? format.practitioner(practitionerId) : groupLabels[kind],
    sentences: factIds.map(cite),
  }));
  for (const { id, ruleId } of explanation.facts) {
    if (ruleId === "patient-eligibility-returning" || ruleId === "patient-eligibility-referral")
      narration.guidance.push({ text: guidance[ruleId], factIds: [id] });
  }
  narration.alternatives = alternatives.map(({ assignment, changes }) => {
    const opening = `${format.instant(assignment.start)} with ${format.practitioner(assignment.practitionerId)}`;
    const preference = changes.find((change) => change.field === "practitionerId");
    return preference?.from == null
      ? opening
      : `${opening} instead of ${format.practitioner(preference.from)}`;
  });
  narration.searchNote = searchNote(search, alternatives.length, format);
  return narration;
}

/** Deterministic wording over evaluated slots and caller-supplied display labels. */
export const TemplateNarrator = {
  renderPatientRange,
  renderStaffRange,
  /** Render a patient result after projection. The strict contract is checked at this boundary. */
  renderPatient(evaluation: PatientEvaluation, display: TemplateDisplay): TemplateNarration {
    const result = PatientEvaluationSchema.parse(evaluation);
    switch (result.status) {
      case "invalid_request":
        return empty(result.status, "The clinic could not check this appointment request.");
      case "bookable":
        return empty(result.status, "This appointment can be booked.");
      case "blocked":
        return blocked(result, createFormat(display), patientFact, patientGuidance);
    }
  },

  /** Render the staff result with its full grounded evidence. */
  renderStaff(evaluation: StaffEvaluation, display: TemplateDisplay): TemplateNarration {
    switch (evaluation.status) {
      case "invalid_request":
        return empty(evaluation.status, "The appointment request or clinic data is invalid.");
      case "bookable":
        return empty(evaluation.status, "This appointment can be booked.");
      case "blocked": {
        const format = createFormat(display);
        const narration = blocked(evaluation, format, staffFact, staffGuidance);
        if (evaluation.adminFix !== null) {
          narration.policyFix = {
            summary: {
              text: "These hypothetical settings would make the original request bookable. Review them before changing clinic policy.",
              factIds: evaluation.adminFix.factIds,
            },
            settings: evaluation.adminFix.changes.map((change) => policySetting(change, format)),
          };
        }
        return narration;
      }
    }
  },
};
