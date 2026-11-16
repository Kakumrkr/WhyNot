import { z } from "zod";
import {
  IdSchema,
  NonnegativeSchema,
  PositiveSchema,
  DateSchema,
  IntervalSchema,
  ClockSchema,
} from "./primitives.js";

export const RuleIdSchema = z.enum([
  "clinic-closed-day",
  "clinic-hours",
  "min-notice",
  "max-advance",
  "patient-eligibility-returning",
  "patient-eligibility-referral",
  "patient-daily-limit",
  "request-practitioner",
  "practitioner-skill",
  "practitioner-hours",
  "practitioner-break",
  "practitioner-time-off",
  "practitioner-busy",
  "practitioner-buffer",
  "practitioner-daily-cap",
  "room-capability",
  "room-maintenance",
  "room-busy",
  "room-turnover",
  "equipment-type",
  "equipment-maintenance",
  "equipment-busy",
  "resource-missing",
]);
export const PublicRuleIdSchema = z.enum([
  "clinic-closed-day",
  "clinic-hours",
  "min-notice",
  "max-advance",
  "patient-eligibility-returning",
  "patient-eligibility-referral",
  "patient-daily-limit",
  "request-practitioner",
  "practitioner-skill",
  "practitioner-hours",
  "practitioner-unavailable",
  "practitioner-busy",
  "practitioner-buffer",
  "practitioner-daily-cap",
  "room-maintenance",
  "room-busy",
  "room-turnover",
  "equipment-maintenance",
  "equipment-busy",
  "resource-missing",
  "resource-unavailable",
]);
export const RuleKindSchema = z.enum([
  "availability",
  "timing-policy",
  "patient",
  "preference",
  "capability",
  "occupancy",
  "policy",
]);
export const VisibilitySchema = z.enum(["public", "staff"]);
export const RelaxableBySchema = z.array(z.enum(["patient", "admin"]));
export const SubjectSchema = z.strictObject({
  type: z.enum(["clinic", "patient", "request", "practitioner", "room", "equipment"]),
  id: IdSchema,
});

// Rule-specific parameter schemas prevent arbitrary payloads entering later projection/templates.
const dateParams = z.strictObject({ date: DateSchema });
const emptyParams = z.strictObject({});
const limitParams = z.strictObject({
  date: DateSchema,
  count: NonnegativeSchema,
  limit: NonnegativeSchema,
});
const bookingParams = z.strictObject({ bookingId: IdSchema });
export const RuleParams = {
  "clinic-closed-day": dateParams,
  "clinic-hours": dateParams,
  "min-notice": z.strictObject({
    requiredMin: NonnegativeSchema,
    actualMin: z.number().int().safe(),
  }),
  "max-advance": z.strictObject({
    maxAdvanceDays: NonnegativeSchema,
    actualMin: z.number().int().safe(),
  }),
  "patient-eligibility-returning": emptyParams,
  "patient-eligibility-referral": z.strictObject({ serviceId: IdSchema }),
  "patient-daily-limit": limitParams,
  "request-practitioner": z.strictObject({ practitionerId: IdSchema }),
  "practitioner-skill": z.strictObject({ requiredSkill: IdSchema }),
  "practitioner-hours": dateParams,
  "practitioner-break": z
    .strictObject({ date: DateSchema, from: ClockSchema, to: ClockSchema })
    .refine(({ from, to }) => from < to, { path: ["to"], message: "Invalid break interval" }),
  "practitioner-time-off": z.strictObject({ timeOffId: IdSchema, reason: z.string() }),
  "practitioner-busy": bookingParams,
  "practitioner-buffer": bookingParams.extend({
    serviceId: IdSchema,
    bufferMin: NonnegativeSchema,
  }),
  "practitioner-daily-cap": limitParams,
  "room-capability": z.strictObject({ requiredCapability: IdSchema }),
  "room-maintenance": z.strictObject({ windowId: IdSchema }),
  "room-busy": bookingParams,
  "room-turnover": bookingParams.extend({ serviceId: IdSchema, turnoverMin: NonnegativeSchema }),
  "equipment-type": z.strictObject({ requiredType: IdSchema }),
  "equipment-maintenance": z.strictObject({ windowId: IdSchema }),
  "equipment-busy": bookingParams,
  "resource-missing": z.strictObject({ dimension: z.enum(["practitioner", "room", "equipment"]) }),
} satisfies Record<z.infer<typeof RuleIdSchema>, z.ZodType>;

const factBase = {
  id: IdSchema,
  ruleVersion: PositiveSchema,
  kind: RuleKindSchema,
  subject: SubjectSchema,
  window: IntervalSchema.optional(),
  visibility: VisibilitySchema,
  relaxableBy: RelaxableBySchema,
};
const factVariant = <T extends keyof typeof RuleParams>(ruleId: T) =>
  z.strictObject({
    ...factBase,
    ruleId: z.literal(ruleId),
    params: RuleParams[ruleId],
  });
export const FactSchema = z.discriminatedUnion("ruleId", [
  factVariant("clinic-closed-day"),
  factVariant("clinic-hours"),
  factVariant("min-notice"),
  factVariant("max-advance"),
  factVariant("patient-eligibility-returning"),
  factVariant("patient-eligibility-referral"),
  factVariant("patient-daily-limit"),
  factVariant("request-practitioner"),
  factVariant("practitioner-skill"),
  factVariant("practitioner-hours"),
  factVariant("practitioner-break"),
  factVariant("practitioner-time-off"),
  factVariant("practitioner-busy"),
  factVariant("practitioner-buffer"),
  factVariant("practitioner-daily-cap"),
  factVariant("room-capability"),
  factVariant("room-maintenance"),
  factVariant("room-busy"),
  factVariant("room-turnover"),
  factVariant("equipment-type"),
  factVariant("equipment-maintenance"),
  factVariant("equipment-busy"),
  factVariant("resource-missing"),
]);
export const RuleSchema = z.strictObject({
  id: RuleIdSchema,
  version: PositiveSchema,
  family: RuleKindSchema,
  weight: PositiveSchema,
  visibility: VisibilitySchema,
  relaxableBy: RelaxableBySchema,
});
export type RuleId = z.infer<typeof RuleIdSchema>;
export type PublicRuleId = z.infer<typeof PublicRuleIdSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Fact = z.infer<typeof FactSchema>;
