import {
  ClinicSnapshotSchema,
  DateSchema,
  IntervalSchema,
  MinuteSchema,
  ServiceSchema,
  type ClinicSnapshot,
} from "@whynot/contracts";
import { intervalContains } from "@whynot/engine";
import { eq, sql } from "drizzle-orm";
import type { DemoClock } from "../clock/demoClock.js";
import type { Database } from "../db/database.js";
import * as tables from "../db/schema.js";
import { loadBookings } from "./loadBookings.js";

type LoadedSnapshot = {
  snapshot: ClinicSnapshot;
  clock: DemoClock;
  demoWindow: ClinicSnapshot["coverage"];
};

/** Load current inputs from one caller-owned transaction, including the active policy. */
export async function loadSnapshot(
  tx: Database,
  window?: ClinicSnapshot["coverage"],
): Promise<LoadedSnapshot> {
  const [row] = await tx
    .select({ clinic: tables.clinics, version: tables.policyVersions })
    .from(tables.clinics)
    .innerJoin(
      tables.policyVersions,
      eq(tables.clinics.activePolicyVersionId, tables.policyVersions.id),
    );
  if (row === undefined) throw new Error("Demo clinic has not been seeded");
  const { id, name, timezone, slotGridMinutes, openingHours, closedDates, demoDate, demoNow } =
    row.clinic;
  const available = IntervalSchema.parse({
    from: row.clinic.coverageFrom,
    to: row.clinic.coverageTo,
  });
  const coverage = window === undefined ? available : IntervalSchema.parse(window);
  if (!intervalContains(available, coverage))
    throw new Error("Snapshot window exceeds stored coverage");
  const demoWindow = IntervalSchema.parse({
    from: row.clinic.demoWindowFrom,
    to: row.clinic.demoWindowTo,
  });
  const clock = { date: DateSchema.parse(demoDate), now: MinuteSchema.parse(demoNow) };
  const resources = await loadResources(tx, row.version.content);
  const bookings = await loadBookings(tx, coverage, timezone, resources.services);

  const snapshot = ClinicSnapshotSchema.parse({
    clinic: { id, name, timezone, slotGridMinutes, openingHours, closedDates },
    coverage,
    ...resources,
    bookings,
    policy: { ...row.version.content.policy, versionId: row.version.id },
  });
  return { snapshot, clock, demoWindow };
}

async function loadResources(tx: Database, content: tables.PolicyVersionContent) {
  const practitioners = await tx
    .select()
    .from(tables.practitioners)
    .orderBy(sql`${tables.practitioners.id} collate "C"`);
  const rooms = await tx
    .select()
    .from(tables.rooms)
    .orderBy(sql`${tables.rooms.id} collate "C"`);
  const equipment = await tx
    .select()
    .from(tables.equipment)
    .orderBy(sql`${tables.equipment.id} collate "C"`);
  const services = await tx
    .select()
    .from(tables.services)
    .orderBy(sql`${tables.services.id} collate "C"`);
  const patients = await tx
    .select()
    .from(tables.patients)
    .orderBy(sql`${tables.patients.id} collate "C"`);
  const referrals = groupByOwner(
    (
      await tx
        .select()
        .from(tables.referrals)
        .orderBy(sql`${tables.referrals.serviceId} collate "C"`)
    ).map(({ patientId, serviceId }) => [patientId, serviceId] as const),
  );
  const timeOff = groupByOwner(
    (
      await tx
        .select()
        .from(tables.practitionerTimeOff)
        .orderBy(sql`${tables.practitionerTimeOff.id} collate "C"`)
    ).map(({ practitionerId, ...entry }) => [practitionerId, entry] as const),
  );
  const roomMaintenance = groupByOwner(
    (
      await tx
        .select()
        .from(tables.roomMaintenance)
        .orderBy(sql`${tables.roomMaintenance.id} collate "C"`)
    ).map(({ roomId, ...entry }) => [roomId, entry] as const),
  );
  const equipmentMaintenance = groupByOwner(
    (
      await tx
        .select()
        .from(tables.equipmentMaintenance)
        .orderBy(sql`${tables.equipmentMaintenance.id} collate "C"`)
    ).map(({ equipmentId, ...entry }) => [equipmentId, entry] as const),
  );

  return {
    practitioners: practitioners.map((practitioner) => ({
      ...practitioner,
      timeOff: timeOff.get(practitioner.id) ?? [],
      ...(Object.hasOwn(content.practitionerCaps, practitioner.id)
        ? { dailyCap: content.practitionerCaps[practitioner.id] }
        : {}),
    })),
    rooms: rooms.map((room) => ({ ...room, maintenance: roomMaintenance.get(room.id) ?? [] })),
    equipment: equipment.map((unit) => ({
      ...unit,
      maintenance: equipmentMaintenance.get(unit.id) ?? [],
    })),
    services: services.map(({ requiredRoomCapability, requiredEquipmentType, ...service }) => {
      if (!Object.hasOwn(content.serviceSettings, service.id))
        throw new Error("Active policy is missing service settings");
      const settings = content.serviceSettings[service.id]!;
      return ServiceSchema.parse({
        ...service,
        ...(requiredRoomCapability === null ? {} : { requiredRoomCapability }),
        ...(requiredEquipmentType === null ? {} : { requiredEquipmentType }),
        bufferAfterMin: settings.bufferAfterMin,
        roomTurnoverMin: settings.roomTurnoverMin,
        eligibility: settings.eligibility,
      });
    }),
    patients: patients.map((patient) => ({
      ...patient,
      referrals: referrals.get(patient.id) ?? [],
    })),
  };
}

function groupByOwner<T>(entries: ReadonlyArray<readonly [string, T]>): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const [id, value] of entries) {
    const group = groups.get(id);
    if (group === undefined) groups.set(id, [value]);
    else group.push(value);
  }
  return groups;
}
