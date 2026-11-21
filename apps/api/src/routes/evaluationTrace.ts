import { EvaluationTraceParamsSchema } from "@whynot/contracts/api";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { replayEvaluation } from "../db/replayEvaluation.js";
import { requireStaff } from "../demoRole.js";
import { ApiError, isoInstant, parseBody, results } from "../http.js";

/** Register staff access to one immutable evaluation in the selected demo scope. */
export function registerEvaluationTrace(app: FastifyInstance, db: Database): void {
  app.get("/admin/evaluations/:id/trace", async (http) => {
    requireStaff(http);
    const { id } = parseBody(EvaluationTraceParamsSchema, http.params);
    const outcome = await replayEvaluation(db, id);
    if (outcome.status !== "replayed") throw new ApiError(outcome.status);
    const { replay } = outcome;
    return results.evaluationTrace.encode({
      ...replay,
      evaluatedAt: isoInstant(replay.evaluatedAt),
    });
  });
}
