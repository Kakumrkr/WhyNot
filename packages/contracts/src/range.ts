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
import { checkReferences } from "./references.js";

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
export const RangeExplanationSchema = z
  .discriminatedUnion("status", [
    z.strictObject({
      status: z.literal("invalid_request"),
      errors: z.array(ValidationIssueSchema).min(1),
    }),
    z.strictObject({
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
    }),
    z.strictObject({
      status: z.literal("fully_blocked"),
      bookableCount: z.literal(0),
      commonCause: z.array(IdSchema),
      context: z.array(IdSchema),
      segments: z.array(RangeSegmentSchema).min(1),
      facts: z.array(FactSchema).min(1),
      nextAvailable: AlternativeSchema.nullable(),
      nextSearch: SearchReportSchema,
      meta: MetaSchema,
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.status !== "fully_blocked") return;
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
    if (value.nextSearch.status === "disabled" && value.nextAvailable !== null)
      ctx.addIssue({
        code: "custom",
        path: ["nextAvailable"],
        message: "Disabled search cannot return an opening",
      });
  });
export type RangeSegment = z.infer<typeof RangeSegmentSchema>;
export type RangeExplanation = z.infer<typeof RangeExplanationSchema>;
