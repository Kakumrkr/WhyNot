import { z } from "zod";
import {
  IdSchema,
  MinuteSchema,
  NonnegativeSchema,
  PositiveSchema,
  DateSchema,
  WeeklyHoursSchema,
  WindowSchema,
  IntervalSchema,
  SchemaVersionSchema,
  BookingRequestSchema,
  EvaluateOptionsSchema,
} from "./primitives.js";

// Native canonical identifiers are already supported. Keep aliases and older
// runtimes on the formatter path so this optimization does not narrow acceptance.
const canonicalTimeZones: ReadonlySet<string> = new Set(
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [],
);

export const ClinicSchema = z.strictObject({
  id: IdSchema,
  name: IdSchema,
  timezone: z.string().refine((value) => {
    if (canonicalTimeZones.has(value)) return true;
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Unknown timezone"),
  slotGridMinutes: PositiveSchema,
  openingHours: WeeklyHoursSchema,
  closedDates: z.array(DateSchema),
});
export const PractitionerSchema = z.strictObject({
  id: IdSchema,
  displayName: IdSchema,
  role: IdSchema,
  skills: z.array(IdSchema),
  workingHours: WeeklyHoursSchema,
  breaks: WeeklyHoursSchema,
  timeOff: z.array(WindowSchema.safeExtend({ reason: z.string() })),
  dailyCap: NonnegativeSchema.optional(),
});
export const RoomSchema = z.strictObject({
  id: IdSchema,
  displayName: IdSchema,
  capabilities: z.array(IdSchema),
  maintenance: z.array(WindowSchema),
});
export const EquipmentSchema = z.strictObject({
  id: IdSchema,
  displayName: IdSchema,
  type: IdSchema,
  maintenance: z.array(WindowSchema),
});
export const ServiceSchema = z.strictObject({
  id: IdSchema,
  displayName: IdSchema,
  durationMin: PositiveSchema,
  requiredSkill: IdSchema,
  requiredRoomCapability: IdSchema.optional(),
  requiredEquipmentType: IdSchema.optional(),
  bufferAfterMin: NonnegativeSchema,
  roomTurnoverMin: NonnegativeSchema,
  eligibility: z.enum(["any", "returning_only", "referral_required"]),
});
export const PatientSchema = z.strictObject({
  id: IdSchema,
  displayName: IdSchema,
  isReturning: z.boolean(),
  referrals: z.array(IdSchema),
});
export const BookingSchema = z
  .strictObject({
    id: IdSchema,
    patientId: IdSchema,
    serviceId: IdSchema,
    practitionerId: IdSchema,
    roomId: IdSchema,
    equipmentId: IdSchema.optional(),
    start: MinuteSchema,
    end: MinuteSchema,
    status: z.enum(["confirmed", "cancelled"]),
  })
  .refine(({ start, end }) => start < end, { path: ["end"], message: "End must follow start" });
export const PolicySchema = z.strictObject({
  versionId: IdSchema,
  minNoticeMin: NonnegativeSchema,
  maxAdvanceDays: NonnegativeSchema,
  patientMaxBookingsPerDay: NonnegativeSchema,
  defaultDailyCap: NonnegativeSchema.optional(),
});
export const ClinicSnapshotSchema = z
  .strictObject({
    clinic: ClinicSchema,
    coverage: IntervalSchema,
    practitioners: z.array(PractitionerSchema),
    rooms: z.array(RoomSchema),
    equipment: z.array(EquipmentSchema),
    services: z.array(ServiceSchema),
    patients: z.array(PatientSchema),
    bookings: z.array(BookingSchema),
    policy: PolicySchema,
  })
  .superRefine((snapshot, ctx) => {
    const collections = {
      practitioners: snapshot.practitioners,
      rooms: snapshot.rooms,
      equipment: snapshot.equipment,
      services: snapshot.services,
      patients: snapshot.patients,
      bookings: snapshot.bookings,
    };
    const unique = (entries: { id: string }[], path: (string | number)[]) => {
      const seen = new Set<string>();
      entries.forEach((entry, index) => {
        if (seen.has(entry.id))
          ctx.addIssue({ code: "custom", path: [...path, index, "id"], message: "Duplicate ID" });
        seen.add(entry.id);
      });
      return seen;
    };
    const ids = Object.fromEntries(
      Object.entries(collections).map(([key, entries]) => [key, unique(entries, [key])]),
    );
    snapshot.practitioners.forEach((p, i) => unique(p.timeOff, ["practitioners", i, "timeOff"]));
    snapshot.rooms.forEach((r, i) => unique(r.maintenance, ["rooms", i, "maintenance"]));
    snapshot.equipment.forEach((e, i) => unique(e.maintenance, ["equipment", i, "maintenance"]));
    const bookingReferences = [
      ["patientId", "patients"],
      ["serviceId", "services"],
      ["practitionerId", "practitioners"],
      ["roomId", "rooms"],
      ["equipmentId", "equipment"],
    ] as const;
    snapshot.bookings.forEach((b, i) => {
      for (const [field, collection] of bookingReferences) {
        const id = b[field];
        if (id !== undefined && !ids[collection]!.has(id))
          ctx.addIssue({
            code: "custom",
            path: ["bookings", i, field],
            message: `Unknown ${collection} reference`,
          });
      }
    });
    snapshot.patients.forEach((p, i) =>
      p.referrals.forEach((id, j) => {
        if (!ids.services!.has(id))
          ctx.addIssue({
            code: "custom",
            path: ["patients", i, "referrals", j],
            message: "Unknown services reference",
          });
      }),
    );
  });
export const EvaluationInputSchema = z
  .strictObject({
    snapshot: ClinicSnapshotSchema,
    request: BookingRequestSchema,
    options: EvaluateOptionsSchema,
  })
  .superRefine(({ snapshot, request }, ctx) => {
    for (const [field, entries] of [
      ["patientId", snapshot.patients],
      ["serviceId", snapshot.services],
      ["practitionerId", snapshot.practitioners],
    ] as const) {
      const id = request[field];
      if (id !== undefined && !entries.some((entry) => entry.id === id))
        ctx.addIssue({
          code: "custom",
          path: ["request", field],
          message: "Unknown request reference",
        });
    }
    const service = snapshot.services.find((entry) => entry.id === request.serviceId);
    if (service !== undefined) {
      const end = request.start + service.durationMin;
      if (!Number.isSafeInteger(end))
        ctx.addIssue({
          code: "custom",
          path: ["request", "start"],
          message: "Appointment end overflows safe minute range",
        });
      else if (request.start < snapshot.coverage.from || end > snapshot.coverage.to)
        ctx.addIssue({
          code: "custom",
          path: ["request", "start"],
          message: "Appointment is outside snapshot coverage",
        });
    }
  });
// Only playground imports have these bounds; engine consumers may supply larger snapshots.
export const SyntheticClinicSnapshotSchema = ClinicSnapshotSchema.safeExtend({
  practitioners: z.array(PractitionerSchema).max(100),
  rooms: z.array(RoomSchema).max(100),
  equipment: z.array(EquipmentSchema).max(100),
  bookings: z.array(BookingSchema).max(5000),
}).superRefine((snapshot, ctx) => {
  const pairs = snapshot.practitioners.length * snapshot.rooms.length;
  snapshot.services.forEach((service, index) => {
    const combinations =
      pairs * (service.requiredEquipmentType === undefined ? 1 : snapshot.equipment.length);
    if (combinations > 20000)
      ctx.addIssue({
        code: "custom",
        path: ["services", index],
        message: "Import exceeds 20000 candidate combinations",
      });
  });
});
export const SyntheticSnapshotEnvelopeSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  snapshot: SyntheticClinicSnapshotSchema,
  now: MinuteSchema,
});
export type ClinicSnapshot = z.infer<typeof ClinicSnapshotSchema>;
export type Clinic = z.infer<typeof ClinicSchema>;
export type Practitioner = z.infer<typeof PractitionerSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type SyntheticSnapshotEnvelope = z.infer<typeof SyntheticSnapshotEnvelopeSchema>;
export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;
