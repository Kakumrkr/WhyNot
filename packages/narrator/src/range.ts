import {
  PatientRangeExplanationSchema,
  type Fact,
  type PatientRangeExplanation,
  type PublicFact,
  type RangeExplanation,
} from "@whynot/contracts";
import { patientFact, staffFact } from "./facts.js";
import { createFormat, duration, type Format, type TemplateDisplay } from "./format.js";
import type { CitedSentence } from "./index.js";

export type RangeNarration = {
  source: "template";
  status: RangeExplanation["status"];
  headline: string;
  commonCause: CitedSentence[];
  context: CitedSentence[];
  segments: { label: string; sentences: CitedSentence[] }[];
  guidance: CitedSentence[];
  nextAvailable: string | null;
  searchNote: string | null;
};

type RangeWithFacts<F> = Omit<
  Extract<PatientRangeExplanation, { status: "fully_blocked" }>,
  "facts"
> & { facts: F[] };
type RangeResult<F> =
  | { status: "invalid_request" }
  | Extract<PatientRangeExplanation, { status: "has_availability" }>
  | RangeWithFacts<F>;

function narration<F extends Fact | PublicFact>(
  result: RangeResult<F>,
  format: Format,
  render: (fact: F, format: Format) => string,
  staff: boolean,
): RangeNarration {
  const output: RangeNarration = {
    source: "template",
    status: result.status,
    headline: "The clinic could not check these dates.",
    commonCause: [],
    context: [],
    segments: [],
    guidance: [],
    nextAvailable: null,
    searchNote: null,
  };
  if (result.status === "invalid_request") return output;
  if (result.status === "has_availability") {
    const count = result.bookableCount;
    output.headline = `${count} appointment start ${count === 1 ? "is" : "times are"} available.`;
    return output;
  }
  const facts = new Map(result.facts.map((fact) => [fact.id, fact]));
  function sentences(ids: string[]): CitedSentence[] {
    const byText = new Map<string, string[]>();
    for (const id of ids) {
      const fact = facts.get(id);
      if (fact === undefined) throw new Error("Cannot render an unknown range fact reference");
      const practitionerId =
        "subject" in fact
          ? fact.subject.type === "practitioner"
            ? fact.subject.id
            : undefined
          : fact.practitionerId;
      const practitioner = format.practitioner(practitionerId);
      const text = rangeFact(fact, practitioner, format) ?? render(fact, format);
      const references = byText.get(text) ?? [];
      references.push(id);
      byText.set(text, references);
    }
    return [...byText].map(([text, factIds]) => ({ text, factIds }));
  }
  output.commonCause = sentences(result.commonCause);
  output.headline =
    output.commonCause[0]?.text ?? "No appointment starts are available on these dates.";
  output.context = sentences(result.context);
  if (result.commonCause.length === 0)
    output.segments = result.segments.map((segment) => ({
      label: segment.closedDay
        ? format.date(segment.date)
        : `Starts from ${format.instant(segment.from)} to before ${format.until(segment)}`,
      sentences: sentences(segment.factIds),
    }));
  const referral = result.commonCause.filter(
    (id) => facts.get(id)?.ruleId === "patient-eligibility-referral",
  );
  if (referral.length > 0)
    output.guidance = [
      {
        text: staff
          ? "Confirm whether the patient can obtain a referral."
          : "Ask your GP for a referral.",
        factIds: referral,
      },
    ];
  if (result.nextAvailable !== null) {
    const { assignment, changes } = result.nextAvailable;
    const preference = changes.find((change) => change.field === "practitionerId");
    const opening = `${format.instant(assignment.start)} with ${format.practitioner(assignment.practitionerId)}`;
    output.nextAvailable =
      preference?.from == null
        ? opening
        : `${opening} instead of ${format.practitioner(preference.from)}`;
  }
  switch (result.nextSearch.status) {
    case "complete":
      if (result.nextAvailable === null && referral.length === 0)
        output.searchNote = `No opening was found from ${format.instant(result.nextSearch.from)} up to ${format.instant(result.nextSearch.to)}.`;
      break;
    case "budget_exhausted":
      output.searchNote = "The search reached its limit. Other openings may still be available.";
      break;
    case "window_limited":
      output.searchNote = "More schedule data is needed to finish checking for the next opening.";
      break;
    case "disabled":
      break;
  }
  return output;
}

function rangeFact(fact: Fact | PublicFact, name: string, format: Format): string | undefined {
  switch (fact.ruleId) {
    case "clinic-closed-day":
      return `The clinic is closed on ${format.date(fact.params.date)}.`;
    case "min-notice":
      return `The clinic needs at least ${duration(fact.params.requiredMin)} of notice.`;
    case "max-advance": {
      const { maxAdvanceDays } = fact.params;
      return `The clinic accepts appointments up to ${maxAdvanceDays} ${maxAdvanceDays === 1 ? "day" : "days"} ahead.`;
    }
    case "practitioner-hours":
      return `These starts fall outside ${name}'s working hours on ${format.date(fact.params.date)}.`;
    case "practitioner-busy":
      return `${name} is already booked at these starts.`;
    case "practitioner-unavailable":
      return `${name} is unavailable for these starts.`;
    case "practitioner-time-off":
      return `${name} is on leave${fact.params.reason ? ` (${fact.params.reason})` : ""}.`;
    default:
      return undefined;
  }
}

/** Render checked public range evidence for patients. */
export function renderPatientRange(
  result: PatientRangeExplanation,
  display: TemplateDisplay,
): RangeNarration {
  return narration(
    PatientRangeExplanationSchema.parse(result),
    createFormat(display),
    patientFact,
    false,
  );
}

/** Render full range evidence for staff. */
export function renderStaffRange(
  result: RangeExplanation,
  display: TemplateDisplay,
): RangeNarration {
  return narration(result, createFormat(display), staffFact, true);
}
