import { randomUUID } from "node:crypto";
import { PolicyBodySchema, PolicyListResponseSchema } from "@whynot/contracts/api";
import { applyPolicyChanges, previewPolicyChanges } from "@whynot/engine";
import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { captureEvaluation } from "../db/evaluations.js";
import { policyVersion } from "../db/policyVersion.js";
import { clinics, policyVersions } from "../db/schema.js";
import { serializable } from "../db/transactions.js";
import { requireStaff } from "../demoRole.js";
import { ApiError, parseBody, results, slotRequest } from "../http.js";
import { loadSnapshot } from "../snapshotLoader/loadSnapshot.js";

/** Register immutable policy history and atomic activation of engine-validated patches. */
export function registerPolicies(app: FastifyInstance, db: Database): void {
  app.post("/admin/policies/preview", async (http) => {
    requireStaff(http);
    const body = parseBody(PolicyBodySchema, http.body);
    const request = slotRequest(body.request);
    return db.transaction(
      async (tx) => {
        const { snapshot, clock } = await loadSnapshot(tx);
        const preview = previewPolicyChanges(snapshot, request, body.changes, {
          now: clock.now,
          alternatives: false,
        });
        if (!preview.ok || preview.value.baseline.status === "invalid_request")
          throw new ApiError("invalid_request");
        return results.policy.encode({
          ...preview.value,
          activeVersionId: snapshot.policy.versionId,
        });
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  });
  app.get("/admin/policies", async (http) => {
    requireStaff(http);
    return db.transaction(
      async (tx) => {
        const [active] = await tx
          .select({ activeVersionId: clinics.activePolicyVersionId })
          .from(clinics);
        if (active === undefined) throw new Error("Demo clinic has not been seeded");
        const versions = await tx
          .select()
          .from(policyVersions)
          .orderBy(sql`${policyVersions.id} collate "C"`);
        return PolicyListResponseSchema.parse({ ...active, versions });
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  });

  app.post("/admin/policies", async (http, reply) => {
    requireStaff(http);
    const body = parseBody(PolicyBodySchema, http.body);
    const request = slotRequest(body.request);
    const activeVersionId = randomUUID();
    const saved = await serializable(db, async (tx) => {
      const { snapshot, clock } = await loadSnapshot(tx);
      const applied = applyPolicyChanges(snapshot, body.changes);
      if (!applied.ok) throw new ApiError("invalid_request");
      const input = {
        kind: "slot",
        request,
        options: {
          now: clock.now,
          alternatives: false,
          trace: false,
          includeAdminFix: false,
        },
      } as const;
      const baseline = await captureEvaluation(tx, snapshot, input);
      if (baseline.status === "invalid_request") throw new ApiError("invalid_request");
      applied.value.policy.versionId = activeVersionId;
      await tx.insert(policyVersions).values(policyVersion(applied.value));
      await tx.update(clinics).set({ activePolicyVersionId: activeVersionId });
      const updated = await loadSnapshot(tx);
      const modified = await captureEvaluation(tx, updated.snapshot, input);
      if (modified.status === "invalid_request") throw new ApiError("invalid_request");
      return { activeVersionId, changes: body.changes, baseline, modified };
    });
    if (!saved.ok) throw new ApiError("contended");
    return reply.code(201).send(results.policy.encode(saved.value));
  });
}
