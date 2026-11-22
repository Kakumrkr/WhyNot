import {
  BookingRequestSchema,
  CapturedSlotOptionsSchema,
  ClinicSnapshotSchema,
  MetaSchema,
  StaffEvaluationSchema,
  schemaVersion,
} from "@whynot/contracts";
import { verifyAssignment } from "./feasibility.js";
import { applyPolicyChanges, validatePolicyChanges } from "./policy.js";
import { validateRequest } from "./validateRequest.js";
import { engineVersion } from "./version.js";

type HistoricalSlot = {
  snapshot: unknown;
  request: unknown;
  options: unknown;
  now: number;
  policyVersionId: string;
  schemaVersion: number;
  engineVersion: string;
  supportedInputVersion: boolean;
  originalStatus: unknown;
  originalMeta: unknown;
  originalErrors: unknown;
};

type Outcome = "bookable" | "blocked";
type Example = { start: number; before: Outcome; after: Outcome };

/** Compare the feasibility of each slot independently at its recorded clock. */
export function simulatePolicyChanges(records: readonly HistoricalSlot[], changes: unknown) {
  const patch = validatePolicyChanges(changes);
  if (!patch.ok) return null;

  const counts = {
    total: records.length,
    eligible: 0,
    newlyFeasible: 0,
    stillBlocked: 0,
    stillFeasible: 0,
    noLongerFeasible: 0,
    unsupported: 0,
    incomplete: 0,
    invalid: 0,
    inapplicable: 0,
  };
  const examples = new Map<string, Example>();

  for (const record of records) {
    if (record.engineVersion !== engineVersion) {
      counts.unsupported++;
      continue;
    }
    const options = CapturedSlotOptionsSchema.safeParse(record.options);
    if (
      !record.supportedInputVersion ||
      record.schemaVersion !== schemaVersion ||
      !options.success ||
      options.data.now !== record.now
    ) {
      counts.incomplete++;
      continue;
    }
    if (record.originalStatus === "invalid_request") {
      const snapshot = ClinicSnapshotSchema.safeParse(record.snapshot);
      const hasInvalidEvidence = StaffEvaluationSchema.safeParse({
        status: record.originalStatus,
        errors: record.originalErrors,
      }).success;
      if (
        snapshot.success &&
        snapshot.data.policy.versionId === record.policyVersionId &&
        BookingRequestSchema.safeParse(record.request).success &&
        hasInvalidEvidence
      ) {
        counts.invalid++;
      } else {
        counts.incomplete++;
      }
      continue;
    }

    const meta = MetaSchema.safeParse(record.originalMeta);
    if (
      !meta.success ||
      meta.data.evaluatedAt !== record.now ||
      meta.data.engineVersion !== record.engineVersion ||
      meta.data.policyVersionId !== record.policyVersionId
    ) {
      counts.incomplete++;
      continue;
    }

    const baseline = validateRequest(record.snapshot, record.request, options.data);
    if (!baseline.ok || baseline.value.snapshot.policy.versionId !== record.policyVersionId) {
      counts.incomplete++;
      continue;
    }
    // Only feasibility enters the estimate. Optional searches and traces do not change it.
    const before = verifyAssignment(baseline.value) === null ? "blocked" : "bookable";
    if (before !== record.originalStatus) {
      counts.incomplete++;
      continue;
    }

    const patched = applyPolicyChanges(baseline.value.snapshot, patch.value);
    const modified = patched.ok
      ? validateRequest(patched.value, baseline.value.request, options.data)
      : patched;
    if (!modified.ok) {
      counts.inapplicable++;
      continue;
    }

    const after = verifyAssignment(modified.value) === null ? "blocked" : "bookable";
    counts.eligible++;
    if (before === "blocked") {
      counts[after === "blocked" ? "stillBlocked" : "newlyFeasible"]++;
    } else {
      counts[after === "bookable" ? "stillFeasible" : "noLongerFeasible"]++;
    }
    const key = `${before}/${after}`;
    if (!examples.has(key))
      examples.set(key, { start: baseline.value.request.start, before, after });
  }
  return { ...counts, examples: [...examples.values()] };
}
