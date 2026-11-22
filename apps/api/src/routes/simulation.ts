import {
  SimulationBodySchema,
  SimulationResponseSchema,
  simulationEvaluationLimit,
} from "@whynot/contracts/api";
import { parseOffsetInstant, simulatePolicyChanges } from "@whynot/engine";
import { and, asc, eq, gt, gte, like, lt, notLike, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { evaluationInputVersion, syntheticHistoryPrefix } from "../db/evaluations.js";
import { evaluationInputs } from "../db/schema.js";
import { requireStaff } from "../demoRole.js";
import { ApiError, isoInstant, parseBody } from "../http.js";

/** Replay stored slots within one demo scope and source, without writing any changes. */
export function registerSimulation(app: FastifyInstance, db: Database): void {
  app.post("/admin/simulate", async (http) => {
    requireStaff(http);
    const body = parseBody(SimulationBodySchema, http.body);
    const window = { from: body.from, to: body.to };
    const from = parseOffsetInstant(window.from);
    const to = parseOffsetInstant(window.to);
    if (!from.ok || !to.ok || from.value >= to.value) throw new ApiError("invalid_request");

    const {
      id,
      kind,
      now,
      snapshot,
      request,
      options,
      inputVersion,
      schemaVersion,
      engineVersion,
      policyVersionId,
      result,
    } = evaluationInputs;
    const syntheticIds = `${syntheticHistoryPrefix}%`;
    const orderedId = sql`convert_to(${id}, 'UTF8')`;
    let afterCursor;
    if (body.cursor !== undefined) {
      const after = parseOffsetInstant(body.cursor.afterAt);
      if (!after.ok || after.value < from.value || after.value >= to.value)
        throw new ApiError("invalid_request");
      afterCursor = or(
        gt(now, after.value),
        and(eq(now, after.value), sql`${orderedId} > convert_to(${body.cursor.afterId}, 'UTF8')`),
      );
    }
    const rows = await db
      .select({
        id,
        snapshot,
        request,
        options,
        now,
        policyVersionId,
        schemaVersion,
        engineVersion,
        supportedInputVersion: sql<boolean>`${inputVersion} = ${evaluationInputVersion}`,
        originalStatus: sql`${result}->>'status'`,
        originalMeta: sql`${result}->'meta'`,
      })
      .from(evaluationInputs)
      .where(
        and(
          eq(kind, "slot"),
          gte(now, from.value),
          lt(now, to.value),
          afterCursor,
          body.source === "synthetic_history" ? like(id, syntheticIds) : notLike(id, syntheticIds),
        ),
      )
      .orderBy(asc(now), orderedId)
      .limit(simulationEvaluationLimit + 1);
    let nextCursor = null;
    if (rows.length > simulationEvaluationLimit) {
      rows.pop();
      const last = rows.at(-1)!;
      nextCursor = { afterAt: isoInstant(last.now), afterId: last.id };
    }

    const simulation = simulatePolicyChanges(rows, body.changes);
    if (simulation === null) throw new ApiError("invalid_request");
    return SimulationResponseSchema.parse({
      ...simulation,
      method: "independent_replay_estimate",
      window,
      source: body.source,
      nextCursor,
      examples: simulation.examples.map((example) => ({
        ...example,
        start: isoInstant(example.start),
      })),
    });
  });
}
