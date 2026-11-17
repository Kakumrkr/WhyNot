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

/** Factor rule families once per resource; structural emptiness has no artificial row. */
export function buildMatrix(context: RuleContext): Matrix {
  const missing = checkMissingResource(context);
  if (missing.length > 0) return { basis: "missing_resource", facts: missing, rows: [] };
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
  const rows = enumerateCandidates(context).map((assignment) => ({
    assignment,
    factIds: canonicalFacts([
      ...global,
      ...practitioners.get(assignment.practitionerId)!,
      ...rooms.get(assignment.roomId)!,
      ...(assignment.equipmentId === null ? [] : equipment.get(assignment.equipmentId)!),
    ]).map((f) => f.id),
  }));
  return {
    basis: "matrix",
    rows,
    facts: canonicalFacts([
      ...global,
      ...[...practitioners.values()].flat(),
      ...[...rooms.values()].flat(),
      ...[...equipment.values()].flat(),
    ]),
  };
}
