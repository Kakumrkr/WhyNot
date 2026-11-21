import { createHash } from "node:crypto";
import {
  ClinicSnapshotSchema,
  DateSchema,
  IntervalSchema,
  MinuteSchema,
  type ClinicSnapshot,
} from "@whynot/contracts";
import { intervalContains } from "@whynot/engine";
import { buildRiverside } from "@whynot/fixtures";
import { demoClock, type DemoClock } from "../clock/demoClock.js";
import type { Database } from "../db/database.js";
import { policyVersion } from "../db/policyVersion.js";
import * as tables from "../db/schema.js";
import { riversideSearchCoverage } from "./searchCoverage.js";

type SeedResult = "seeded" | "already_seeded";

/** Seed the base clinic once, preserving bookings and active policy on subsequent calls. */
export function seedRiverside(db: Database, clock = demoClock()): Promise<SeedResult> {
  const snapshot = buildRiverside(clock.date);
  return seedSnapshot(db, snapshot, clock, riversideSearchCoverage(snapshot, clock.now));
}

/** Restore Riverside bookings and base policy inside a caller-owned reset transaction. */
export async function resetRiverside(tx: Database): Promise<void> {
  const [clinic] = await tx.select().from(tables.clinics).for("update");
  if (clinic === undefined) throw new Error("Demo clinic has not been seeded");
  const clock = demoClock(clinic.demoDate);
  const snapshot = buildRiverside(clock.date);
  if (
    clinic.id !== snapshot.clinic.id ||
    clinic.demoNow !== clock.now ||
    clinic.demoWindowFrom !== snapshot.coverage.from ||
    clinic.demoWindowTo !== snapshot.coverage.to
  )
    throw new Error("Reset requires the initialized Riverside demo");
  // Historical inputs and policy versions are immutable. Only live state is restored.
  await tx.delete(tables.bookings);
  await insertActivity(tx, snapshot, clock.now);
  await tx.update(tables.clinics).set({ activePolicyVersionId: snapshot.policy.versionId });
}

/** Initialize an empty demo database from exactly one validated fixture snapshot. */
export async function seedSnapshot(
  db: Database,
  input: ClinicSnapshot,
  clock: DemoClock,
  searchCoverage = input.coverage,
): Promise<SeedResult> {
  const snapshot = ClinicSnapshotSchema.parse(input);
  const coverage = IntervalSchema.parse(searchCoverage);
  if (!intervalContains(coverage, snapshot.coverage))
    throw new Error("Search coverage must contain the demo window");
  const date = DateSchema.parse(clock.date);
  const now = MinuteSchema.parse(clock.now);
  if (now < snapshot.coverage.from || now >= snapshot.coverage.to)
    throw new Error("Demo clock must fall within fixture coverage");

  return db.transaction(async (tx) => {
    // Claim the singleton before writing child rows. The policy reference is checked at commit.
    const inserted = await tx
      .insert(tables.clinics)
      .values({
        ...snapshot.clinic,
        demoDate: date,
        demoNow: now,
        coverageFrom: coverage.from,
        coverageTo: coverage.to,
        demoWindowFrom: snapshot.coverage.from,
        demoWindowTo: snapshot.coverage.to,
        activePolicyVersionId: snapshot.policy.versionId,
      })
      .onConflictDoNothing()
      .returning({ id: tables.clinics.id });
    if (inserted.length === 0) {
      const [existing] = await tx.select().from(tables.clinics);
      if (
        existing === undefined ||
        existing.id !== snapshot.clinic.id ||
        existing.demoDate !== date ||
        existing.demoNow !== now ||
        existing.coverageFrom !== coverage.from ||
        existing.coverageTo !== coverage.to ||
        existing.demoWindowFrom !== snapshot.coverage.from ||
        existing.demoWindowTo !== snapshot.coverage.to
      )
        throw new Error("Database is initialized for a different demo clinic or clock");
      return "already_seeded";
    }
    await tx.insert(tables.policyVersions).values(policyVersion(snapshot));
    await insertResources(tx, snapshot);
    await insertActivity(tx, snapshot, now);
    return "seeded";
  });
}

async function insertResources(tx: Database, snapshot: ClinicSnapshot): Promise<void> {
  const { practitioners, rooms, equipment, services, patients } = snapshot;
  if (practitioners.length > 0) await tx.insert(tables.practitioners).values(practitioners);
  if (rooms.length > 0) await tx.insert(tables.rooms).values(rooms);
  if (equipment.length > 0) await tx.insert(tables.equipment).values(equipment);
  if (services.length > 0) await tx.insert(tables.services).values(services);
  if (patients.length > 0) await tx.insert(tables.patients).values(patients);

  const timeOff = practitioners.flatMap(({ id, timeOff }) =>
    timeOff.map((entry) => ({ ...entry, practitionerId: id })),
  );
  const roomMaintenance = rooms.flatMap(({ id, maintenance }) =>
    maintenance.map((entry) => ({ ...entry, roomId: id })),
  );
  const equipmentMaintenance = equipment.flatMap(({ id, maintenance }) =>
    maintenance.map((entry) => ({ ...entry, equipmentId: id })),
  );
  const referrals = patients.flatMap(({ id, referrals }) =>
    referrals.map((serviceId) => ({ patientId: id, serviceId })),
  );
  if (timeOff.length > 0) await tx.insert(tables.practitionerTimeOff).values(timeOff);
  if (roomMaintenance.length > 0) await tx.insert(tables.roomMaintenance).values(roomMaintenance);
  if (equipmentMaintenance.length > 0)
    await tx.insert(tables.equipmentMaintenance).values(equipmentMaintenance);
  if (referrals.length > 0) await tx.insert(tables.referrals).values(referrals);
}

async function insertActivity(tx: Database, snapshot: ClinicSnapshot, now: number): Promise<void> {
  if (snapshot.bookings.length === 0) return;
  await tx.insert(tables.bookings).values(
    snapshot.bookings.map((booking) => ({
      ...booking,
      cancellationId: createHash("sha256")
        .update(`riverside-cancellation:${booking.id}`)
        .digest("hex"),
      createdAt: now,
      cancelledAt: booking.status === "cancelled" ? now : null,
    })),
  );
}
