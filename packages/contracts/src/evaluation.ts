import { z } from "zod";
import {
  IdSchema,
  BookingRequestSchema,
  AssignmentSchema,
  SearchReportSchema,
  MetaSchema,
  ValidationIssueSchema,
  NonnegativeSchema,
  MinuteSchema,
} from "./primitives.js";
import { FactSchema } from "./catalog.js";
import { AdminFixSchema, PolicyPatchSchema } from "./policy.js";
import { checkReferences } from "./references.js";

export const ExplanationGroupSchema = z.strictObject({
  id: IdSchema,
  kind: z.enum(["request", "practitioner", "capability-context", "resources"]),
  practitionerId: IdSchema.optional(),
  factIds: z.array(IdSchema).min(1),
});
export const PractitionerSummarySchema = z.strictObject({
  practitionerId: IdSchema,
  candidate: AssignmentSchema,
  factIds: z.array(IdSchema),
});
export const ExplanationSchema = z
  .strictObject({
    basis: z.enum(["matrix", "missing_resource"]),
    primary: z.array(IdSchema).min(1),
    groups: z.array(ExplanationGroupSchema),
    perCandidateSummary: z.array(PractitionerSummarySchema),
    facts: z.array(FactSchema).min(1),
    optimal: z.boolean(),
  })
  .superRefine((value, ctx) => {
    checkReferences(
      value.facts.map((f) => f.id),
      [
        ...value.primary.map((id, i) => ({ id, path: ["primary", i] })),
        ...value.groups.flatMap((g, i) =>
          g.factIds.map((id, j) => ({ id, path: ["groups", i, "factIds", j] })),
        ),
        ...value.perCandidateSummary.flatMap((g, i) =>
          g.factIds.map((id, j) => ({ id, path: ["perCandidateSummary", i, "factIds", j] })),
        ),
      ],
      ctx,
    );
    if (
      value.basis === "missing_resource" &&
      (!value.optimal ||
        value.primary.length !== 1 ||
        value.facts.length !== 1 ||
        value.facts[0]?.ruleId !== "resource-missing" ||
        value.perCandidateSummary.length !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Structural explanation requires exactly one missing-resource fact and no invented candidates",
      });
    }
  });
export const AlternativeCategorySchema = z.enum(["same-day", "other-practitioner", "other-day"]);
export const RequestChangeSchema = z
  .discriminatedUnion("field", [
    z.strictObject({ field: z.literal("start"), from: MinuteSchema, to: MinuteSchema }),
    z.strictObject({
      field: z.literal("practitionerId"),
      from: IdSchema.nullable(),
      to: IdSchema.nullable(),
    }),
  ])
  .refine(({ from, to }) => from !== to, { path: ["to"], message: "Change must alter the value" });
export const RequestChangesSchema = z
  .array(RequestChangeSchema)
  .min(1)
  .superRefine((changes, ctx) => {
    const seen = new Set<string>();
    changes.forEach((change, index) => {
      if (seen.has(change.field))
        ctx.addIssue({
          code: "custom",
          path: [index, "field"],
          message: "Duplicate changed field",
        });
      seen.add(change.field);
    });
  });
export const AlternativeSchema = z
  .strictObject({
    request: BookingRequestSchema,
    assignment: AssignmentSchema,
    category: AlternativeCategorySchema,
    cost: z.number().nonnegative(),
    changes: RequestChangesSchema,
  })
  .refine(
    ({ request, assignment }) =>
      request.start === assignment.start &&
      (request.practitionerId === undefined ||
        request.practitionerId === assignment.practitionerId),
    { message: "Assignment must satisfy alternative request" },
  )
  .superRefine(({ request, changes }, ctx) => {
    changes.forEach((change, index) => {
      const destination =
        change.field === "start" ? request.start : (request.practitionerId ?? null);
      if (change.to !== destination)
        ctx.addIssue({
          code: "custom",
          path: ["changes", index, "to"],
          message: "Change destination must match alternative request",
        });
    });
  });
export const TraceSchema = z
  .strictObject({
    facts: z.array(FactSchema),
    candidates: z
      .array(z.strictObject({ assignment: AssignmentSchema, factIds: z.array(IdSchema) }))
      .max(500),
    reducedRows: z.array(z.array(IdSchema)),
    selected: z.array(IdSchema),
    searchNodes: NonnegativeSchema,
    alternatives: z
      .array(z.strictObject({ request: BookingRequestSchema, bookable: z.boolean() }))
      .max(3000),
    candidatesTruncated: z.boolean(),
    alternativesTruncated: z.boolean(),
  })
  .superRefine((value, ctx) => {
    checkReferences(
      value.facts.map((f) => f.id),
      [
        ...value.selected.map((id, i) => ({ id, path: ["selected", i] })),
        ...value.candidates.flatMap((c, i) =>
          c.factIds.map((id, j) => ({ id, path: ["candidates", i, "factIds", j] })),
        ),
        ...value.reducedRows.flatMap((row, i) =>
          row.map((id, j) => ({ id, path: ["reducedRows", i, j] })),
        ),
      ],
      ctx,
    );
  });
export const StaffEvaluationSchema = z
  .discriminatedUnion("status", [
    z.strictObject({
      status: z.literal("invalid_request"),
      errors: z.array(ValidationIssueSchema).min(1),
    }),
    z.strictObject({
      status: z.literal("bookable"),
      assignment: AssignmentSchema,
      meta: MetaSchema,
      trace: TraceSchema.optional(),
    }),
    z.strictObject({
      status: z.literal("blocked"),
      explanation: ExplanationSchema,
      alternatives: z.array(AlternativeSchema),
      search: SearchReportSchema,
      adminFix: AdminFixSchema.nullable(),
      meta: MetaSchema,
      trace: TraceSchema.optional(),
    }),
  ])
  .superRefine((value, ctx) => {
    if (value.status !== "blocked") return;
    const refs = [
      ...(value.adminFix?.factIds.map((id, i) => ({ id, path: ["adminFix", "factIds", i] })) ?? []),
    ];
    checkReferences(
      value.explanation.facts.map((f) => f.id),
      refs,
      ctx,
    );
    if (value.search.status === "disabled" && value.alternatives.length > 0)
      ctx.addIssue({
        code: "custom",
        path: ["alternatives"],
        message: "Disabled search cannot return alternatives",
      });
    if (
      value.explanation.basis === "missing_resource" &&
      (value.adminFix !== null ||
        value.alternatives.length > 0 ||
        (value.trace?.candidates.length ?? 0) > 0)
    )
      ctx.addIssue({
        code: "custom",
        message: "Missing resources cannot be restored by policy/time changes",
      });
  });
export const PolicyPreviewSchema = z
  .strictObject({
    changes: PolicyPatchSchema,
    baseline: StaffEvaluationSchema,
    modified: StaffEvaluationSchema,
  })
  .superRefine((value, ctx) => {
    for (const key of ["baseline", "modified"] as const) {
      const evaluation = value[key];
      if (evaluation.status === "blocked" && evaluation.adminFix !== null)
        ctx.addIssue({
          code: "custom",
          path: [key, "adminFix"],
          message: "Preview disables recursive admin fixes",
        });
    }
    if (
      value.baseline.status !== "invalid_request" &&
      value.modified.status !== "invalid_request" &&
      value.baseline.meta.evaluatedAt !== value.modified.meta.evaluatedAt
    )
      ctx.addIssue({ code: "custom", message: "Preview must use the same injected now" });
  });
export type Explanation = z.infer<typeof ExplanationSchema>;
export type ExplanationGroup = z.infer<typeof ExplanationGroupSchema>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export type Trace = z.infer<typeof TraceSchema>;
export type StaffEvaluation = z.infer<typeof StaffEvaluationSchema>;
export type PolicyPreview = z.infer<typeof PolicyPreviewSchema>;
