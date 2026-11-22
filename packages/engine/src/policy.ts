import {
  ClinicSnapshotSchema,
  PolicyPatchSchema,
  type ClinicSnapshot,
  type PolicyPatch,
  type ValidationIssue,
} from "@whynot/contracts";
import type { TimeResult } from "./time.js";

type AppliedPatch = { snapshot: ClinicSnapshot; changes: PolicyPatch };

function invalid(
  code: ValidationIssue["code"],
  path: ValidationIssue["path"],
  message: string,
): TimeResult<never> {
  return { ok: false, issues: [{ code, path, message }] };
}

/** Validate changes whose bounds do not depend on a particular clinic snapshot. */
export function validatePolicyChanges(changes: unknown): TimeResult<PolicyPatch> {
  const patch = PolicyPatchSchema.safeParse(changes);
  if (!patch.success)
    return invalid("invalid_request", ["changes"], "Invalid or conflicting policy changes");
  const advance = patch.data.findIndex(
    (change) =>
      change.entity === "policy" &&
      change.field === "maxAdvanceDays" &&
      !Number.isSafeInteger(change.value * 1440),
  );
  if (advance !== -1)
    return invalid(
      "invalid_request",
      ["changes", advance],
      "Advance window exceeds safe minute range",
    );
  return { ok: true, value: patch.data };
}

/** Parse and apply a complete patch to an independent snapshot. */
export function applyPatch(snapshot: unknown, changes: unknown): TimeResult<AppliedPatch> {
  const parsedSnapshot = ClinicSnapshotSchema.safeParse(snapshot);
  if (!parsedSnapshot.success)
    return invalid("invalid_snapshot", ["snapshot"], "Invalid snapshot structure or references");
  const patch = validatePolicyChanges(changes);
  if (!patch.ok) return patch;

  // Schema parsing copies all accepted snapshot fields, so partial work stays local on failure.
  const copy = parsedSnapshot.data;
  for (const [index, change] of patch.value.entries()) {
    const path = ["changes", index];
    if (change.entity === "policy") {
      copy.policy[change.field] = change.value;
    } else if (change.entity === "practitioner") {
      const practitioner = copy.practitioners.find(({ id }) => id === change.id);
      if (practitioner === undefined)
        return invalid("unknown_reference", path, "Unknown practitioner setting target");
      practitioner.dailyCap = change.value;
    } else {
      const service = copy.services.find(({ id }) => id === change.id);
      if (service === undefined)
        return invalid("unknown_reference", path, "Unknown service setting target");
      if (change.field === "eligibility") {
        if (service.eligibility !== "returning_only")
          return invalid(
            "invalid_request",
            path,
            "Only returning-patient eligibility can be relaxed",
          );
        service.eligibility = change.value;
      } else {
        if (
          copy.bookings.some(
            (booking) =>
              booking.status === "confirmed" &&
              booking.serviceId === service.id &&
              !Number.isSafeInteger(booking.end + change.value),
          )
        )
          return invalid("invalid_request", path, "Buffered occupancy exceeds safe minute range");
        service[change.field] = change.value;
      }
    }
  }
  return { ok: true, value: { snapshot: copy, changes: patch.value } };
}

/** Apply allowlisted settings to a copy, or return safe validation issues. */
export function applyPolicyChanges(
  snapshot: unknown,
  changes: unknown,
): TimeResult<ClinicSnapshot> {
  const applied = applyPatch(snapshot, changes);
  return applied.ok ? { ok: true, value: applied.value.snapshot } : applied;
}
