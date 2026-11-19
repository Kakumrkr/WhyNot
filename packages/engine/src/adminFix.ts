import type { AdminFix, Assignment, Booking, Fact, PolicyChange } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { catalog } from "./catalog.js";
import { buildMatrix, type Matrix } from "./matrix.js";
import { applyPolicyChanges } from "./policy.js";
import { validateRequest, type RuleContext } from "./validateRequest.js";

function changeForFact(
  fact: Fact,
  { service, interval }: RuleContext,
  bookings: ReadonlyMap<string, Booking>,
): PolicyChange | null {
  switch (fact.ruleId) {
    case "min-notice":
      return fact.params.actualMin < 0
        ? null
        : { entity: "policy", field: "minNoticeMin", value: fact.params.actualMin };
    case "max-advance":
      return {
        entity: "policy",
        field: "maxAdvanceDays",
        value: Math.ceil(fact.params.actualMin / 1440),
      };
    case "patient-daily-limit":
      return { entity: "policy", field: "patientMaxBookingsPerDay", value: fact.params.count + 1 };
    case "practitioner-daily-cap":
      return {
        entity: "practitioner",
        id: fact.subject.id,
        field: "dailyCap",
        value: fact.params.count + 1,
      };
    case "patient-eligibility-returning":
      return { entity: "service", id: service.id, field: "eligibility", value: "any" };
    case "practitioner-buffer":
    case "room-turnover": {
      const booking = bookings.get(fact.params.bookingId);
      if (booking === undefined) throw new Error("Buffer fact has no booking");
      const afterExisting = booking.end <= interval.from;
      const gap = afterExisting ? interval.from - booking.end : booking.start - interval.to;
      if (gap < 0) throw new Error("Buffer fact overlaps physical occupancy");
      return {
        entity: "service",
        id: afterExisting ? booking.serviceId : service.id,
        field: fact.ruleId === "room-turnover" ? "roomTurnoverMin" : "bufferAfterMin",
        value: gap,
      };
    }
    default:
      return null;
  }
}

function settingId(change: PolicyChange): string {
  return "id" in change ? change.id : "";
}

function compareSettings(a: PolicyChange, b: PolicyChange): number {
  return (
    compareIds(a.entity, b.entity) ||
    compareIds(settingId(a), settingId(b)) ||
    compareIds(a.field, b.field)
  );
}

function compareAssignments(a: Assignment, b: Assignment): number {
  return (
    compareIds(a.practitionerId, b.practitionerId) ||
    compareIds(a.roomId, b.roomId) ||
    compareIds(a.equipmentId ?? "", b.equipmentId ?? "")
  );
}

function compareFixes(a: AdminFix, b: AdminFix): number {
  const byCost = a.cost - b.cost || a.changes.length - b.changes.length;
  if (byCost !== 0) return byCost;
  for (const [i, before] of a.changes.entries()) {
    const after = b.changes[i]!;
    const order =
      compareSettings(before, after) ||
      (typeof before.value === "number" && typeof after.value === "number"
        ? before.value - after.value
        : 0);
    if (order !== 0) return order;
  }
  return compareAssignments(a.viaCandidate, b.viaCandidate);
}

/** Find the least-cost supported patch whose exact candidate passes every rule after application. */
export function findAdminFix(context: RuleContext, matrix: Matrix): AdminFix | null {
  if (matrix.basis !== "matrix") return null;
  const bookings = new Map(context.snapshot.bookings.map((booking) => [booking.id, booking]));
  const supported = new Map(
    matrix.facts.map((fact) => [
      fact.id,
      {
        change: fact.relaxableBy.includes("admin") ? changeForFact(fact, context, bookings) : null,
        weight: catalog[fact.ruleId].weight,
      },
    ]),
  );
  const proposals: AdminFix[] = [];
  for (const row of matrix.rows) {
    if (row.factIds.length === 0) continue;
    const settings = new Map<string, PolicyChange>();
    let cost = 0;
    for (const id of row.factIds) {
      const entry = supported.get(id);
      if (entry === undefined) throw new Error("Candidate references an unknown fact");
      const { change, weight } = entry;
      if (change === null) {
        cost = 0;
        break;
      }
      const key = JSON.stringify([change.entity, settingId(change), change.field]);
      const existing = settings.get(key);
      // Only occupancy settings can have distinct bounds within the same candidate.
      if (existing === undefined || change.value < existing.value) settings.set(key, change);
      cost += weight;
    }
    if (cost > 0)
      proposals.push({
        factIds: row.factIds,
        changes: [...settings.values()].sort(compareSettings),
        viaCandidate: row.assignment,
        cost,
      });
  }

  const verified = new Map<string, Matrix["rows"]>();
  for (const proposal of proposals.sort(compareFixes)) {
    const key = JSON.stringify(proposal.changes);
    let rows = verified.get(key);
    if (rows === undefined) {
      const modified = applyPolicyChanges(context.snapshot, proposal.changes);
      const checked = modified.ok
        ? validateRequest(modified.value, context.request, {
            ...context.options,
            alternatives: false,
            includeAdminFix: false,
          })
        : null;
      rows = checked?.ok
        ? buildMatrix(checked.value).rows.filter((row) => !row.factIds.length)
        : [];
      verified.set(key, rows);
    }
    if (rows.some(({ assignment }) => compareAssignments(assignment, proposal.viaCandidate) === 0))
      return proposal;
  }
  return null;
}
