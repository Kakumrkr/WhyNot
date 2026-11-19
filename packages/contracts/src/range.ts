import { z } from "zod";
import {
  DateSchema,
  IdSchema,
  MinuteSchema,
  MetaSchema,
  SearchReportSchema,
  PositiveSchema,
  ValidationIssueSchema,
} from "./primitives.js";
import { FactSchema } from "./catalog.js";
import { AlternativeSchema } from "./evaluation.js";
import {
  PatientAlternativeSchema,
  PatientValidationIssueSchema,
  PublicFactIdSchema,
  PublicFactSchema,
} from "./patient.js";
import { checkReferences } from "./references.js";

export const RangeOptionsSchema = z.strictObject({
  now: MinuteSchema,
  searchDays: z.number().int().min(1).max(14).default(14),
  budgetEvals: z.number().int().min(1).max(3000).default(3000),
});

export const RangeSearchReportSchema = z.union([
  SearchReportSchema,
  z.strictObject({
    status: z.literal("window_limited"),
    from: z.null(),
    to: z.null(),
    evaluated: z.literal(0),
  }),
]);

export const RangeSegmentSchema = z.discriminatedUnion("closedDay", [
  z.strictObject({
    closedDay: z.literal(true),
    date: DateSchema,
    memberStarts: z.tuple([]),
    factIds: z.array(IdSchema).min(1),
  }),
  z
    .strictObject({
      closedDay: z.literal(false),
      date: DateSchema,
      from: MinuteSchema,
      to: MinuteSchema,
      memberStarts: z.array(MinuteSchema).min(1),
      factIds: z.array(IdSchema).min(1),
    })
    .superRefine((value, ctx) => {
      if (
        value.from >= value.to ||
        value.memberStarts[0] !== value.from ||
        value.memberStarts.some(
          (start, i) =>
            start >= value.to || (i > 0 && start <= (value.memberStarts[i - 1] ?? start)),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Segment must contain strictly ordered starts within its bounds",
        });
    }),
]);
const availableRange = z.strictObject({
  status: z.literal("has_availability"),
  bookableCount: PositiveSchema,
  commonCause: z.tuple([]),
  context: z.tuple([]),
  segments: z.tuple([]),
  facts: z.tuple([]),
  nextAvailable: z.null(),
  nextSearch: z.strictObject({
    status: z.literal("disabled"),
    from: z.null(),
    to: z.null(),
    evaluated: z.literal(0),
  }),
  meta: MetaSchema,
});
const blockedRange = z.strictObject({
  status: z.literal("fully_blocked"),
  bookableCount: z.literal(0),
  commonCause: z.array(IdSchema),
  context: z.array(IdSchema),
  segments: z.array(RangeSegmentSchema),
  facts: z.array(FactSchema),
  nextAvailable: AlternativeSchema.nullable(),
  nextSearch: RangeSearchReportSchema,
  meta: MetaSchema,
});

function validateRangeReferences(
  value: Omit<z.infer<typeof blockedRange>, "facts" | "nextAvailable"> & {
    facts: { id: string }[];
    nextAvailable: unknown;
  },
  ctx: z.RefinementCtx,
) {
  checkReferences(
    value.facts.map((f) => f.id),
    [
      ...value.commonCause.map((id, i) => ({ id, path: ["commonCause", i] })),
      ...value.context.map((id, i) => ({ id, path: ["context", i] })),
      ...value.segments.flatMap((s, i) =>
        s.factIds.map((id, j) => ({ id, path: ["segments", i, "factIds", j] })),
      ),
    ],
    ctx,
  );
  if (
    (value.nextSearch.status === "disabled" || value.nextSearch.from === null) &&
    value.nextAvailable !== null
  )
    ctx.addIssue({
      code: "custom",
      path: ["nextAvailable"],
      message: "A search without bounds cannot return an opening",
    });
  if ((value.segments.length === 0) !== (value.facts.length === 0))
    ctx.addIssue({
      code: "custom",
      path: ["segments"],
      message: "Segment and fact evidence must both be present or both be empty",
    });
}

export const RangeExplanationSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("invalid_request"),
    errors: z.array(ValidationIssueSchema).min(1),
  }),
  availableRange,
  blockedRange.superRefine(validateRangeReferences),
]);

export const PatientRangeExplanationSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("invalid_request"),
    errors: z.array(PatientValidationIssueSchema).min(1),
  }),
  availableRange,
  blockedRange
    .extend({
      facts: z.array(PublicFactSchema),
      commonCause: z.array(PublicFactIdSchema),
      context: z.array(PublicFactIdSchema),
      nextAvailable: PatientAlternativeSchema.nullable(),
    })
    .superRefine(validateRangeReferences),
]);
export type RangeSegment = z.infer<typeof RangeSegmentSchema>;
export type RangeOptions = z.input<typeof RangeOptionsSchema>;
export type RangeSearchReport = z.infer<typeof RangeSearchReportSchema>;
export type RangeExplanation = z.infer<typeof RangeExplanationSchema>;
export type PatientRangeExplanation = z.infer<typeof PatientRangeExplanationSchema>;
