import { z } from "zod";
import { IdSchema, NonnegativeSchema, AssignmentSchema } from "./primitives.js";

export const PolicyChangeSchema = z.discriminatedUnion("entity", [
  z.strictObject({
    entity: z.literal("policy"),
    field: z.enum(["minNoticeMin", "maxAdvanceDays", "patientMaxBookingsPerDay"]),
    value: NonnegativeSchema,
  }),
  z.strictObject({
    entity: z.literal("practitioner"),
    id: IdSchema,
    field: z.literal("dailyCap"),
    value: NonnegativeSchema,
  }),
  z.discriminatedUnion("field", [
    z.strictObject({
      entity: z.literal("service"),
      id: IdSchema,
      field: z.enum(["bufferAfterMin", "roomTurnoverMin"]),
      value: NonnegativeSchema,
    }),
    z.strictObject({
      entity: z.literal("service"),
      id: IdSchema,
      field: z.literal("eligibility"),
      value: z.literal("any"),
    }),
  ]),
]);
export const PolicyPatchSchema = z
  .array(PolicyChangeSchema)
  .min(1)
  .superRefine((changes, ctx) => {
    const seen = new Set<string>();
    changes.forEach((change, index) => {
      const key = JSON.stringify([change.entity, "id" in change ? change.id : null, change.field]);
      if (seen.has(key))
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "Setting must be coalesced into one change",
        });
      seen.add(key);
    });
  });
export const AdminFixSchema = z.strictObject({
  factIds: z.array(IdSchema).min(1),
  changes: PolicyPatchSchema,
  viaCandidate: AssignmentSchema,
  cost: z.number().positive(),
});
export type PolicyChange = z.infer<typeof PolicyChangeSchema>;
export type PolicyPatch = z.infer<typeof PolicyPatchSchema>;
export type AdminFix = z.infer<typeof AdminFixSchema>;
