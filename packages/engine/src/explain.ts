import type { Fact } from "@whynot/contracts";
import { catalog } from "./catalog.js";
import { compareIds } from "./candidates.js";

function compareSequences(a: string[], b: string[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const order = compareIds(a[i]!, b[i]!);
    if (order !== 0) return order;
  }
  return a.length - b.length;
}

/** Minimum-weight hitting set with deterministic bounded search and checked fallback.
 * nodeLimit is internal, allowing tests to force exhaustion without changing public options.
 */
export function explain(
  rows: readonly (readonly string[])[],
  facts: readonly Fact[],
  nodeLimit = 50000,
) {
  if (rows.length === 0 || rows.some((row) => row.length === 0))
    throw new Error("Explanation requires a nonempty blocked matrix");
  const weights = new Map(facts.map((fact) => [fact.id, catalog[fact.ruleId].weight]));
  const ids = [...new Set(rows.flat())].sort(compareIds);
  const indices = new Map(ids.map((id, index) => [id, index]));
  const bits = ids.map((id, index) => {
    if (!weights.has(id)) throw new Error("Matrix fact reference missing");
    return 1n << BigInt(index);
  });
  const bit = (id: string) => bits[indices.get(id)!]!;
  const mask = (row: readonly string[]) => row.reduce((result, id) => result | bit(id), 0n);
  const unique = new Map(rows.map((row) => [mask(row), new Set(row).size]));
  const members = (row: bigint) => ids.filter((id) => (row & bit(id)) !== 0n);
  const minimal: bigint[] = [];
  for (const [row] of [...unique].sort((a, b) => a[1] - b[1])) {
    if (!minimal.some((other) => (other & row) === other)) minimal.push(row);
  }
  const reduced = minimal
    .map(members)
    .sort((a, b) => a.length - b.length || compareSequences(a, b));
  const masks = reduced.map(mask);
  const weight = (selected: string[]) => selected.reduce((sum, id) => sum + weights.get(id)!, 0);
  const hits = (selected: string[], row: readonly string[]) =>
    selected.some((id) => row.includes(id));
  const sufficient = (selected: string[]) => rows.every((row) => hits(selected, row));
  const deletionOrder = (a: string, b: string) =>
    weights.get(b)! - weights.get(a)! || compareIds(b, a);
  const greedy: string[] = [];
  let remaining = [...reduced];
  while (remaining.length > 0) {
    const choices = ids.map((id) => ({
      id,
      count: remaining.filter((row) => row.includes(id)).length,
    }));
    choices.sort(
      (a, b) =>
        weights.get(a.id)! * b.count - weights.get(b.id)! * a.count || compareIds(a.id, b.id),
    );
    const choice = choices.find((entry) => entry.count > 0);
    if (choice === undefined) throw new Error("Greedy explanation made no progress");
    greedy.push(choice.id);
    remaining = remaining.filter((row) => !row.includes(choice.id));
  }
  for (const id of [...greedy].sort(deletionOrder)) {
    const without = greedy.filter((item) => item !== id);
    if (sufficient(without)) greedy.splice(greedy.indexOf(id), 1);
  }
  greedy.sort(compareIds);
  let best = greedy;
  let bestWeight = weight(best);
  let searchNodes = 0;
  let exhausted = false;
  const forced = [...new Set(reduced.filter((row) => row.length === 1).flat())].sort(compareIds);

  function search(selected: string[], selectedMask: bigint, cost: number): void {
    if (exhausted) return;
    if (searchNodes >= nodeLimit) {
      exhausted = true;
      return;
    }
    searchNodes++;
    const unhit = reduced.filter((_, index) => (masks[index]! & selectedMask) === 0n);
    if (unhit.length === 0) {
      const sorted = [...selected].sort(compareIds);
      if (cost < bestWeight || (cost === bestWeight && compareSequences(sorted, best) < 0)) {
        best = sorted;
        bestWeight = cost;
      }
      return;
    }
    // Disjoint rows require distinct additional facts, giving an admissible lower bound.
    let used = 0n;
    let bound = cost;
    for (const row of unhit) {
      const rowMask = mask(row);
      if ((rowMask & used) === 0n) {
        bound += Math.min(...row.map((id) => weights.get(id)!));
        used |= rowMask;
      }
    }
    if (bound > bestWeight) return;
    for (const id of [...unhit[0]!].sort(
      (a, b) => weights.get(a)! - weights.get(b)! || compareIds(a, b),
    ))
      search([...selected, id], selectedMask | bit(id), cost + weights.get(id)!);
  }
  search(forced, mask(forced), weight(forced));
  const primary = exhausted ? greedy : best;
  if (
    !sufficient(primary) ||
    primary.some((id) => sufficient(primary.filter((item) => item !== id)))
  )
    throw new Error("Explanation sufficiency or irredundancy invariant failed");
  return { primary, optimal: !exhausted, reducedRows: reduced, searchNodes };
}
