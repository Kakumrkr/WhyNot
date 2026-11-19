import {
  PatientEvaluationSchema,
  PatientRangeExplanationSchema,
  type Alternative,
  type Assignment,
  type Explanation,
  type Fact,
  type PatientEvaluation,
  type PatientExplanation,
  type PatientRangeExplanation,
  type PublicFact,
  type RangeExplanation,
  type StaffEvaluation,
  type ValidationIssue,
} from "@whynot/contracts";
import { compareIds } from "./candidates.js";

type ProjectionContext = { requesterPatientId: string };
type PublicFactDetails<T = PublicFact> = T extends PublicFact ? Omit<T, "id"> : never;

function projectFact(fact: Fact): PublicFactDetails {
  const practitioner =
    fact.subject.type === "practitioner" ? { practitionerId: fact.subject.id } : {};
  const base = {
    ...practitioner,
    ...(fact.window === undefined
      ? {}
      : { window: { from: fact.window.from, to: fact.window.to } }),
  };
  const { ruleId, params } = fact;
  switch (ruleId) {
    case "practitioner-break":
    case "practitioner-time-off":
      return { ...practitioner, ruleId: "practitioner-unavailable", params: {} };
    case "room-capability":
    case "equipment-type":
      return { ruleId: "resource-unavailable", params: {} };
    case "clinic-closed-day":
    case "clinic-hours":
    case "practitioner-hours":
      return { ...base, ruleId, params: { date: params.date } };
    case "min-notice":
      return {
        ...base,
        ruleId,
        params: { requiredMin: params.requiredMin, actualMin: params.actualMin },
      };
    case "max-advance":
      return {
        ...base,
        ruleId,
        params: { maxAdvanceDays: params.maxAdvanceDays, actualMin: params.actualMin },
      };
    case "patient-daily-limit":
    case "practitioner-daily-cap":
      return {
        ...base,
        ruleId,
        params: { date: params.date, count: params.count, limit: params.limit },
      };
    case "request-practitioner":
      return { ...base, ruleId, params: { practitionerId: params.practitionerId } };
    case "practitioner-skill":
      return { ...base, ruleId, params: { requiredSkill: params.requiredSkill } };
    case "practitioner-buffer":
      return { ...base, ruleId, params: { bufferMin: params.bufferMin } };
    case "room-turnover":
      return { ...base, ruleId, params: { turnoverMin: params.turnoverMin } };
    case "resource-missing":
      return { ruleId, params: { dimension: params.dimension } };
    case "patient-eligibility-returning":
    case "patient-eligibility-referral":
    case "practitioner-busy":
    case "room-maintenance":
    case "room-busy":
    case "equipment-maintenance":
    case "equipment-busy":
      return { ...base, ruleId, params: {} };
  }
}

function projectFacts(source: Fact[]) {
  const keysBySourceId = new Map<string, string>();
  const publicFactsByKey = new Map<string, PublicFactDetails>();
  for (const fact of source) {
    const projected = projectFact(fact);
    const key = JSON.stringify(projected);
    keysBySourceId.set(fact.id, key);
    publicFactsByKey.set(key, projected);
  }
  // Equal public facts can cover different source candidates. Remap each source ID
  // to the shared abstraction so every primary and group reference retains coverage.
  const ordinalsByKey = new Map<string, number>();
  const facts = [...publicFactsByKey.entries()]
    .sort(([left], [right]) => compareIds(left, right))
    .map(([key, fact], index) => {
      const ordinal = index + 1;
      ordinalsByKey.set(key, ordinal);
      return { id: `fact-${ordinal}`, ...fact };
    });
  function remap(ids: string[]): string[] {
    const ordinals = ids.map((id) => {
      const key = keysBySourceId.get(id);
      const ordinal = key === undefined ? undefined : ordinalsByKey.get(key);
      if (ordinal === undefined) throw new Error("Cannot project an unknown fact reference");
      return ordinal;
    });
    return [...new Set(ordinals)].sort((a, b) => a - b).map((ordinal) => `fact-${ordinal}`);
  }
  return { facts, remap };
}

function projectExplanation(explanation: Explanation): PatientExplanation {
  const { facts, remap } = projectFacts(explanation.facts);
  const groups = explanation.groups.map(({ kind, practitionerId, factIds }) => ({
    kind,
    ...(practitionerId === undefined ? {} : { practitionerId }),
    factIds: remap(factIds),
  }));
  return {
    basis: explanation.basis,
    primary: remap(explanation.primary),
    groups: groups
      .map((group) => ({ key: JSON.stringify(group), group }))
      .sort((a, b) => compareIds(a.key, b.key))
      .map(({ group }, index) => ({ id: `group-${index + 1}`, ...group })),
    facts,
  };
}

function projectError({ code, path }: ValidationIssue) {
  const [root, field] = path;
  if (code === "invalid_snapshot") return { code, field: "snapshot" as const };
  const requestField =
    path.length === 1 ? root : path.length === 2 && root === "request" ? field : undefined;
  switch (requestField) {
    case "patientId":
    case "serviceId":
    case "practitionerId":
    case "start":
    case "fromDate":
    case "days":
      return { code, field: requestField };
    default:
      return { code, field: "request" as const };
  }
}

function projectAssignment({
  practitionerId,
  start,
  end,
}: Pick<Assignment, "practitionerId" | "start" | "end">) {
  return { practitionerId, start, end };
}

function projectAlternative({ assignment, category, cost, changes }: Alternative) {
  return {
    assignment: projectAssignment(assignment),
    category,
    cost,
    changes: changes.map((change) =>
      change.field === "start"
        ? { field: change.field, from: change.from, to: change.to }
        : { field: change.field, from: change.from, to: change.to },
    ),
  };
}

type StaffBlockedRange = Extract<RangeExplanation, { status: "fully_blocked" }>;
type PublicBlockedRange = Extract<PatientRangeExplanation, { status: "fully_blocked" }>;

function isStaffRange(output: StaffBlockedRange | PublicBlockedRange): output is StaffBlockedRange {
  const first = output.facts[0];
  return (
    (first !== undefined && "subject" in first) ||
    (output.nextAvailable !== null && "request" in output.nextAvailable)
  );
}

function projectBlockedRange(output: StaffBlockedRange) {
  const { facts, remap } = projectFacts(output.facts);
  return PatientRangeExplanationSchema.parse({
    status: output.status,
    bookableCount: output.bookableCount,
    facts,
    commonCause: remap(output.commonCause),
    context: remap(output.context),
    segments: output.segments.map((segment) => ({ ...segment, factIds: remap(segment.factIds) })),
    nextAvailable: output.nextAvailable === null ? null : projectAlternative(output.nextAvailable),
    nextSearch: output.nextSearch,
    meta: output.meta,
  });
}

/** Preserve the range evidence for staff. */
export function projectForAudience(
  output: RangeExplanation,
  audience: "staff",
  context: ProjectionContext,
): RangeExplanation;
/** Remap range evidence and remove private assignment and fact details for patients. */
export function projectForAudience(
  output: RangeExplanation | PatientRangeExplanation,
  audience: "patient",
  context: ProjectionContext,
): PatientRangeExplanation;
export function projectForAudience(
  output: RangeExplanation,
  audience: "staff" | "patient",
  context: ProjectionContext,
): RangeExplanation | PatientRangeExplanation;
/** Preserve engine evidence while limiting patient output to the public slot contract. */
export function projectForAudience(
  output: StaffEvaluation,
  audience: "staff",
  context: ProjectionContext,
): StaffEvaluation;
/** Project a slot evaluation for patient display or serialization. The slot
 * contract omits all patient identities, including the requester's.
 */
export function projectForAudience(
  output: StaffEvaluation | PatientEvaluation,
  audience: "patient",
  context: ProjectionContext,
): PatientEvaluation;
/** Project a staff slot evaluation for the selected audience. */
export function projectForAudience(
  output: StaffEvaluation,
  audience: "staff" | "patient",
  context: ProjectionContext,
): StaffEvaluation | PatientEvaluation;
export function projectForAudience(
  output: StaffEvaluation | PatientEvaluation | RangeExplanation | PatientRangeExplanation,
  audience: "staff" | "patient",
): StaffEvaluation | PatientEvaluation | RangeExplanation | PatientRangeExplanation {
  if (audience === "staff") return output;
  if (output.status === "invalid_request") {
    return {
      status: output.status,
      errors: output.errors.map((error) =>
        "path" in error ? projectError(error) : { code: error.code, field: error.field },
      ),
    };
  }
  if (output.status === "has_availability") return PatientRangeExplanationSchema.parse(output);
  if (output.status === "fully_blocked") {
    return isStaffRange(output)
      ? projectBlockedRange(output)
      : PatientRangeExplanationSchema.parse(output);
  }
  const { schemaVersion, engineVersion, policyVersionId, evaluatedAt } = output.meta;
  const meta = { schemaVersion, engineVersion, policyVersionId, evaluatedAt };
  if (output.status === "bookable") {
    return { status: output.status, assignment: projectAssignment(output.assignment), meta };
  }
  if (!("adminFix" in output)) return PatientEvaluationSchema.parse(output);
  const { status, from, to, evaluated } = output.search;
  const search =
    status === "disabled"
      ? { status, from: null, to: null, evaluated: 0 as const }
      : { status, from, to, evaluated };
  return {
    status: output.status,
    explanation: projectExplanation(output.explanation),
    alternatives: output.alternatives.map(projectAlternative),
    search,
    meta,
  };
}
