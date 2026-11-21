import { z } from "zod";
import { StaffEvaluationSchema } from "./evaluation.js";
import { PatientEvaluationSchema, RangeRequestSchema } from "./patient.js";
import { PolicyPatchSchema } from "./policy.js";
import {
  BookingRequestSchema,
  DateSchema,
  EvaluateOptionsSchema,
  IdSchema,
  NonnegativeSchema,
  OffsetIsoSchema,
} from "./primitives.js";
import {
  PatientRangeExplanationSchema,
  RangeExplanationSchema,
  RangeOptionsSchema,
} from "./range.js";
import { ClinicSchema, PolicySchema, PractitionerSchema, ServiceSchema } from "./snapshot.js";

export const demoRoleHeader = "x-demo-role";
export const demoPatientHeader = "x-demo-patient-id";
export const DemoRoleSchema = z.enum(["patient", "staff"]);
// These values can be written to PostgreSQL text and JSONB.
const ApiIdSchema = IdSchema.max(128).regex(/^[^\p{Cc}\p{Cs}]+$/u);
const RequestIdentitySchema = BookingRequestSchema.omit({ start: true }).extend({
  patientId: ApiIdSchema,
  serviceId: ApiIdSchema,
  practitionerId: ApiIdSchema.optional(),
});
export const ApiBookingRequestSchema = RequestIdentitySchema.extend({ start: OffsetIsoSchema });
export const BookingParamsSchema = z.strictObject({ id: ApiIdSchema });
export const AvailabilityQuerySchema = RequestIdentitySchema.extend({ date: DateSchema });
const ApiEvaluateOptionsSchema = EvaluateOptionsSchema.omit({ now: true }).extend({
  alternatives: z
    .union([
      z.literal(false),
      z.strictObject({
        max: z.number().int().min(1).max(3),
        searchDays: z.number().int().min(0).max(14),
        budgetEvals: z.number().int().min(1).max(3000),
      }),
    ])
    .optional(),
});
export const ExplainBodySchema = z.strictObject({
  request: ApiBookingRequestSchema,
  options: ApiEvaluateOptionsSchema.optional(),
});
export const ExplainRangeBodySchema = z.strictObject({
  request: RequestIdentitySchema.extend(
    RangeRequestSchema.pick({ fromDate: true, days: true }).shape,
  ),
  options: RangeOptionsSchema.omit({ now: true }).optional(),
});
export const PolicyBodySchema = z.strictObject({
  request: ApiBookingRequestSchema,
  changes: PolicyPatchSchema,
});

export const HealthResponseSchema = z.strictObject({ status: z.literal("ok") });
export const ClinicResponseSchema = z.strictObject({
  clinic: ClinicSchema,
  services: z.array(ServiceSchema.pick({ id: true, displayName: true, durationMin: true })),
  practitioners: z.array(PractitionerSchema.pick({ id: true, displayName: true, role: true })),
  demoDate: DateSchema,
  now: OffsetIsoSchema,
  demoWindow: z.strictObject({ from: OffsetIsoSchema, to: OffsetIsoSchema }),
});
export const AvailabilityResponseSchema = z.strictObject({
  date: DateSchema,
  starts: z.array(
    z.strictObject({
      start: OffsetIsoSchema,
      time: z.string(),
      available: z.boolean(),
    }),
  ),
});
export const BookingResponseSchema = z.strictObject({
  // The cancellation handle is independent of the booking evidence IDs used by the engine.
  id: IdSchema,
  practitionerId: IdSchema,
  start: OffsetIsoSchema,
  end: OffsetIsoSchema,
});
export const CancellationResponseSchema = z.strictObject({ status: z.literal("cancelled") });
export const ResetResponseSchema = z.strictObject({ status: z.literal("reset") });
export const PolicyVersionContentSchema = z.strictObject({
  policy: PolicySchema.omit({ versionId: true }),
  serviceSettings: z.record(
    IdSchema,
    ServiceSchema.pick({
      bufferAfterMin: true,
      roomTurnoverMin: true,
      eligibility: true,
    }),
  ),
  practitionerCaps: z.record(IdSchema, NonnegativeSchema),
});
export const PolicyListResponseSchema = z.strictObject({
  activeVersionId: IdSchema,
  versions: z.array(z.strictObject({ id: IdSchema, content: PolicyVersionContentSchema })),
});

const ApiErrorCodeSchema = z.enum([
  "invalid_request",
  "forbidden",
  "not_found",
  "payload_too_large",
  "unsupported_media_type",
  "rate_limited",
  "booking_conflict",
  "contended",
  "internal_error",
]);
export const ApiErrorSchema = z.strictObject({
  error: z.strictObject({ code: ApiErrorCodeSchema, message: z.string() }),
});
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type DemoRole = z.infer<typeof DemoRoleSchema>;
export type ApiBookingRequest = z.infer<typeof ApiBookingRequestSchema>;
export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
export type PolicyVersionContent = z.infer<typeof PolicyVersionContentSchema>;

// Keep engine shapes and reference checks as the source of truth. The wire representation
// changes only the instant fields. Clock-of-day strings, IDs and elapsed numbers stay intact.
type InstantKey = "start" | "end" | "evaluatedAt" | "from" | "to" | "memberStarts";
type Wire<T, K = never> = T extends object
  ? { [P in keyof T]: Wire<T[P], T extends readonly unknown[] ? K : P> }
  : T extends number
    ? K extends InstantKey
      ? string
      : T
    : T;

type TimeBoundary = {
  parse: (iso: string) => number | undefined;
  format: (minute: number) => string;
};

function convertInstants(input: unknown, convert: (value: unknown) => unknown): unknown {
  if (Array.isArray(input)) return input.map((value: unknown) => convertInstants(value, convert));
  if (input === null || typeof input !== "object") return input;
  const object: Record<string, unknown> = Object.fromEntries(Object.entries(input));
  const instantBounds =
    object.field === "start" || object.closedDay === false || "evaluated" in object;
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      if (key === "memberStarts" && Array.isArray(value)) return [key, value.map(convert)];
      if (
        key === "start" ||
        key === "end" ||
        key === "evaluatedAt" ||
        (instantBounds && (key === "from" || key === "to"))
      )
        return [key, value === null ? null : convert(value)];
      if (key === "window" && value !== null && typeof value === "object" && !Array.isArray(value))
        return [
          key,
          Object.fromEntries(
            Object.entries(value).map(([bound, minute]) => [
              bound,
              bound === "from" || bound === "to" ? convert(minute) : minute,
            ]),
          ),
        ];
      return [key, convertInstants(value, convert)];
    }),
  );
}

function resultCodec<S extends z.ZodType>(schema: S, time: TimeBoundary) {
  return z.codec(z.custom<Wire<z.output<S>>>(), schema, {
    decode: (input) =>
      convertInstants(input, (value) => {
        const instant = OffsetIsoSchema.safeParse(value);
        // A boolean fails the engine instant schema, including optional and nullable bounds.
        return instant.success ? (time.parse(instant.data) ?? false) : false;
      }) as z.input<S>,
    encode: (output) =>
      convertInstants(output, (value) => {
        if (typeof value !== "number") throw new Error("Expected an engine instant");
        return OffsetIsoSchema.parse(time.format(value));
      }) as Wire<z.output<S>>,
  });
}

/** Build bidirectional HTTP codecs with the shared clinic-time conversion functions. */
export function apiResults(time: TimeBoundary) {
  const staffSlot = resultCodec(StaffEvaluationSchema, time);
  const patientSlot = resultCodec(PatientEvaluationSchema, time);
  const staffRange = resultCodec(RangeExplanationSchema, time);
  const patientRange = resultCodec(PatientRangeExplanationSchema, time);
  const evaluationError = <S extends z.ZodType>(schema: S) =>
    z.strictObject({
      error: ApiErrorSchema.shape.error.extend({
        details: z.strictObject({ evaluation: schema }).optional(),
      }),
    });
  return {
    staffSlot,
    patientSlot,
    staffRange,
    patientRange,
    staffSlotError: evaluationError(staffSlot),
    patientSlotError: evaluationError(patientSlot),
    staffRangeError: evaluationError(staffRange),
    patientRangeError: evaluationError(patientRange),
    policy: z.strictObject({
      activeVersionId: IdSchema,
      changes: PolicyPatchSchema,
      baseline: staffSlot,
      modified: staffSlot,
    }),
  };
}
