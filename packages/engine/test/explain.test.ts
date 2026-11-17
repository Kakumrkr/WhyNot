import { expect, it } from "vitest";
import fc from "fast-check";
import { catalog } from "@whynot/engine";
import type { Fact } from "@whynot/contracts";
import { makeFact } from "../src/factId.js";
import { explain } from "../src/explain.js";

const fact = (id: string, kind: number): Fact => {
  const subject = { type: "practitioner", id } as const;
  return kind === 0
    ? makeFact("clinic-closed-day", subject, { date: "2026-11-16" })
    : kind === 1
      ? makeFact("clinic-hours", subject, { date: "2026-11-16" })
      : kind === 2
        ? makeFact("practitioner-hours", subject, { date: "2026-11-16" })
        : kind === 3
          ? makeFact("request-practitioner", subject, { practitionerId: id })
          : kind === 4
            ? makeFact("practitioner-skill", subject, { requiredSkill: "consult" })
            : makeFact("room-capability", subject, { requiredCapability: "consult" });
};

// Exhaustive independent power-set oracle: no production reduction, masks or comparator.
function brute(rows: string[][], facts: Fact[]): string[] {
  const order = (a: string, b: string) => {
    const x = [...a].map((c) => c.codePointAt(0)!);
    const y = [...b].map((c) => c.codePointAt(0)!);
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
    return x.length - y.length;
  };
  let best: string[] = [];
  let bestWeight = Infinity;
  for (let subset = 1; subset < 2 ** facts.length; subset++) {
    const selected = facts.filter((_, i) => (subset & (2 ** i)) !== 0);
    const ids = selected.map((f) => f.id).sort(order);
    if (!rows.every((row) => row.some((id) => ids.includes(id)))) continue;
    const weight = selected.reduce((sum, f) => sum + catalog[f.ruleId].weight, 0);
    const first = ids.findIndex((id, i) => id !== best[i]);
    if (
      weight < bestWeight ||
      (weight === bestWeight &&
        (first === -1 ? ids.length < best.length : order(ids[first]!, best[first] ?? "") < 0))
    ) {
      best = ids;
      bestWeight = weight;
    }
  }
  return best;
}

function assertCoverage(rows: string[][], primary: string[]) {
  expect(rows.every((row) => row.some((id) => primary.includes(id)))).toBe(true);
  for (const id of primary)
    expect(
      rows.some(
        (row) => row.includes(id) && row.filter((entry) => primary.includes(entry)).length === 1,
      ),
    ).toBe(true);
}

const matrices = fc
  .array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 12 })
  .chain((kinds) =>
    fc
      .array(fc.integer({ min: 1, max: 2 ** kinds.length - 1 }), { minLength: 1, maxLength: 12 })
      .map((masks) => {
        const facts = kinds.map((kind, i) => fact(`f-${i}`, kind));
        return {
          facts,
          rows: masks.map((mask) =>
            facts.filter((_, i) => (mask & (2 ** i)) !== 0).map((f) => f.id),
          ),
        };
      }),
  );

it(
  "P3/P4/P5: <=12-fact matrices match exhaustive weight and canonical ties; bounded fallback stays irredundant",
  { timeout: 300000 },
  () => {
    fc.assert(
      fc.property(matrices, ({ facts, rows }) => {
        const actual = explain(rows, facts);
        expect(actual.optimal).toBe(true);
        expect(actual.primary).toEqual(brute(rows, facts));
        assertCoverage(rows, actual.primary);
        const fallback = explain(rows, facts, 1);
        expect(fallback.searchNodes).toBeLessThanOrEqual(1);
        assertCoverage(rows, fallback.primary);
        expect(
          explain(
            [...rows].reverse().map((r) => [...r].reverse()),
            [...facts].reverse(),
          ),
        ).toEqual(actual);
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);

it("reduces duplicate/superset rows, includes forced facts, and keeps equal-weight branches", () => {
  const facts = [fact("a", 0), fact("b", 0), fact("c", 0)];
  const [a, b, c] = facts.map((f) => f.id);
  const result = explain([[a!], [a!, b!], [b!, c!], [b!, c!]], facts);
  expect(result.primary).toEqual([a, b]);
  expect(result.reducedRows).toEqual([[a], [b, c]]);
  expect(
    explain(
      [
        [a!, b!],
        [b!, c!],
        [a!, c!],
      ],
      facts,
      1,
    ).optimal,
  ).toBe(false);
  const unicode = [fact("\u{10000}", 0), fact("\uE000", 0)];
  expect(explain([unicode.map((f) => f.id)], unicode).primary).toEqual([unicode[1]!.id]);
});

it("throws on malformed internal matrices rather than swallowing invariants", () => {
  expect(() => explain([], [])).toThrow();
  expect(() => explain([[]], [])).toThrow();
  expect(() => explain([["missing"]], [])).toThrow("reference missing");
});
