import fc from "fast-check";
import { PolicyPreviewSchema, type PolicyPatch } from "@whynot/contracts";
import {
  applyPolicyChanges,
  evaluate,
  previewPolicyChanges,
  projectForAudience,
} from "@whynot/engine";
import { expect, it } from "vitest";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";
import { referenceRows } from "./reference/feasibility.js";

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

const numRuns = Number(process.env.FC_NUM_RUNS ?? 500);
const request = buildMinimalRequest();
const options = { now: demoNow, alternatives: false, trace: true } as const;

it(
  "P11: generated actual fixes yield an independently bookable original candidate",
  { timeout: 120000 },
  () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1200 }),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (extraNotice, returningOnly, practitionerCap, patientLimit) => {
          const snapshot = buildMinimalSnapshot();
          snapshot.policy.minNoticeMin = 120 + extraNotice;
          if (returningOnly) {
            snapshot.services[0]!.eligibility = "returning_only";
            snapshot.patients[0]!.isReturning = false;
          }
          if (practitionerCap) snapshot.policy.defaultDailyCap = 0;
          if (patientLimit) snapshot.policy.patientMaxBookingsPerDay = 0;
          const before = structuredClone(snapshot);
          freeze(snapshot);
          const result = evaluate(snapshot, request, options);
          if (result.status !== "blocked" || result.adminFix === null)
            throw new Error("Generated case should have a verified fix");
          const modified = applyPolicyChanges(snapshot, result.adminFix.changes);
          if (!modified.ok) throw new Error("Expected valid generated changes");
          expect(referenceRows(modified.value, request, demoNow)).toContainEqual({
            assignment: result.adminFix.viaCandidate,
            rules: [],
            load: 0,
          });
          expect(modified.value.policy.minNoticeMin).toBe(120);
          expect(snapshot).toEqual(before);
          expect(
            projectForAudience(result, "patient", { requesterPatientId: request.patientId }),
          ).not.toHaveProperty("adminFix");
        },
      ),
      { numRuns },
    );
  },
);

it(
  "P15: previews match direct evaluations on independently modified snapshots",
  { timeout: 120000 },
  () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 240 }),
        fc.integer({ min: 0, max: 240 }),
        fc.integer({ min: -60, max: 180 }),
        fc.boolean(),
        (beforeNotice, afterNotice, nowOffset, trace) => {
          const snapshot = buildMinimalSnapshot();
          snapshot.policy.minNoticeMin = beforeNotice;
          const changes: PolicyPatch = [
            { entity: "policy", field: "minNoticeMin", value: afterNotice },
          ];
          const expected = structuredClone(snapshot);
          expected.policy.minNoticeMin = afterNotice;
          freeze(snapshot);
          freeze(changes);
          const previewOptions = { ...options, now: demoNow + nowOffset, trace };
          const result = previewPolicyChanges(snapshot, request, changes, {
            ...previewOptions,
            includeAdminFix: true,
          });
          if (!result.ok) throw new Error("Expected valid preview");
          const directOptions = { ...previewOptions, includeAdminFix: false };
          expect(PolicyPreviewSchema.parse(result.value)).toEqual({
            changes,
            baseline: evaluate(snapshot, request, directOptions),
            modified: evaluate(expected, request, directOptions),
          });
          expect(snapshot.policy.minNoticeMin).toBe(beforeNotice);
        },
      ),
      { numRuns },
    );
  },
);
