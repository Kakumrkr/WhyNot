import {
  ClinicSnapshotSchema,
  RangeOptionsSchema,
  RangeRequestSchema,
  type BookingRequest,
  type RangeExplanation,
  type ValidationIssue,
} from "@whynot/contracts";
import { verifyAssignment } from "./feasibility.js";
import { rangeEvidence } from "./rangeEvidence.js";
import { searchNextOpening } from "./rangeSearch.js";
import { checkClinic } from "./rules/clinic.js";
import {
  addLocalDays,
  bookingLocalDates,
  datedSchedule,
  localGridDay,
  validatedDatedSchedules,
  type TimeResult,
} from "./time.js";
import { buildSlotContext } from "./validateRequest.js";

type RangeInput = Extract<ReturnType<typeof resolveInput>, { ok: true }>["value"];
type Bounds = { from: number; to: number };

function issue(code: ValidationIssue["code"], field: string, message: string): TimeResult<never> {
  return { ok: false, issues: [{ code, path: [field], message }] };
}

function resolveInput(snapshotInput: unknown, requestInput: unknown, nowInput: unknown) {
  const snapshotResult = ClinicSnapshotSchema.safeParse(snapshotInput);
  if (!snapshotResult.success) return issue("invalid_snapshot", "snapshot", "Invalid snapshot");
  const snapshot = snapshotResult.data;
  const parsed = RangeRequestSchema.safeParse(requestInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      issues: parsed.error.issues.map(({ path }): ValidationIssue => ({
        code: "invalid_request",
        path: path.filter((key): key is string | number => typeof key !== "symbol"),
        message: "Invalid range request field",
      })),
    };
  }
  const { fromDate, days, ...preference } = parsed.data;
  const patient = snapshot.patients.find(({ id }) => id === preference.patientId);
  const service = snapshot.services.find(({ id }) => id === preference.serviceId);
  if (patient === undefined) return issue("unknown_reference", "patientId", "Unknown patient");
  if (service === undefined) return issue("unknown_reference", "serviceId", "Unknown service");
  if (
    preference.practitionerId !== undefined &&
    !snapshot.practitioners.some(({ id }) => id === preference.practitionerId)
  )
    return issue("unknown_reference", "practitionerId", "Unknown practitioner");
  const parsedOptions = RangeOptionsSchema.safeParse(
    typeof nowInput === "number" ? { now: nowInput } : nowInput,
  );
  if (!parsedOptions.success || !Number.isSafeInteger(snapshot.policy.maxAdvanceDays * 1440))
    return issue("invalid_request", "now", "Invalid range clock or advance policy");
  const { timezone, slotGridMinutes, openingHours } = snapshot.clinic;
  const bookings = snapshot.bookings.filter(({ status }) => status === "confirmed");
  const durations = new Map(snapshot.services.map((entry) => [entry.id, entry]));
  if (
    bookings.some(({ end, serviceId }) => {
      const existing = durations.get(serviceId)!;
      return ![existing.bufferAfterMin, existing.roomTurnoverMin].every((buffer) =>
        Number.isSafeInteger(end + buffer),
      );
    })
  )
    return issue("invalid_request", "snapshot", "Buffered occupancy exceeds safe minute range");
  const bookingDates = bookingLocalDates(bookings, timezone);
  if (!bookingDates.ok) return bookingDates;
  const dated = new Map<string, ReturnType<typeof validatedDatedSchedules>>();
  const { now, searchDays, budgetEvals } = parsedOptions.data;
  const options = { now, trace: false, alternatives: false, includeAdminFix: false } as const;
  return {
    ok: true as const,
    value: {
      snapshot,
      service,
      preference,
      fromDate,
      days,
      searchDays,
      budgetEvals,
      options,
      grid: (date: string) => localGridDay(date, timezone, slotGridMinutes),
      opening(date: string) {
        if (snapshot.clinic.closedDates.includes(date)) return { ok: true as const, value: [] };
        return datedSchedule(openingHours, date, timezone);
      },
      slot(date: string, request: BookingRequest) {
        return buildSlotContext(
          { snapshot, request, options },
          patient,
          service,
          date,
          bookingDates.value,
          dated,
        );
      },
    },
  };
}

function planDay(input: RangeInput, date: string) {
  const grid = input.grid(date);
  if (!grid.ok) return grid;
  const hours = input.opening(date);
  if (!hours.ok) return hours;
  const windows: { opening: Bounds; starts: { start: number; to: number }[] }[] = [];
  for (const interval of hours.value) {
    const previous = windows.at(-1);
    if (previous !== undefined && previous.opening.to >= interval.from)
      previous.opening.to = Math.max(previous.opening.to, interval.to);
    else windows.push({ opening: { ...interval }, starts: [] });
  }
  let issues: ValidationIssue[] = [];
  for (const [index, { start }] of grid.value.starts.entries()) {
    const window = windows.find(({ opening }) => start >= opening.from && start < opening.to);
    if (window === undefined) continue;
    const end = start + input.service.durationMin;
    if (end > window.opening.to) {
      if (window.opening.to !== grid.value.to) continue;
      // Reuse the clinic rule when a candidate extends beyond today's final opening.
      const slot = input.slot(date, { ...input.preference, start });
      if (!slot.ok) {
        issues = slot.issues;
        break;
      }
      if (checkClinic(slot.value).length > 0) continue;
    }
    const to = grid.value.starts[index + 1]?.start ?? grid.value.to;
    window.starts.push({ start, to });
  }
  return {
    ok: true as const,
    value: { date, bounds: grid.value, closed: windows.length === 0, windows, issues },
  };
}

const disabled = { status: "disabled", from: null, to: null, evaluated: 0 } as const;

/** Explain a local-date range with an injected clock and optional bounded search options. */
export function explainRange(
  snapshot: unknown,
  request: unknown,
  options: unknown,
): RangeExplanation {
  const invalid = (errors: ValidationIssue[]): RangeExplanation => ({
    status: "invalid_request",
    errors,
  });
  const input = resolveInput(snapshot, request, options);
  if (!input.ok) return invalid(input.issues);
  const { value } = input;
  const plans = [];
  for (let day = 0; day < value.days; day++) {
    const date = addLocalDays(value.fromDate, day);
    if (!date.ok) return invalid(date.issues);
    const plan = planDay(value, date.value);
    if (!plan.ok) return invalid(plan.issues);
    if (plan.value.issues.length > 0) return invalid(plan.value.issues);
    const { from, to } = value.snapshot.coverage;
    if (plan.value.bounds.from < from || plan.value.bounds.to > to)
      return invalid([
        {
          code: "outside_coverage",
          path: ["fromDate"],
          message: "Requested local dates exceed snapshot coverage",
        },
      ]);
    plans.push(plan.value);
  }
  const first = plans[0]!;
  const last = plans.at(-1)!;
  const bounds: Bounds = { from: first.bounds.from, to: last.bounds.to };
  if (bounds.from === bounds.to)
    return invalid([
      {
        code: "unsupported_wall_time",
        path: ["fromDate"],
        message: "The requested local calendar range has no corresponding instants",
      },
    ]);
  const open = [];
  let bookableCount = 0;
  for (const { date, windows } of plans) {
    for (const { starts } of windows) {
      const members = [];
      for (const { start, to } of starts) {
        if (start + value.service.durationMin > value.snapshot.coverage.to)
          return invalid([
            {
              code: "outside_coverage",
              path: ["fromDate"],
              message: "An eligible appointment extends beyond snapshot coverage",
            },
          ]);
        const context = value.slot(date, { ...value.preference, start });
        if (!context.ok) return invalid(context.issues);
        if (verifyAssignment(context.value) !== null) bookableCount++;
        members.push({ to, context: context.value });
      }
      if (members.length > 0) open.push({ date, members });
    }
  }
  const meta = {
    schemaVersion: 1 as const,
    engineVersion: "0.0.0",
    policyVersionId: value.snapshot.policy.versionId,
    evaluatedAt: value.options.now,
  };
  if (bookableCount > 0)
    return {
      status: "has_availability",
      bookableCount,
      segments: [],
      commonCause: [],
      context: [],
      facts: [],
      nextAvailable: null,
      nextSearch: disabled,
      meta,
    };
  const evidence = rangeEvidence(
    open,
    plans.filter(({ closed }) => closed).map(({ date }) => date),
    value.snapshot.clinic.id,
  );
  const next = searchNextOpening(value, last.date, bounds, planDay);
  return { status: "fully_blocked", bookableCount: 0, ...evidence, ...next, meta };
}

export type RangeScanInput = RangeInput;
export type RangeDayPlan = ReturnType<typeof planDay>;
