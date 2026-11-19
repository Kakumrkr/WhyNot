import { expect, it } from "vitest";
import fc from "fast-check";
import { StaffEvaluationSchema } from "@whynot/contracts";
import { evaluate, catalog, isBookable } from "@whynot/engine";
import { buildMinimalSnapshot, buildMinimalRequest, demoNow } from "../../fixtures/src/index.js";
import { resourceRuleCaseArbitrary } from "../../fixtures/test/generate.js";
import { validateRequest } from "../src/validateRequest.js";
import { buildMatrix } from "../src/matrix.js";

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

it(
  "P3/P4/P8/P9/P12: evaluated outputs cover real rows, resolve references and remain deterministic",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(resourceRuleCaseArbitrary, ({ snapshot, request, now }) => {
        const before = structuredClone({ snapshot, request });
        freeze(snapshot);
        freeze(request);
        const options = { now, trace: true, alternatives: false, includeAdminFix: false } as const;
        const actual = evaluate(snapshot, request, options);
        expect(StaffEvaluationSchema.safeParse(actual).success).toBe(true);
        expect(evaluate(snapshot, request, options)).toEqual(actual);
        expect({ snapshot, request }).toEqual(before);
        const shuffled = structuredClone(snapshot);
        shuffled.practitioners.reverse();
        shuffled.rooms.reverse();
        shuffled.equipment.reverse();
        shuffled.bookings.reverse();
        shuffled.services.reverse();
        shuffled.patients.reverse();
        shuffled.clinic.openingHours.reverse();
        for (const p of shuffled.practitioners) {
          p.skills.reverse();
          p.workingHours.reverse();
          p.breaks.reverse();
          p.timeOff.reverse();
        }
        for (const r of shuffled.rooms) {
          r.capabilities.reverse();
          r.maintenance.reverse();
        }
        for (const e of shuffled.equipment) e.maintenance.reverse();
        expect(evaluate(shuffled, request, options)).toEqual(actual);
        if (actual.status === "invalid_request") return;
        expect(actual.meta.evaluatedAt).toBe(now);
        expect(actual.status === "bookable").toBe(isBookable(snapshot, request, now));
        if (actual.status !== "blocked") return;
        const { explanation: e } = actual;
        expect(e.groups.flatMap(({ factIds }) => factIds).sort()).toEqual(
          e.facts.map(({ id }) => id).sort(),
        );
        expect(actual.search.status).toBe("disabled");
        expect(actual.adminFix).toBeNull();
        for (const f of e.facts) expect(f.ruleVersion).toBe(catalog[f.ruleId].version);
        if (e.basis === "missing_resource") {
          const expected =
            snapshot.practitioners.length === 0
              ? "practitioner"
              : snapshot.rooms.length === 0
                ? "room"
                : "equipment";
          expect(e.facts).toHaveLength(1);
          expect(e.primary).toEqual([e.facts[0]!.id]);
          expect(e.facts[0]!.params).toEqual({ dimension: expected });
          if (expected === "equipment") {
            expect(snapshot.equipment).toEqual([]);
            expect(snapshot.services[0]!.requiredEquipmentType).toBeDefined();
          }
          expect(actual.trace?.candidates).toEqual([]);
          expect(e.perCandidateSummary).toEqual([]);
          expect(e.optimal).toBe(true);
        } else {
          const validated = validateRequest(snapshot, request, { now });
          if (!validated.ok) throw new Error("Unexpected invalid case");
          const matrix = buildMatrix(validated.value);
          const weights = new Map(e.facts.map(({ id, ruleId }) => [id, catalog[ruleId].weight]));
          const score = (ids: string[]) => ids.reduce((sum, id) => sum + weights.get(id)!, 0);
          expect(e.perCandidateSummary).toEqual(
            [...snapshot.practitioners]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map(({ id }) => {
                const rows = matrix.rows.filter(
                  ({ assignment }) => assignment.practitionerId === id,
                );
                const best = [...rows].sort((a, b) => score(a.factIds) - score(b.factIds))[0]!;
                return { practitionerId: id, candidate: best.assignment, factIds: best.factIds };
              }),
          );
          expect(matrix.rows.every((r) => r.factIds.some((id) => e.primary.includes(id)))).toBe(
            true,
          );
          for (const id of e.primary)
            expect(
              matrix.rows.some(
                (r) =>
                  r.factIds.filter((f) => e.primary.includes(f)).length === 1 &&
                  r.factIds.includes(id),
              ),
            ).toBe(true);
          expect(actual.trace?.candidates).toEqual(matrix.rows.slice(0, 500));
        }
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);

it("returns safe invalid errors and valid bookable/blocked results with disabled advanced features", () => {
  const snapshot = buildMinimalSnapshot(),
    request = buildMinimalRequest();
  expect(evaluate(snapshot, request, { now: demoNow }).status).toBe("bookable");
  expect(evaluate(snapshot, request, { now: demoNow })).not.toHaveProperty("trace");
  expect(
    evaluate(snapshot, { ...request, patientId: "secret-input" }, { now: demoNow }),
  ).not.toEqual(expect.objectContaining({ patientId: "secret-input" }));
  expect(JSON.stringify(evaluate(null, { secret: "do-not-echo" }, { now: demoNow }))).not.toContain(
    "do-not-echo",
  );
  expect(evaluate(snapshot, request, { now: NaN }).status).toBe("invalid_request");
  snapshot.policy.minNoticeMin = 121;
  const result = evaluate(snapshot, request, {
    now: demoNow,
    alternatives: false,
    includeAdminFix: false,
  });
  expect(result.status).toBe("blocked");
  if (result.status !== "blocked") throw new Error("Expected notice blocker");
  expect(result.alternatives).toEqual([]);
  expect(result.adminFix).toBeNull();
  expect(result.search.status).toBe("disabled");
});

it("caps trace rows at 500 without changing explanation or feasibility", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.practitioners = Array.from({ length: 23 }, (_, i) => ({
    ...snapshot.practitioners[0]!,
    id: `p-${i}`,
  }));
  snapshot.rooms = Array.from({ length: 23 }, (_, i) => ({ ...snapshot.rooms[0]!, id: `r-${i}` }));
  snapshot.policy.minNoticeMin = 121;
  const options = { now: demoNow, alternatives: false } as const;
  const plain = evaluate(snapshot, buildMinimalRequest(), options);
  const traced = evaluate(snapshot, buildMinimalRequest(), { ...options, trace: true });
  expect(traced.status).toBe("blocked");
  if (traced.status !== "blocked") throw new Error("Expected blocked");
  expect(traced.trace?.candidates).toHaveLength(500);
  expect(traced.trace?.candidatesTruncated).toBe(true);
  const { trace, ...result } = traced;
  expect(trace?.selected).toEqual(traced.explanation.primary);
  expect(result).toEqual(plain);
});

it("summarizes the lowest-weight candidate per practitioner, breaking ties by resource IDs", () => {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.requiredRoomCapability = "exam";
  snapshot.policy.minNoticeMin = 121;
  snapshot.rooms = ["later", "earlier", "blocked"].map((id) => ({
    id,
    displayName: id,
    capabilities: id === "blocked" ? [] : ["exam"],
    maintenance: [],
  }));
  const request = buildMinimalRequest();
  const result = evaluate(snapshot, request, { now: demoNow });
  if (result.status !== "blocked") throw new Error("Expected a notice blocker for all candidates");
  const { facts, groups, perCandidateSummary, primary } = result.explanation;
  const capability = facts.find(({ ruleId }) => ruleId === "room-capability")!;
  expect(groups).toEqual([
    { id: "request", kind: "request", factIds: primary },
    { id: "resources", kind: "resources", factIds: [capability.id] },
  ]);
  expect(perCandidateSummary).toEqual([
    {
      practitionerId: "practitioner-test",
      candidate: {
        practitionerId: "practitioner-test",
        roomId: "earlier",
        equipmentId: null,
        start: request.start,
        end: request.start + 15,
      },
      factIds: primary,
    },
  ]);
});
