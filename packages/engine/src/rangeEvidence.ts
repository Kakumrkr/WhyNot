import type { Fact, RangeSegment } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { catalog } from "./catalog.js";
import { explain } from "./explain.js";
import { makeFact } from "./factId.js";
import type { factorViolations } from "./matrix.js";
import { canonicalFacts } from "./rules/resourceIntervals.js";

type Factors = ReturnType<typeof factorViolations>;
type Member = { start: number; factors: Factors };
type Opening = { date: string; members: Member[] };
const key = ({ ruleId, subject }: Fact) => JSON.stringify([ruleId, subject.id]);
const ordered = (ids: string[]) => [...new Set(ids)].sort(compareIds);

function index(factors: Factors) {
  const { facts } = factors;
  const pairs = new Map(facts.map((fact) => [fact.id, key(fact)]));
  const ids = (row: Fact[]) => row.map(({ id }) => id);
  const dimensions =
    factors.basis === "missing_resource"
      ? [[ids(facts)]]
      : [
          [ids(factors.global)],
          [...factors.practitioners.values()].map(ids),
          [...factors.rooms.values()].map(ids),
          ...(factors.equipment.size === 0 ? [] : [[...factors.equipment.values()].map(ids)]),
        ];
  return { pairs, dimensions, facts };
}

function sharedEvidence(members: ReturnType<typeof index>[]) {
  const representatives = new Map(members[0]!.facts.map((fact) => [key(fact), fact]));
  for (const { pairs } of members.slice(1)) {
    const present = new Set(pairs.values());
    for (const pair of representatives.keys()) if (!present.has(pair)) representatives.delete(pair);
  }
  const common = new Set(representatives.keys());
  // Candidate rows are a Cartesian product. A proof must hit the global clause or
  // every member of at least one dimension, else an uncovered candidate exists.
  const possible = members.map(({ dimensions, pairs }) =>
    dimensions
      .map((rows) =>
        rows.map((row) =>
          ordered(row.map((id) => pairs.get(id)!).filter((pair) => common.has(pair))),
        ),
      )
      .filter((rows) => rows.every((row) => row.length > 0)),
  );
  const suffices = () =>
    possible.every((dimensions) =>
      dimensions.some((rows) => rows.every((row) => row.some((pair) => common.has(pair)))),
    );
  if (!suffices())
    return {
      common: new Set<string>(),
      context: new Set(
        [...representatives].flatMap(([pair, fact]) => (fact.kind === "capability" ? [pair] : [])),
      ),
    };
  const removalOrder = [...representatives].sort(
    ([left, a], [right, b]) =>
      catalog[b.ruleId].weight - catalog[a.ruleId].weight || compareIds(right, left),
  );
  for (const [pair] of removalOrder) {
    common.delete(pair);
    if (!suffices()) common.add(pair);
  }
  return { common, context: new Set<string>() };
}

function slotSignature(
  { pairs, dimensions, facts }: ReturnType<typeof index>,
  context: Set<string>,
) {
  const weights = new Map(facts.map(({ id, ruleId }) => [id, catalog[ruleId].weight]));
  const candidates = [];
  for (const rows of dimensions) {
    const remaining = rows.filter((row) => !row.some((id) => context.has(pairs.get(id)!)));
    if (remaining.some((row) => row.length === 0)) continue;
    if (remaining.length === 0) return context;
    const { primary } = explain(remaining, facts);
    candidates.push({ primary, weight: primary.reduce((sum, id) => sum + weights.get(id)!, 0) });
  }
  candidates.sort((a, b) => {
    if (a.weight !== b.weight) return a.weight - b.weight;
    for (let i = 0; i < Math.min(a.primary.length, b.primary.length); i++) {
      const order = compareIds(a.primary[i]!, b.primary[i]!);
      if (order !== 0) return order;
    }
    return a.primary.length - b.primary.length;
  });
  const best = candidates[0];
  if (best === undefined) throw new Error("Range evidence requires a blocked slot");
  return new Set(best.primary.map((id) => pairs.get(id)!));
}

function segmentOpening(opening: Opening, context: Set<string>, common: Set<string>, grid: number) {
  const segments: Extract<RangeSegment, { closedDay: false }>[] = [];
  let previousSignature = "";
  for (const { start, factors } of opening.members) {
    const selected = common.size > 0 ? common : slotSignature(index(factors), context);
    const facts = factors.facts.filter((fact) => selected.has(key(fact)));
    const signature = JSON.stringify(ordered(facts.map(key)));
    const factIds = facts.map(({ id }) => id);
    const previous = segments.at(-1);
    const to = start + grid;
    if (previous?.to === start && previousSignature === signature) {
      previous.to = to;
      previous.memberStarts.push(start);
      previous.factIds = ordered([...previous.factIds, ...factIds]);
    } else {
      segments.push({
        closedDay: false,
        date: opening.date,
        from: start,
        to,
        memberStarts: [start],
        factIds,
      });
      previousSignature = signature;
    }
  }
  return segments;
}

/** Group starts by equivalent blocking signatures while retaining their individual witnesses. */
export function rangeEvidence(
  openings: Opening[],
  closedDates: string[],
  clinicId: string,
  grid: number,
) {
  const members = openings.flatMap(({ members }) => members.map(({ factors }) => factors));
  const closed = closedDates.map((date) =>
    makeFact("clinic-closed-day", { type: "clinic", id: clinicId }, { date }),
  );
  const dictionary = canonicalFacts([...members.flatMap(({ facts }) => facts), ...closed]);
  if (dictionary.length === 0) return { facts: [], commonCause: [], context: [], segments: [] };
  const { common, context } = sharedEvidence([
    ...members.map(index),
    ...closed.map((fact) => index({ basis: "missing_resource", facts: [fact] })),
  ]);
  const references = (pairs: Set<string>) =>
    dictionary.filter((fact) => pairs.has(key(fact))).map(({ id }) => id);
  const segments: RangeSegment[] = [
    ...openings.flatMap((opening) => segmentOpening(opening, context, common, grid)),
    ...closedDates.map((date, index): RangeSegment => ({
      closedDay: true,
      date,
      memberStarts: [],
      factIds: [closed[index]!.id],
    })),
  ];
  segments.sort(
    (a, b) => compareIds(a.date, b.date) || (a.closedDay || b.closedDay ? 0 : a.from - b.from),
  );
  const commonCause = references(common);
  const contextIds = references(context);
  const referenced = new Set([
    ...commonCause,
    ...contextIds,
    ...segments.flatMap(({ factIds }) => factIds),
  ]);
  return {
    facts: dictionary.filter(({ id }) => referenced.has(id)),
    commonCause,
    context: contextIds,
    segments,
  };
}
