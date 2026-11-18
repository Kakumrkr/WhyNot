import type { Explanation, StaffEvaluation, Trace } from "@whynot/contracts";
import { validateRequest } from "./validateRequest.js";
import { buildMatrix } from "./matrix.js";
import { chooseAssignment } from "./feasibility.js";
import { explain } from "./explain.js";
import { groupFacts, summarizePractitioners } from "./groups.js";
import { searchAlternatives } from "./alternatives.js";

/** Evaluate untrusted inputs with an injected clock and optional alternative search. */
export function evaluate(snapshot: unknown, request: unknown, options: unknown): StaffEvaluation {
  const validated = validateRequest(snapshot, request, options);
  if (!validated.ok) return { status: "invalid_request", errors: validated.issues };
  const context = validated.value;
  const matrix = buildMatrix(context);
  const assignment = chooseAssignment(context, matrix);
  const meta = {
    schemaVersion: 1 as const,
    engineVersion: "0.0.0",
    policyVersionId: context.snapshot.policy.versionId,
    evaluatedAt: context.options.now,
  };
  const selection =
    assignment !== null || matrix.basis === "missing_resource"
      ? {
          primary: matrix.basis === "missing_resource" ? matrix.facts.map((fact) => fact.id) : [],
          optimal: true,
          reducedRows: [],
          searchNodes: 0,
        }
      : explain(
          matrix.rows.map((row) => row.factIds),
          matrix.facts,
        );
  if (matrix.basis === "missing_resource") {
    const dimension =
      matrix.facts[0]?.ruleId === "resource-missing" ? matrix.facts[0].params.dimension : null;
    const actual =
      context.snapshot.practitioners.length === 0
        ? "practitioner"
        : context.snapshot.rooms.length === 0
          ? "room"
          : context.service.requiredEquipmentType !== undefined &&
              context.snapshot.equipment.length === 0
            ? "equipment"
            : null;
    if (
      dimension === null ||
      dimension !== actual ||
      matrix.facts.length !== 1 ||
      matrix.rows.length !== 0
    )
      throw new Error("Structural explanation has no actual missing-resource witness");
  }
  const search = assignment === null ? searchAlternatives(context) : null;
  if (search?.unrepresentableCost)
    return {
      status: "invalid_request",
      errors: [
        {
          code: "invalid_request",
          path: ["options", "costWeights"],
          message: "An alternative cost exceeds the finite numeric range",
        },
      ],
    };
  const trace: Trace = {
    facts: matrix.facts,
    candidates: matrix.rows.slice(0, 500),
    reducedRows: selection.reducedRows,
    selected: selection.primary,
    searchNodes: selection.searchNodes,
    alternatives: search?.attempts ?? [],
    candidatesTruncated: matrix.rows.length > 500,
    alternativesTruncated: (search?.search.evaluated ?? 0) > 3000,
  };
  const traced = context.options.trace ? { trace } : {};
  if (assignment !== null) return { status: "bookable", assignment, meta, ...traced };
  if (search === null) throw new Error("Blocked evaluation missing alternative search report");
  const explanation: Explanation = {
    basis: matrix.basis,
    primary: selection.primary,
    facts: matrix.facts,
    optimal: selection.optimal,
    groups: groupFacts(matrix.facts),
    perCandidateSummary: summarizePractitioners(matrix),
  };
  return {
    status: "blocked",
    explanation,
    alternatives: search.alternatives,
    search: search.search,
    adminFix: null,
    meta,
    ...traced,
  };
}
