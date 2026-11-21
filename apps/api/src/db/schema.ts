import type { Clinic, ClinicSnapshot } from "@whynot/contracts";
import type { PolicyVersionContent } from "@whynot/contracts/api";
import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const minute = (name: string) => bigint(name, { mode: "number" });

export const policyVersions = pgTable("policy_versions", {
  id: text().primaryKey(),
  content: jsonb().$type<PolicyVersionContent>().notNull(),
});

export const clinics = pgTable("clinics", {
  singleton: boolean().primaryKey().default(true),
  id: text().notNull().unique(),
  name: text().notNull(),
  timezone: text().notNull(),
  slotGridMinutes: minute("slot_grid_minutes").notNull(),
  openingHours: jsonb("opening_hours").$type<Clinic["openingHours"]>().notNull(),
  closedDates: jsonb("closed_dates").$type<Clinic["closedDates"]>().notNull(),
  demoDate: text("demo_date").notNull(),
  demoNow: minute("demo_now").notNull(),
  coverageFrom: minute("coverage_from").notNull(),
  coverageTo: minute("coverage_to").notNull(),
  demoWindowFrom: minute("demo_window_from").notNull(),
  demoWindowTo: minute("demo_window_to").notNull(),
  activePolicyVersionId: text("active_policy_version_id")
    .notNull()
    .references(() => policyVersions.id),
});

export const practitioners = pgTable("practitioners", {
  id: text().primaryKey(),
  displayName: text("display_name").notNull(),
  role: text().notNull(),
  skills: text().array().notNull(),
  workingHours: jsonb("working_hours").$type<Clinic["openingHours"]>().notNull(),
  breaks: jsonb().$type<Clinic["openingHours"]>().notNull(),
});

export const rooms = pgTable("rooms", {
  id: text().primaryKey(),
  displayName: text("display_name").notNull(),
  capabilities: text().array().notNull(),
});

export const equipment = pgTable("equipment", {
  id: text().primaryKey(),
  displayName: text("display_name").notNull(),
  type: text().notNull(),
});

export const services = pgTable("services", {
  id: text().primaryKey(),
  displayName: text("display_name").notNull(),
  durationMin: minute("duration_min").notNull(),
  requiredSkill: text("required_skill").notNull(),
  requiredRoomCapability: text("required_room_capability"),
  requiredEquipmentType: text("required_equipment_type"),
});

export const patients = pgTable("patients", {
  id: text().primaryKey(),
  displayName: text("display_name").notNull(),
  isReturning: boolean("is_returning").notNull(),
});

export const referrals = pgTable(
  "patient_referrals",
  {
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
  },
  (table) => [primaryKey({ columns: [table.patientId, table.serviceId] })],
);

const windowColumns = () => ({
  id: text().notNull(),
  from: minute("from_minute").notNull(),
  to: minute("to_minute").notNull(),
});

export const practitionerTimeOff = pgTable(
  "practitioner_time_off",
  {
    ...windowColumns(),
    practitionerId: text("practitioner_id")
      .notNull()
      .references(() => practitioners.id),
    reason: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.practitionerId, table.id] })],
);

export const roomMaintenance = pgTable(
  "room_maintenance",
  {
    ...windowColumns(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
  },
  (table) => [primaryKey({ columns: [table.roomId, table.id] })],
);

export const equipmentMaintenance = pgTable(
  "equipment_maintenance",
  {
    ...windowColumns(),
    equipmentId: text("equipment_id")
      .notNull()
      .references(() => equipment.id),
  },
  (table) => [primaryKey({ columns: [table.equipmentId, table.id] })],
);

export const bookingStatus = pgEnum("booking_status", ["confirmed", "cancelled"]);

export const bookings = pgTable("bookings", {
  id: text().primaryKey(),
  cancellationId: text("cancellation_id")
    .notNull()
    .default(sql`gen_random_uuid()::text`)
    .unique("bookings_cancellation_id_unique"),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id),
  practitionerId: text("practitioner_id")
    .notNull()
    .references(() => practitioners.id),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  equipmentId: text("equipment_id").references(() => equipment.id),
  start: minute("start_minute").notNull(),
  end: minute("end_minute").notNull(),
  status: bookingStatus().notNull(),
  createdAt: minute("created_at").notNull(),
  cancelledAt: minute("cancelled_at"),
});

export const evaluationKind = pgEnum("evaluation_kind", ["slot", "range"]);

export const evaluationInputs = pgTable("evaluation_inputs", {
  id: text().primaryKey(),
  kind: evaluationKind().notNull(),
  snapshot: jsonb().$type<ClinicSnapshot>().notNull(),
  request: jsonb().$type<unknown>().notNull(),
  now: minute("evaluated_at").notNull(),
  options: jsonb().$type<unknown>().notNull(),
  inputVersion: integer("input_version").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  engineVersion: text("engine_version").notNull(),
  policyVersionId: text("policy_version_id")
    .notNull()
    .references(() => policyVersions.id),
  result: jsonb().$type<unknown>().notNull(),
  durationMs: doublePrecision("duration_ms").notNull(),
});
