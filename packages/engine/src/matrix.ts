import type { Assignment, Fact } from "@whynot/contracts";
import { enumerateCandidates } from "./candidates.js";
import { checkClinic, checkMissingResource } from "./rules/clinic.js";
import { checkPatient } from "./rules/patient.js";
import { checkTiming } from "./rules/timing.js";
import { checkPreference } from "./rules/preference.js";
import { checkPractitioner } from "./rules/practitioner.js";
import { checkRoom } from "./rules/room.js";
import { checkEquipment } from "./rules/equipment.js";
import { canonicalFacts } from "./rules/resourceIntervals.js";
import type { RuleContext } from "./validateRequest.js";

export type Matrix = {
  basis: "matrix" | "missing_resource";
  facts: Fact[];
  rows: { assignment: Assignment; factIds: string[] }[];
};

/** Evaluate violations in their independent dimensions, preserving structural emptiness. */
export function factorViolations(context: RuleContext) {
  const missing = checkMissingResource(context);
  if (missing.length > 0) return { basis: "missing_resource" as const, facts: missing };
  const global = [...checkClinic(context), ...checkPatient(context), ...checkTiming(context)];
  const { snapshot } = context;
  const practitioners = new Map(
    snapshot.practitioners.map((p) => [
      p.id,
      [...checkPractitioner(context, p), ...checkPreference(context, p.id)],
    ]),
  );
  const rooms = new Map(snapshot.rooms.map((r) => [r.id, checkRoom(context, r)]));
  const equipment = new Map(
    context.service.requiredEquipmentType === undefined
      ? []
      : snapshot.equipment.map((e) => [e.id, checkEquipment(context, e)]),
  );
  const facts = canonicalFacts([
    ...global,
    ...[...practitioners.values()].flat(),
    ...[...rooms.values()].flat(),
    ...[...equipment.values()].flat(),
  ]);
  return { basis: "matrix" as const, facts, global, practitioners, rooms, equipment };
}

/** Factor rule families once per resource; structural emptiness has no artificial row. */
export function buildMatrix(context: RuleContext): Matrix {
  const factors = factorViolations(context);
  if (factors.basis === "missing_resource") return { ...factors, rows: [] };
  const { facts, global, practitioners, rooms, equipment } = factors;
  const indices = new Map(facts.map((fact, index) => [fact.id, index]));
  const indexed = (entries: Fact[]) => entries.map((fact) => indices.get(fact.id)!);
  const globalIndices = indexed(global);
  const practitionerIndices = new Map(
    [...practitioners].map(([id, entries]) => [id, indexed(entries)]),
  );
  const roomIndices = new Map([...rooms].map(([id, entries]) => [id, indexed(entries)]));
  const equipmentIndices = new Map([...equipment].map(([id, entries]) => [id, indexed(entries)]));
  const rows = enumerateCandidates(context).map((assignment) => ({
    assignment,
    // Canonical numeric indices avoid re-decoding long fact IDs for every Cartesian row.
    factIds: [
      ...new Set([
        ...globalIndices,
        ...practitionerIndices.get(assignment.practitionerId)!,
        ...roomIndices.get(assignment.roomId)!,
        ...(assignment.equipmentId === null ? [] : equipmentIndices.get(assignment.equipmentId)!),
      ]),
    ]
      .sort((a, b) => a - b)
      .map((index) => facts[index]!.id),
  }));
  return { basis: "matrix", rows, facts };
}
