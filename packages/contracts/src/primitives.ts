import { z } from "zod";

export const schemaVersion = 1;
export const SchemaVersionSchema = z.literal(schemaVersion);
export const IdSchema = z.string().min(1);
export const MinuteSchema = z.number().int().safe();
export const NonnegativeSchema = MinuteSchema.nonnegative();
export const PositiveSchema = MinuteSchema.positive();
export const DateSchema = z.iso.date();
export const OffsetIsoSchema = z.iso.datetime({ offset: true, precision: 0 });
export const ClockSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const IntervalSchema = z
  .strictObject({ from: MinuteSchema, to: MinuteSchema })
  .refine(({ from, to }) => from < to, { path: ["to"], message: "End must follow start" });
export const WindowSchema = z
  .strictObject({ id: IdSchema, ...IntervalSchema.shape })
  .refine(({ from, to }) => from < to, { path: ["to"], message: "End must follow start" });
export const WeeklyHoursSchema = z.array(
  z
    .strictObject({
      weekday: z.number().int().min(1).max(7),
      from: ClockSchema,
      to: ClockSchema,
    })
    .refine(({ from, to }) => from < to, { path: ["to"], message: "Use separate day intervals" }),
);
export const BookingRequestSchema = z.strictObject({
  patientId: IdSchema,
  serviceId: IdSchema,
  start: MinuteSchema,
  practitionerId: IdSchema.optional(),
});
export const ValidationIssueSchema = z.strictObject({
  code: z.enum([
    "invalid_snapshot",
    "invalid_request",
    "unknown_reference",
    "off_grid",
    "outside_coverage",
    "unsupported_wall_time",
  ]),
  path: z.array(z.union([z.string(), z.number().int()])),
  message: z.string().min(1),
});
export const MetaSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  engineVersion: IdSchema,
  policyVersionId: IdSchema,
  evaluatedAt: MinuteSchema,
});
export const AssignmentSchema = z
  .strictObject({
    practitionerId: IdSchema,
    roomId: IdSchema,
    equipmentId: IdSchema.nullable(),
    start: MinuteSchema,
    end: MinuteSchema,
  })
  .refine(({ start, end }) => start < end, { path: ["end"], message: "End must follow start" });
export const CostWeightsSchema = z.strictObject({
  timeOfDay: z.number().positive(),
  day: z.number().positive(),
  practitioner: z.number().positive(),
  earlier: z.number().nonnegative(),
});
export const SearchOptionsSchema = z.strictObject({
  max: PositiveSchema,
  searchDays: NonnegativeSchema,
  budgetEvals: PositiveSchema,
});
export const EvaluateOptionsSchema = z.strictObject({
  now: MinuteSchema,
  alternatives: z.union([z.literal(false), SearchOptionsSchema]).default(false),
  costWeights: CostWeightsSchema.optional(),
  trace: z.boolean().default(false),
  includeAdminFix: z.boolean().default(false),
});
export const SearchReportSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("disabled"),
    from: z.null(),
    to: z.null(),
    evaluated: z.literal(0),
  }),
  z
    .strictObject({
      status: z.enum(["complete", "budget_exhausted", "window_limited"]),
      from: MinuteSchema,
      to: MinuteSchema,
      evaluated: NonnegativeSchema,
    })
    .refine(({ from, to }) => from < to, { path: ["to"], message: "Invalid search coverage" }),
]);
export type BookingRequest = z.infer<typeof BookingRequestSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type CostWeights = z.infer<typeof CostWeightsSchema>;
export type EvaluateOptions = z.infer<typeof EvaluateOptionsSchema>;
export type SearchReport = z.infer<typeof SearchReportSchema>;
export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;
export type Window = z.infer<typeof WindowSchema>;
