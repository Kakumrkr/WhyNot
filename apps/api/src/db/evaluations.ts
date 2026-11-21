import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  schemaVersion,
  type BookingRequest,
  type ClinicSnapshot,
  type EvaluateOptions,
  type RangeExplanation,
  type RangeOptions,
  type RangeRequest,
  type StaffEvaluation,
} from "@whynot/contracts";
import { engineVersion, evaluate, explainRange } from "@whynot/engine";
import type { Database } from "./database.js";
import { evaluationInputs } from "./schema.js";

export const evaluationInputVersion = 1;
export const syntheticHistoryPrefix = "synthetic-history-";

export type Capture =
  | {
      kind: "slot";
      request: BookingRequest;
      options: EvaluateOptions;
    }
  | {
      kind: "range";
      request: RangeRequest;
      options: Required<RangeOptions>;
    };

/** Give a slot capture its persisted lookup ID before any response is projected. */
export function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Extract<Capture, { kind: "slot" }>,
): Promise<{ id: string; result: StaffEvaluation }>;
/** Give a range capture its persisted lookup ID before any response is projected. */
export function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Extract<Capture, { kind: "range" }>,
): Promise<{ id: string; result: RangeExplanation }>;
export async function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Capture,
): Promise<{ id: string; result: StaffEvaluation | RangeExplanation }> {
  const id = randomUUID();
  const started = performance.now();
  const record = evaluationRecord(id, snapshot, input);
  const durationMs = performance.now() - started;
  await db.insert(evaluationInputs).values({ ...record, durationMs });
  return { id, result: record.result };
}

/** Materialize an independent evaluation with its original input and version metadata. */
export function evaluationRecord(id: string, snapshot: ClinicSnapshot, input: Capture) {
  const result =
    input.kind === "slot"
      ? evaluate(snapshot, input.request, input.options)
      : explainRange(snapshot, input.request, input.options);
  return {
    id,
    kind: input.kind,
    snapshot,
    request: input.request,
    now: input.options.now,
    options: input.options,
    inputVersion: evaluationInputVersion,
    schemaVersion,
    engineVersion,
    policyVersionId: snapshot.policy.versionId,
    result,
  };
}
