import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  schemaVersion,
  type BookingRequest,
  type ClinicSnapshot,
  type EvaluateOptions,
  type RangeOptions,
  type RangeExplanation,
  type RangeRequest,
  type StaffEvaluation,
} from "@whynot/contracts";
import { engineVersion, evaluate, explainRange } from "@whynot/engine";
import type { Database } from "./database.js";
import { evaluationInputs } from "./schema.js";

type Capture =
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

/** Evaluate and append the complete original input/result before returning any projection. */
export function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Extract<Capture, { kind: "slot" }>,
): Promise<StaffEvaluation>;
/** Evaluate and append the complete original input/result before returning any projection. */
export function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Extract<Capture, { kind: "range" }>,
): Promise<RangeExplanation>;
export async function captureEvaluation(
  db: Database,
  snapshot: ClinicSnapshot,
  input: Capture,
): Promise<StaffEvaluation | RangeExplanation> {
  const started = performance.now();
  const evaluated =
    input.kind === "slot"
      ? evaluate(snapshot, input.request, input.options)
      : explainRange(snapshot, input.request, input.options);
  const durationMs = performance.now() - started;
  await db.insert(evaluationInputs).values({
    id: randomUUID(),
    kind: input.kind,
    snapshot,
    request: input.request,
    now: input.options.now,
    options: input.options,
    inputVersion: 1,
    schemaVersion,
    engineVersion,
    policyVersionId: snapshot.policy.versionId,
    result: evaluated,
    durationMs,
  });
  return evaluated;
}
