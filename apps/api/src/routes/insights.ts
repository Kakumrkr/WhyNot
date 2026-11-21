import { StaffEvaluationSchema, type RuleId } from "@whynot/contracts";
import {
  InsightsQuerySchema,
  InsightsResponseSchema,
  insightsEvaluationLimit,
  type InsightsResponse,
} from "@whynot/contracts/api";
import { parseOffsetInstant } from "@whynot/engine";
import { and, gte, lt, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { syntheticHistoryPrefix } from "../db/evaluations.js";
import { evaluationInputs } from "../db/schema.js";
import { requireStaff } from "../demoRole.js";
import { ApiError, parseBody } from "../http.js";

type SourceInsights = Extract<InsightsResponse, { sources: unknown }>["sources"][number];
type Evidence = Pick<typeof evaluationInputs.$inferSelect, "id" | "kind" | "result"> & {
  includeAdminFix: unknown;
};

function summarize(rows: readonly Evidence[], source: SourceInsights["source"]): SourceInsights {
  const slots = {
    total: 0,
    bookable: 0,
    blocked: 0,
    invalid: 0,
    unreadable: 0,
    blockedShare: { denominator: 0, fraction: null as number | null },
  };
  let rangeEvaluations = 0;
  const reported = new Map<RuleId, number>();
  const verifiedFixFeasibility = { denominator: 0, feasible: 0 };
  for (const row of rows) {
    if (row.kind === "range") {
      rangeEvaluations++;
      continue;
    }

    slots.total++;
    const parsed = StaffEvaluationSchema.safeParse(row.result);
    if (!parsed.success) {
      slots.unreadable++;
      continue;
    }
    const evaluation = parsed.data;
    if (evaluation.status === "invalid_request") {
      slots.invalid++;
      continue;
    }
    slots[evaluation.status]++;
    if (evaluation.status !== "blocked") continue;

    const primary = new Set(evaluation.explanation.primary);
    const rules = new Set(
      evaluation.explanation.facts
        .filter((fact) => primary.has(fact.id))
        .map((fact) => fact.ruleId),
    );
    for (const rule of rules) reported.set(rule, (reported.get(rule) ?? 0) + 1);

    // A stored witness is affirmative evidence. A null with omitted options is inconclusive.
    if (evaluation.adminFix !== null || row.includeAdminFix === true) {
      verifiedFixFeasibility.denominator++;
    }
    if (evaluation.adminFix !== null) verifiedFixFeasibility.feasible++;
  }
  const denominator = slots.bookable + slots.blocked;
  slots.blockedShare = {
    denominator,
    fraction: denominator === 0 ? null : slots.blocked / denominator,
  };
  const counts = [...reported]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([ruleId, count]) => ({ ruleId, count }));
  return {
    source,
    rangeEvaluations,
    slots,
    reportedPrimaryRules: { denominator: slots.blocked, counts },
    verifiedFixFeasibility,
  };
}

/** Register descriptive counts for one demo scope from its original stored evaluations. */
export function registerInsights(app: FastifyInstance, db: Database): void {
  app.get("/admin/insights", async (http) => {
    requireStaff(http);
    const window = parseBody(InsightsQuerySchema, http.query);
    const from = parseOffsetInstant(window.from);
    const to = parseOffsetInstant(window.to);
    if (!from.ok || !to.ok || from.value >= to.value) throw new ApiError("invalid_request");

    const { id, kind, now, result, options } = evaluationInputs;
    const rows = await db
      .select({
        id,
        kind,
        // Range internals and optional diagnostic traces do not enter the aggregation.
        result: sql`case when ${kind} = 'slot' and jsonb_typeof(${result}) = 'object' then ${result} - 'trace' end`,
        includeAdminFix: sql`${options}->'includeAdminFix'`,
      })
      .from(evaluationInputs)
      .where(and(gte(now, from.value), lt(now, to.value)))
      .limit(insightsEvaluationLimit + 1);

    if (rows.length > insightsEvaluationLimit) {
      return InsightsResponseSchema.parse({
        status: "limit_exceeded",
        window,
        maxEvaluations: insightsEvaluationLimit,
      });
    }
    const liveDemo: Evidence[] = [];
    const syntheticHistory: Evidence[] = [];
    for (const row of rows) {
      (row.id.startsWith(syntheticHistoryPrefix) ? syntheticHistory : liveDemo).push(row);
    }
    return InsightsResponseSchema.parse({
      status: rows.length === 0 ? "empty" : "ok",
      window,
      sources: [summarize(liveDemo, "live_demo"), summarize(syntheticHistory, "synthetic_history")],
    });
  });
}
