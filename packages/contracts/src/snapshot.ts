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
} from "./primitives.js";

export const ClinicSchema = z.strictObject({
  id: IdSchema,
  name: IdSchema,
  timezone: z.string().refine((value) => {
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
    const ids = Object.fromEntries(
      Object.entries(collections).map(([key, entries]) => [key, new Set(entries.map((e) => e.id))]),
    );
    const unique = (entries: { id: string }[], path: (string | number)[]) => {
      const seen = new Set<string>();
      entries.forEach((entry, index) => {
        if (seen.has(entry.id))
          ctx.addIssue({ code: "custom", path: [...path, index, "id"], message: "Duplicate ID" });
        seen.add(entry.id);
      });
    };
    Object.entries(collections).forEach(([key, entries]) => unique(entries, [key]));
    snapshot.practitioners.forEach((p, i) => unique(p.timeOff, ["practitioners", i, "timeOff"]));
    snapshot.rooms.forEach((r, i) => unique(r.maintenance, ["rooms", i, "maintenance"]));
    snapshot.equipment.forEach((e, i) => unique(e.maintenance, ["equipment", i, "maintenance"]));
    const reference = (collection: string, id: string, path: (string | number)[]) => {
      if (!ids[collection]?.has(id))
        ctx.addIssue({ code: "custom", path, message: `Unknown ${collection} reference` });
    };
    snapshot.bookings.forEach((b, i) => {
      for (const [field, collection] of [
        ["patientId", "patients"],
        ["serviceId", "services"],
        ["practitionerId", "practitioners"],
        ["roomId", "rooms"],
        ["equipmentId", "equipment"],
      ] as const) {
        const id = b[field];
        if (id !== undefined) reference(collection, id, ["bookings", i, field]);
      }
    });
    snapshot.patients.forEach((p, i) =>
      p.referrals.forEach((id, j) => reference("services", id, ["patients", i, "referrals", j])),
    );
  });
export const SyntheticSnapshotEnvelopeSchema = z.strictObject({
  schemaVersion: SchemaVersionSchema,
  snapshot: ClinicSnapshotSchema,
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
