import { z } from "zod";
import {
  IdSchema,
  MinuteSchema,
  IntervalSchema,
  DateSchema,
  NonnegativeSchema,
  MetaSchema,
  SearchReportSchema,
} from "./primitives.js";
import { RuleParams } from "./catalog.js";
import { AlternativeCategorySchema, RequestChangeSchema } from "./evaluation.js";
import { checkReferences } from "./references.js";

export const PublicFactIdSchema = z.string().regex(/^fact-[1-9]\d*$/);
const publicBase = {
  id: PublicFactIdSchema,
  practitionerId: IdSchema.optional(),
  window: IntervalSchema.optional(),
};
const publicParams = {
  "clinic-closed-day": RuleParams["clinic-closed-day"],
  "clinic-hours": RuleParams["clinic-hours"],
  "min-notice": RuleParams["min-notice"],
  "max-advance": RuleParams["max-advance"],
  "patient-eligibility-returning": z.strictObject({}),
  "patient-eligibility-referral": z.strictObject({}),
  "patient-daily-limit": RuleParams["patient-daily-limit"],
  "request-practitioner": RuleParams["request-practitioner"],
  "practitioner-skill": RuleParams["practitioner-skill"],
  "practitioner-hours": RuleParams["practitioner-hours"],
  "practitioner-unavailable": z.strictObject({}),
  "practitioner-busy": z.strictObject({}),
  "practitioner-buffer": z.strictObject({ bufferMin: NonnegativeSchema }),
  "practitioner-daily-cap": RuleParams["practitioner-daily-cap"],
  "room-maintenance": z.strictObject({}),
  "room-busy": z.strictObject({}),
  "room-turnover": z.strictObject({ turnoverMin: NonnegativeSchema }),
  "equipment-maintenance": z.strictObject({}),
  "equipment-busy": z.strictObject({}),
  "resource-missing": RuleParams["resource-missing"],
  "resource-unavailable": z.strictObject({}),
};
const publicVariant = <T extends keyof typeof publicParams>(ruleId: T) =>
  z.strictObject({
    ...publicBase,
    ruleId: z.literal(ruleId),
    params: publicParams[ruleId],
  });
export const PublicFactSchema = z.discriminatedUnion("ruleId", [
  publicVariant("clinic-closed-day"),
  publicVariant("clinic-hours"),
  publicVariant("min-notice"),
  publicVariant("max-advance"),
  publicVariant("patient-eligibility-returning"),
  publicVariant("patient-eligibility-referral"),
  publicVariant("patient-daily-limit"),
  publicVariant("request-practitioner"),
  publicVariant("practitioner-skill"),
  publicVariant("practitioner-hours"),
  publicVariant("practitioner-unavailable"),
  publicVariant("practitioner-busy"),
  publicVariant("practitioner-buffer"),
  publicVariant("practitioner-daily-cap"),
  publicVariant("room-maintenance"),
  publicVariant("room-busy"),
  publicVariant("room-turnover"),
  publicVariant("equipment-maintenance"),
  publicVariant("equipment-busy"),
  publicVariant("resource-missing"),
  publicVariant("resource-unavailable"),
]);
export const PublicGroupSchema = z.strictObject({
  id: z.string().regex(/^group-[1-9]\d*$/),
  kind: z.enum(["request", "practitioner", "capability-context", "resources"]),
  practitionerId: IdSchema.optional(),
  factIds: z.array(PublicFactIdSchema).min(1),
});
export const PatientExplanationSchema = z
  .strictObject({
    basis: z.enum(["matrix", "missing_resource"]),
    primary: z.array(PublicFactIdSchema).min(1),
    groups: z.array(PublicGroupSchema),
    facts: z.array(PublicFactSchema).min(1),
  })
  .superRefine((value, ctx) => {
    checkReferences(
      value.facts.map((f) => f.id),
      [
        ...value.primary.map((id, i) => ({ id, path: ["primary", i] })),
        ...value.groups.flatMap((g, i) =>
          g.factIds.map((id, j) => ({ id, path: ["groups", i, "factIds", j] })),
        ),
      ],
      ctx,
    );
    if (
      value.basis === "missing_resource" &&
      (value.primary.length !== 1 ||
        value.facts.length !== 1 ||
        value.facts[0]?.ruleId !== "resource-missing")
    )
      ctx.addIssue({
        code: "custom",
        message: "Structural explanation requires one missing-resource fact",
      });
  });
export const PatientAssignmentSchema = z
  .strictObject({ practitionerId: IdSchema, start: MinuteSchema, end: MinuteSchema })
  .refine(({ start, end }) => start < end, { path: ["end"], message: "End must follow start" });
export const PatientAlternativeSchema = z.strictObject({
  assignment: PatientAssignmentSchema,
  category: AlternativeCategorySchema,
  cost: z.number().nonnegative(),
  changes: z.array(RequestChangeSchema).min(1),
});
// Codes and fields are allowlisted; arbitrary staff diagnostic text/paths never enter public errors.
export const PatientValidationIssueSchema = z.strictObject({
  code: z.enum([
    "invalid_snapshot",
    "invalid_request",
    "unknown_reference",
    "off_grid",
    "outside_coverage",
    "unsupported_wall_time",
  ]),
  field: z.enum([
    "request",
    "snapshot",
    "patientId",
    "serviceId",
    "practitionerId",
    "start",
    "fromDate",
    "days",
  ]),
});
export const PatientEvaluationSchema = z
  .discriminatedUnion("status", [
    z.strictObject({
      status: z.literal("invalid_request"),
      errors: z.array(PatientValidationIssueSchema).min(1),
    }),
    z.strictObject({
      status: z.literal("bookable"),
      assignment: PatientAssignmentSchema,
      meta: MetaSchema,
    }),
    z.strictObject({
      status: z.literal("blocked"),
      explanation: PatientExplanationSchema,
      alternatives: z.array(PatientAlternativeSchema),
      search: SearchReportSchema,
      meta: MetaSchema,
    }),
  ])
  .superRefine((value, ctx) => {
    if (
      value.status === "blocked" &&
      value.alternatives.length > 0 &&
      (value.search.status === "disabled" || value.explanation.basis === "missing_resource")
    )
      ctx.addIssue({
        code: "custom",
        path: ["alternatives"],
        message: "Disabled search cannot return alternatives",
      });
  });
export const RangeRequestSchema = z.strictObject({
  patientId: IdSchema,
  serviceId: IdSchema,
  practitionerId: IdSchema.optional(),
  fromDate: DateSchema,
  days: z.number().int().min(1).max(7),
});
export type PublicFact = z.infer<typeof PublicFactSchema>;
export type PatientExplanation = z.infer<typeof PatientExplanationSchema>;
export type PatientEvaluation = z.infer<typeof PatientEvaluationSchema>;
export type PatientAlternative = z.infer<typeof PatientAlternativeSchema>;
export type RangeRequest = z.infer<typeof RangeRequestSchema>;
