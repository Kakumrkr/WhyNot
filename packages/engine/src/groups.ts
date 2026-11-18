import type { Explanation, ExplanationGroup, Fact } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { catalog } from "./catalog.js";
import type { Matrix } from "./matrix.js";

function groupFor(fact: Fact): Omit<ExplanationGroup, "factIds"> {
  if (fact.ruleId === "practitioner-skill")
    return { id: "capability-context", kind: "capability-context" };
  switch (fact.subject.type) {
    case "practitioner":
      return {
        id: `practitioner:${fact.subject.id}`,
        kind: "practitioner",
        practitionerId: fact.subject.id,
      };
    case "room":
    case "equipment":
      return { id: "resources", kind: "resources" };
    default:
      return fact.ruleId === "resource-missing"
        ? { id: "resources", kind: "resources" }
        : { id: "request", kind: "request" };
  }
}

/** Group the full canonical dictionary without altering the selected proof. */
export function groupFacts(facts: Fact[]): ExplanationGroup[] {
  const groups = new Map<string, ExplanationGroup>();
  for (const fact of facts) {
    const descriptor = groupFor(fact);
    const group = groups.get(descriptor.id);
    if (group) group.factIds.push(fact.id);
    else groups.set(descriptor.id, { ...descriptor, factIds: [fact.id] });
  }
  return [...groups.values()].sort((a, b) => compareIds(a.id, b.id));
}

/** Select each practitioner's least-weight row, keeping the first canonical row on ties. */
export function summarizePractitioners({
  facts,
  rows,
}: Matrix): Explanation["perCandidateSummary"] {
  const weights = new Map(facts.map(({ id, ruleId }) => [id, catalog[ruleId].weight]));
  const best = new Map<string, { row: Matrix["rows"][number]; weight: number }>();
  // buildMatrix enumerates rows in practitioner, room, then equipment ID order.
  for (const row of rows) {
    const { practitionerId } = row.assignment;
    const weight = row.factIds.reduce((sum, id) => sum + weights.get(id)!, 0);
    const previous = best.get(practitionerId);
    if (previous === undefined || weight < previous.weight)
      best.set(practitionerId, { row, weight });
  }
  return Array.from(best, ([practitionerId, { row }]) => ({
    practitionerId,
    candidate: row.assignment,
    factIds: row.factIds,
  }));
}
