import { isDeepStrictEqual } from "node:util";
import {
  BookingRequestSchema,
  ClinicSnapshotSchema,
  EvaluateOptionsSchema,
  RangeExplanationSchema,
  RangeOptionsSchema,
  RangeRequestSchema,
  StaffEvaluationSchema,
  schemaVersion,
} from "@whynot/contracts";
import { engineVersion, evaluate, explainRange } from "@whynot/engine";
import { eq } from "drizzle-orm";
import type { Database } from "./database.js";
import { evaluationInputVersion, syntheticHistoryPrefix } from "./evaluations.js";
import { evaluationInputs } from "./schema.js";

// Capture stores resolved defaults. A replay must never fill in options a legacy row omitted.
const capturedSlotOptions = EvaluateOptionsSchema.extend({
  alternatives: EvaluateOptionsSchema.shape.alternatives.removeDefault(),
  includeAdminFix: EvaluateOptionsSchema.shape.includeAdminFix.removeDefault(),
  trace: EvaluateOptionsSchema.shape.trace.removeDefault(),
});
const capturedRangeOptions = RangeOptionsSchema.extend({
  searchDays: RangeOptionsSchema.shape.searchDays.removeDefault(),
  budgetEvals: RangeOptionsSchema.shape.budgetEvals.removeDefault(),
});

const incomplete = { status: "incomplete_evidence" } as const;

/** Recompute a stored evaluation within its database scope and verify the original evidence. */
export async function replayEvaluation(db: Database, id: string) {
  const [row] = await db.select().from(evaluationInputs).where(eq(evaluationInputs.id, id));
  if (row === undefined) return { status: "not_found" } as const;
  if (row.engineVersion !== engineVersion) return { status: "unsupported_version" } as const;
  if (row.inputVersion !== evaluationInputVersion || row.schemaVersion !== schemaVersion)
    return incomplete;

  const snapshot = ClinicSnapshotSchema.safeParse(row.snapshot);
  if (!snapshot.success || snapshot.data.policy.versionId !== row.policyVersionId)
    return incomplete;

  const replay = {
    id: row.id,
    source: row.id.startsWith(syntheticHistoryPrefix)
      ? ("synthetic_history" as const)
      : ("live_demo" as const),
    evaluatedAt: row.now,
    engineVersion: row.engineVersion,
  };

  if (row.kind === "slot") {
    const request = BookingRequestSchema.safeParse(row.request);
    const options = capturedSlotOptions.safeParse(row.options);
    const original = StaffEvaluationSchema.safeParse(row.result);
    if (!request.success || !options.success || !original.success || options.data.now !== row.now)
      return incomplete;

    const evaluation = evaluate(snapshot.data, request.data, { ...options.data, trace: true });
    let comparable = evaluation;
    if (!options.data.trace && evaluation.status !== "invalid_request") {
      // Adding diagnostic output must preserve all evidence present in the original result.
      comparable = { ...evaluation };
      delete comparable.trace;
    }
    if (!isDeepStrictEqual(comparable, original.data)) return incomplete;
    return { status: "replayed", replay: { ...replay, kind: row.kind, evaluation } } as const;
  }

  const request = RangeRequestSchema.safeParse(row.request);
  const options = capturedRangeOptions.safeParse(row.options);
  const original = RangeExplanationSchema.safeParse(row.result);
  if (!request.success || !options.success || !original.success || options.data.now !== row.now)
    return incomplete;
  const evaluation = explainRange(snapshot.data, request.data, options.data);
  if (!isDeepStrictEqual(evaluation, original.data)) return incomplete;
  return { status: "replayed", replay: { ...replay, kind: row.kind, evaluation } } as const;
}
