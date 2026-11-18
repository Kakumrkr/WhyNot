import fc from "fast-check";
import { expect, it } from "vitest";
import { PatientEvaluationSchema, type Fact, type PublicFact } from "@whynot/contracts";
import { evaluate, projectForAudience } from "@whynot/engine";
import { projectionCaseArbitrary } from "../../fixtures/test/generate.js";

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

function publicRule(fact: Fact): PublicFact["ruleId"] {
  switch (fact.ruleId) {
    case "practitioner-break":
    case "practitioner-time-off":
      return "practitioner-unavailable";
    case "room-capability":
    case "equipment-type":
      return "resource-unavailable";
    default:
      return fact.ruleId;
  }
}

it(
  "P10: generated patient output preserves public coverage and references without leaking private values",
  { timeout: 60000 },
  () => {
    fc.assert(
      fc.property(projectionCaseArbitrary, ({ snapshot, request, now, secrets }) => {
        const result = evaluate(snapshot, request, { now, trace: true, alternatives: false });
        freeze(result);
        const context = { requesterPatientId: request.patientId };
        const projected = projectForAudience(result, "patient", context);
        expect(PatientEvaluationSchema.parse(projected)).toEqual(projected);
        expect(projectForAudience(projected, "patient", context)).toEqual(projected);
        const serialized = JSON.stringify(projected);
        for (const secret of secrets) expect(serialized).not.toContain(secret);
        for (const key of [
          "bookingId",
          "reason",
          "timeOffId",
          "windowId",
          "roomId",
          "equipmentId",
          "trace",
          "adminFix",
          "perCandidateSummary",
          "optimal",
          "subject",
          "requiredCapability",
          "requiredType",
        ]) {
          expect(serialized).not.toContain(JSON.stringify(key));
        }

        if (result.status !== "blocked" || projected.status !== "blocked") {
          expect(projected.status).toBe(result.status);
          return;
        }
        const sourceById = new Map(result.explanation.facts.map((fact) => [fact.id, fact]));
        const publicById = new Map(projected.explanation.facts.map((fact) => [fact.id, fact]));
        const key = (ruleId: string, practitionerId?: string) =>
          JSON.stringify([ruleId, practitionerId]);
        const expectedKey = (id: string) => {
          const source = sourceById.get(id)!;
          return key(
            publicRule(source),
            source.subject.type === "practitioner" ? source.subject.id : undefined,
          );
        };
        const actualKey = (id: string) => {
          const fact = publicById.get(id)!;
          return key(fact.ruleId, fact.practitionerId);
        };
        expect(projected.explanation.facts.map((fact) => fact.id)).toEqual(
          Array.from(publicById, (_, index) => `fact-${index + 1}`),
        );
        expect(new Set(projected.explanation.primary.map(actualKey))).toEqual(
          new Set(result.explanation.primary.map(expectedKey)),
        );
        const groupKey = (kind: string, practitionerId: string | undefined, factKeys: string[]) =>
          JSON.stringify([kind, practitionerId, [...new Set(factKeys)].sort()]);
        expect(
          projected.explanation.groups
            .map(({ kind, practitionerId, factIds }) =>
              groupKey(kind, practitionerId, factIds.map(actualKey)),
            )
            .sort(),
        ).toEqual(
          result.explanation.groups
            .map(({ kind, practitionerId, factIds }) =>
              groupKey(kind, practitionerId, factIds.map(expectedKey)),
            )
            .sort(),
        );
        for (const rawId of sourceById.keys())
          expect(serialized).not.toContain(JSON.stringify(rawId));

        const shuffled = structuredClone(result);
        shuffled.explanation.facts.reverse();
        shuffled.explanation.groups.reverse();
        shuffled.explanation.groups.forEach(({ factIds }) => factIds.reverse());
        shuffled.explanation.primary.reverse();
        expect(projectForAudience(shuffled, "patient", context)).toEqual(projected);
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);
