import { EvaluateOptionsSchema, RangeOptionsSchema } from "@whynot/contracts";
import { ExplainBodySchema, ExplainRangeBodySchema } from "@whynot/contracts/api";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { captureEvaluation } from "../db/evaluations.js";
import { serializable } from "../db/transactions.js";
import { requireRequester } from "../demoRole.js";
import { ApiError, parseBody, slotRequest } from "../http.js";
import { loadSnapshot } from "../snapshotLoader/loadSnapshot.js";
import { sendRange, sendSlot } from "./evaluationResponse.js";

/** Register slot and range explanation routes with separate immutable capture kinds. */
export function registerExplanations(app: FastifyInstance, db: Database): void {
  app.post("/explain", async (http, reply) => {
    const body = parseBody(ExplainBodySchema, http.body);
    const request = slotRequest(body.request);
    const role = requireRequester(http, request.patientId);
    if (role.audience === "patient" && body.options?.trace === true)
      throw new ApiError("forbidden");
    const saved = await serializable(db, async (tx) => {
      const { snapshot, clock } = await loadSnapshot(tx);
      const options = EvaluateOptionsSchema.parse({ ...body.options, now: clock.now });
      return captureEvaluation(tx, snapshot, { kind: "slot", request, options });
    });
    if (!saved.ok) throw new ApiError("contended");
    return sendSlot(reply, saved.value, role);
  });

  app.post("/explain-range", async (http, reply) => {
    const { request, options: suppliedOptions } = parseBody(ExplainRangeBodySchema, http.body);
    const role = requireRequester(http, request.patientId);
    const saved = await serializable(db, async (tx) => {
      const { snapshot, clock } = await loadSnapshot(tx);
      const options = RangeOptionsSchema.parse({ ...suppliedOptions, now: clock.now });
      return captureEvaluation(tx, snapshot, { kind: "range", request, options });
    });
    if (!saved.ok) throw new ApiError("contended");
    return sendRange(reply, saved.value, role);
  });
}
