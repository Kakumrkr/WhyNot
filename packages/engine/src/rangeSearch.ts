import type { Alternative, RangeSearchReport, SearchReport } from "@whynot/contracts";
import { verifyAssignment } from "./feasibility.js";
import type { RangeDayPlan, RangeScanInput } from "./range.js";
import { addLocalDays, localDateDifference } from "./time.js";

type Bounds = { from: number; to: number };

/** Find the earliest verified start in each preference tier, sharing one evaluation budget. */
export function searchNextOpening(
  input: RangeScanInput,
  lastDate: string,
  range: Bounds,
  planDay: (input: RangeScanInput, date: string) => RangeDayPlan,
): { nextAvailable: Alternative | null; nextSearch: RangeSearchReport } {
  const { snapshot, preference, service, searchDays, budgetEvals } = input;
  const days = [];
  let limited = false;
  let from: number | undefined;
  let to = range.to;
  for (let offset = 1; offset <= searchDays; offset++) {
    const date = addLocalDays(lastDate, offset);
    if (!date.ok) {
      limited = true;
      break;
    }
    const plan = planDay(input, date.value);
    if (!plan.ok) {
      limited = true;
      break;
    }
    from ??= Math.max(plan.value.bounds.from, snapshot.coverage.from);
    to = Math.min(plan.value.bounds.to, snapshot.coverage.to);
    const starts = plan.value.windows.flatMap(({ starts }) => starts.map(({ start }) => start));
    days.push({
      date: date.value,
      starts: starts.filter(
        (start) =>
          start >= snapshot.coverage.from && start + service.durationMin <= snapshot.coverage.to,
      ),
    });
    if (
      plan.value.issues.length > 0 ||
      plan.value.bounds.to > snapshot.coverage.to ||
      starts.some((start) => start + service.durationMin > snapshot.coverage.to)
    ) {
      limited = true;
      break;
    }
  }
  let evaluated = 0;
  const searchedFrom = from ?? range.to;
  let checkedTo = searchedFrom;
  const response = (
    status: Exclude<SearchReport["status"], "disabled">,
    nextAvailable: Alternative | null = null,
  ): { nextAvailable: Alternative | null; nextSearch: RangeSearchReport } => {
    const searchedTo = nextAvailable || status === "budget_exhausted" ? checkedTo : to;
    if (searchedTo <= searchedFrom)
      return {
        nextAvailable: null,
        nextSearch: { status: "window_limited", from: null, to: null, evaluated: 0 },
      };
    return { nextAvailable, nextSearch: { status, from: searchedFrom, to: searchedTo, evaluated } };
  };
  const { practitionerId, ...base } = preference;
  for (const preferred of practitionerId === undefined
    ? [undefined]
    : [practitionerId, undefined]) {
    for (const { date, starts } of days) {
      for (const start of starts) {
        if (evaluated >= budgetEvals) return response("budget_exhausted");
        const request = {
          ...base,
          start,
          ...(preferred === undefined ? {} : { practitionerId: preferred }),
        };
        const context = input.slot(date, request);
        if (!context.ok) {
          to = checkedTo;
          return response("window_limited");
        }
        const assignment = verifyAssignment(context.value);
        evaluated++;
        checkedTo = Math.max(checkedTo, start + service.durationMin);
        if (assignment === null) continue;
        const changed = preferred === undefined && practitionerId !== undefined;
        const changes: Alternative["changes"] = [{ field: "start", from: range.from, to: start }];
        if (changed)
          changes.push({
            field: "practitionerId",
            from: practitionerId,
            to: assignment.practitionerId,
          });
        const offset = localDateDifference(input.fromDate, date);
        if (!offset.ok) throw new Error("Validated range dates could not be compared");
        return response("complete", {
          request: changed ? { ...request, practitionerId: assignment.practitionerId } : request,
          assignment,
          category: "other-day",
          cost: offset.value * 6 + (changed ? 8 : 0),
          changes,
        });
      }
    }
    // An incomplete preferred tier cannot establish that a preference change is needed.
    if (limited) return response("window_limited");
  }
  return response("complete");
}
