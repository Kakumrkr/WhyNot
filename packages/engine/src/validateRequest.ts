import {
  ClinicSnapshotSchema,
  BookingRequestSchema,
  EvaluateOptionsSchema,
  type EvaluationInput,
  type Patient,
  type Service,
  type ValidationIssue,
} from "@whynot/contracts";
import {
  addLocalDays,
  validatedDatedSchedules,
  isOnLocalGrid,
  localDate,
  bookingLocalDates,
  type TimeResult,
} from "./time.js";

type Interval = { from: number; to: number };
export type RuleContext = EvaluationInput & {
  patient: Patient;
  service: Service;
  date: string;
  interval: Interval;
  clinicDays: { date: string; hours: Interval[] }[];
  bookingDates: ReadonlyMap<string, string>;
  practitionerHours: ReadonlyMap<string, Interval[]>;
};

function invalid(
  code: ValidationIssue["code"],
  path: ValidationIssue["path"],
  message: string,
): TimeResult<never> {
  return { ok: false, issues: [{ code, path, message }] };
}

/** Validate untrusted input before internal checks; errors never echo unparsed values. */
export function validateRequest(
  snapshotInput: unknown,
  request: unknown,
  options: unknown,
): TimeResult<RuleContext> {
  const snapshotResult = ClinicSnapshotSchema.safeParse(snapshotInput);
  if (!snapshotResult.success)
    return invalid("invalid_snapshot", ["snapshot"], "Invalid snapshot structure or references");
  const parsedRequest = BookingRequestSchema.safeParse(request);
  const parsedOptions = EvaluateOptionsSchema.safeParse(options);
  if (!parsedRequest.success || !parsedOptions.success)
    return invalid("invalid_request", [], "Invalid request or options structure");
  const input: EvaluationInput = {
    snapshot: snapshotResult.data,
    request: parsedRequest.data,
    options: parsedOptions.data,
  };
  const { snapshot } = input;
  for (const [field, entries] of [
    ["patientId", snapshot.patients],
    ["serviceId", snapshot.services],
    ["practitionerId", snapshot.practitioners],
  ] as const) {
    const id = input.request[field];
    if (id !== undefined && !entries.some((entry) => entry.id === id))
      return invalid("unknown_reference", ["request", field], "Unknown request reference");
  }
  const service = snapshot.services.find((item) => item.id === input.request.serviceId);
  const patient = snapshot.patients.find((item) => item.id === input.request.patientId);
  if (service === undefined || patient === undefined)
    throw new Error("Validated reference missing");
  const start = input.request.start;
  const end = start + service.durationMin;
  if (!Number.isSafeInteger(end))
    return invalid(
      "invalid_request",
      ["request", "start"],
      "Appointment end exceeds safe minute range",
    );
  if (
    ![service.bufferAfterMin, service.roomTurnoverMin].every((buffer) =>
      Number.isSafeInteger(end + buffer),
    ) ||
    snapshot.bookings.some((booking) => {
      if (booking.status === "cancelled") return false;
      const existing = snapshot.services.find((entry) => entry.id === booking.serviceId);
      if (existing === undefined) throw new Error("Validated booking service missing");
      return ![existing.bufferAfterMin, existing.roomTurnoverMin].every((buffer) =>
        Number.isSafeInteger(booking.end + buffer),
      );
    })
  )
    return invalid("invalid_request", [], "Buffered occupancy exceeds safe minute range");
  if (start < snapshot.coverage.from || end > snapshot.coverage.to)
    return invalid(
      "outside_coverage",
      ["request", "start"],
      "Appointment is outside snapshot coverage",
    );
  if (
    !Number.isSafeInteger(start - input.options.now) ||
    !Number.isSafeInteger(snapshot.policy.maxAdvanceDays * 1440)
  )
    return invalid(
      "invalid_request",
      ["options", "now"],
      "Elapsed arithmetic exceeds safe minute range",
    );
  const zone = snapshot.clinic.timezone;
  const aligned = isOnLocalGrid(start, zone, snapshot.clinic.slotGridMinutes);
  if (!aligned.ok) return aligned;
  if (!aligned.value)
    return invalid("off_grid", ["request", "start"], "Start is off the clinic local grid");
  const date = localDate(start, zone);
  if (!date.ok) return date;
  const lastDate = localDate(end - 1, zone);
  if (!lastDate.ok) return lastDate;
  const clinicDays: RuleContext["clinicDays"] = [];
  const practitionerHours = new Map<string, Interval[]>();
  const schedules = [
    snapshot.clinic.openingHours,
    ...snapshot.practitioners.flatMap((p) => [p.workingHours, p.breaks]),
  ];
  let current = date.value;
  for (;;) {
    const dated = validatedDatedSchedules(schedules, current, zone);
    if (!dated.ok) return dated;
    clinicDays.push({ date: current, hours: dated.value[0]! });
    // These schedules will be consumed by resource checks in 1.4. Reject unsupported
    // recurring boundaries now so a global blocker cannot conceal invalid input.
    for (const [index, practitioner] of snapshot.practitioners.entries()) {
      practitionerHours.set(practitioner.id, [
        ...(practitionerHours.get(practitioner.id) ?? []),
        ...dated.value[1 + index * 2]!,
      ]);
    }
    if (current === lastDate.value) break;
    const next = addLocalDays(current, 1);
    if (!next.ok) return next;
    current = next.value;
  }
  const bookingDates = bookingLocalDates(
    snapshot.bookings.filter((b) => b.status === "confirmed"),
    zone,
  );
  if (!bookingDates.ok) return bookingDates;
  return {
    ok: true,
    value: {
      ...input,
      patient,
      service,
      date: date.value,
      interval: { from: start, to: end },
      clinicDays,
      bookingDates: bookingDates.value,
      practitionerHours,
    },
  };
}
