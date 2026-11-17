import type { ClinicSnapshot, Fact } from "@whynot/contracts";
import { buildMinimalRequest, buildMinimalSnapshot } from "../../fixtures/src/index.js";
import { context } from "./requestTestHelpers.js";
import { checkPractitioner } from "../src/rules/practitioner.js";
import { checkRoom } from "../src/rules/room.js";
import { checkEquipment } from "../src/rules/equipment.js";

export function resourceSnapshot(): ClinicSnapshot {
  const snapshot = buildMinimalSnapshot();
  snapshot.clinic.slotGridMinutes = 1;
  snapshot.equipment = [{ id: "unit", displayName: "Unit", type: "scanner", maintenance: [] }];
  snapshot.services[0]!.requiredEquipmentType = "scanner";
  return snapshot;
}

export function resourceFacts(
  snapshot: ClinicSnapshot,
  start = buildMinimalRequest().start,
): Fact[] {
  const ctx = context(snapshot, buildMinimalRequest({ start }));
  return [
    ...checkPractitioner(ctx, ctx.snapshot.practitioners[0]!),
    ...checkRoom(ctx, ctx.snapshot.rooms[0]!),
    ...checkEquipment(ctx, ctx.snapshot.equipment[0]!),
  ];
}

export function ruleIds(facts: Fact[]): string[] {
  return facts.map((fact) => fact.ruleId).sort();
}
