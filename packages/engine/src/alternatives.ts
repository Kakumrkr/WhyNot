import type { Alternative, CostWeights, SearchReport, Trace } from "@whynot/contracts";
import { compareIds } from "./candidates.js";
import { verifyAssignment } from "./feasibility.js";
import {
  addLocalDays,
  localDate,
  localDateDifference,
  localGridDay,
  localMinuteOfDay,
} from "./time.js";
import { buildSlotContext, type RuleContext } from "./validateRequest.js";

const defaults: CostWeights = { timeOfDay: 1, day: 6, practitioner: 8, earlier: 0.1 };

type Slot = { date: string; start: number; cost: number; practitionerId: string | undefined };
type Order = Pick<Slot, "start" | "cost" | "practitionerId">;
type DateRange = { first: number; last: number; order: Order };
type DaySlots = { slots: Slot[]; index: number };
type Attempt = Trace["alternatives"][number];
type Search = {
  alternatives: Alternative[];
  search: SearchReport;
  attempts: Attempt[];
  unrepresentableCost: boolean;
};

function value<T>(result: { ok: true; value: T } | { ok: false }): T {
  if (!result.ok) throw new Error("Validated calendar arithmetic failed");
  return result.value;
}

function compareSlots(a: Order, b: Order): number {
  return (
    Number(a.cost > b.cost) - Number(a.cost < b.cost) ||
    a.start - b.start ||
    compareIds(a.practitionerId ?? "", b.practitionerId ?? "")
  );
}

function boundDateRange(
  first: number,
  last: number,
  start: number,
  weights: CostWeights,
): DateRange {
  const nearest = Math.max(first, -last, 0);
  return {
    first,
    last,
    order: {
      cost: nearest * weights.day + (last < -3 ? weights.earlier : 0),
      // Cover the request's time of day and the full possible difference in UTC offsets.
      start: start + (first - 3) * 1440,
      practitionerId: undefined,
    },
  };
}

function* orderedSlots(
  context: RuleContext,
  first: number,
  last: number,
  from: number,
  to: number,
): Generator<Slot> {
  if (first > last) return;
  const { snapshot, options, request, date, service } = context;
  const { timezone, slotGridMinutes } = snapshot.clinic;
  const weights = options.costWeights ?? defaults;
  const originalWall = value(localMinuteOfDay(request.start, timezone));
  const originalId = request.practitionerId;
  const otherIds =
    originalId === undefined
      ? []
      : snapshot.practitioners
          .map(({ id }) => id)
          .filter((id) => id !== originalId)
          .sort(compareIds);
  const frontier: (DateRange | DaySlots)[] = [boundDateRange(first, last, request.start, weights)];
  const order = (entry: DateRange | DaySlots) =>
    "order" in entry ? entry.order : entry.slots[entry.index]!;
  // Compare unexpanded date ranges by lower bounds and opened days by their next slot.
  // Splitting ranges keeps even very wide searches lazy when rounded costs tie.
  while (frontier.length > 0) {
    frontier.sort((a, b) => compareSlots(order(b), order(a)));
    const head = frontier.pop()!;
    if ("slots" in head) {
      yield head.slots[head.index++]!;
      if (head.index < head.slots.length) frontier.push(head);
    } else if (head.first < head.last) {
      const mid = Math.floor((head.first + head.last) / 2);
      frontier.push(
        boundDateRange(head.first, mid, request.start, weights),
        boundDateRange(mid + 1, head.last, request.start, weights),
      );
    } else {
      const offset = head.first;
      const day = value(addLocalDays(date, offset));
      const grid = value(localGridDay(day, timezone, slotGridMinutes));
      const slots: Slot[] = [];
      for (const { start, wallMinute } of grid.starts) {
        if (
          start < from ||
          start + service.durationMin > snapshot.coverage.to ||
          start >= to ||
          start - options.now < snapshot.policy.minNoticeMin
        )
          continue;
        const baseCost =
          (Math.abs(wallMinute - originalWall) / 15) * weights.timeOfDay +
          Math.abs(offset) * weights.day +
          (start < request.start ? weights.earlier : 0);
        if (start !== request.start)
          slots.push({ date: day, start, cost: baseCost, practitionerId: originalId });
        for (const practitionerId of otherIds)
          slots.push({ date: day, start, cost: baseCost + weights.practitioner, practitionerId });
      }
      if (slots.length > 0) frontier.push({ slots: slots.sort(compareSlots), index: 0 });
    }
  }
}

function selectAlternatives(verified: Alternative[], max: number): Alternative[] {
  const seen = new Map<number, Set<string>>();
  const categories = new Set<Alternative["category"]>();
  const diverse: Alternative[] = [];
  const remaining: Alternative[] = [];
  for (const alternative of verified) {
    const { start, practitionerId } = alternative.assignment;
    let ids = seen.get(start);
    if (ids === undefined) {
      ids = new Set();
      seen.set(start, ids);
    }
    if (ids.has(practitionerId)) continue;
    ids.add(practitionerId);
    if (categories.has(alternative.category)) {
      remaining.push(alternative);
    } else {
      diverse.push(alternative);
      categories.add(alternative.category);
    }
  }
  return [...diverse, ...remaining].slice(0, max);
}

/** Search changed requests in cost order, returning only rechecked assignment witnesses. */
export function searchAlternatives(context: RuleContext): Search {
  const { options, snapshot, date, request } = context;
  const attempts: Attempt[] = [];
  const verified: Alternative[] = [];
  if (options.alternatives === false)
    return {
      alternatives: verified,
      search: { status: "disabled", from: null, to: null, evaluated: 0 },
      attempts,
      unrepresentableCost: false,
    };
  const { budgetEvals, searchDays, max } = options.alternatives;
  const { timezone } = snapshot.clinic;
  const first = Math.max(-searchDays, value(localDateDifference(date, "0000-01-01")));
  const last = Math.min(searchDays, value(localDateDifference(date, "9999-12-31")));
  const lowerGrid = value(localGridDay(value(addLocalDays(date, first)), timezone, 1440));
  const upperGrid = value(localGridDay(value(addLocalDays(date, last)), timezone, 1440));
  const from = Math.max(lowerGrid.from, snapshot.coverage.from);
  const to = Math.min(upperGrid.to, snapshot.coverage.to);
  const firstEligible = Math.max(from, options.now + snapshot.policy.minNoticeMin);
  // A backwards clock transition around midnight can revisit an adjacent date.
  const firstCovered = localDate(firstEligible - 1440, timezone);
  const lastCovered = localDate(to - 1 + 1440, timezone);
  const slots = orderedSlots(
    context,
    firstCovered.ok ? Math.max(first, value(localDateDifference(date, firstCovered.value))) : first,
    firstEligible >= to
      ? -Infinity
      : lastCovered.ok
        ? Math.min(last, value(localDateDifference(date, lastCovered.value)))
        : last,
    firstEligible,
    to,
  );
  let evaluated = 0;
  let evaluatedFrom = to;
  let evaluatedTo = from;
  let unrepresentableCost = false;
  const dates: NonNullable<Parameters<typeof buildSlotContext>[5]> = new Map();
  let next = slots.next();
  while (!next.done && evaluated < budgetEvals) {
    const slot = next.value;
    const changed = {
      ...request,
      start: slot.start,
      ...(slot.practitionerId === undefined ? {} : { practitionerId: slot.practitionerId }),
    };
    const changedContext = buildSlotContext(
      { snapshot, request: changed, options },
      context.patient,
      context.service,
      slot.date,
      context.bookingDates,
      dates,
    );
    const assignment = changedContext.ok ? verifyAssignment(changedContext.value) : null;
    evaluated++;
    evaluatedFrom = Math.min(evaluatedFrom, slot.start);
    evaluatedTo = Math.max(evaluatedTo, slot.start + context.service.durationMin);
    if (options.trace && attempts.length < 3000)
      attempts.push({ request: changed, bookable: assignment !== null });
    if (assignment !== null) {
      const changes: Alternative["changes"] = [];
      if (request.start !== changed.start)
        changes.push({ field: "start", from: request.start, to: changed.start });
      if (request.practitionerId !== changed.practitionerId)
        changes.push({
          field: "practitionerId",
          from: request.practitionerId ?? null,
          to: changed.practitionerId ?? null,
        });
      const category =
        slot.date !== date
          ? "other-day"
          : request.practitionerId !== changed.practitionerId
            ? "other-practitioner"
            : "same-day";
      unrepresentableCost ||= !Number.isFinite(slot.cost);
      verified.push({ request: changed, assignment, category, cost: slot.cost, changes });
    }
    next = slots.next();
  }
  const status = !next.done
    ? "budget_exhausted"
    : from > lowerGrid.from || to < upperGrid.to || first > -searchDays || last < searchDays
      ? "window_limited"
      : "complete";
  return {
    alternatives: selectAlternatives(verified, max),
    search:
      status === "budget_exhausted"
        ? { status, from: evaluatedFrom, to: evaluatedTo, evaluated }
        : { status, from, to, evaluated },
    attempts,
    unrepresentableCost,
  };
}
