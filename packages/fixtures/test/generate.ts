import fc from "fast-check";
import type { Booking, ClinicSnapshot } from "@whynot/contracts";
import { buildMinimalSnapshot, demoNow } from "../src/builders.js";

/** Random schema-valid snapshots, intentionally separate from authored scenario fixtures. */
export const snapshotArbitrary: fc.Arbitrary<ClinicSnapshot> = fc
  .record({
    practitioners: fc.integer({ min: 0, max: 8 }),
    rooms: fc.integer({ min: 0, max: 6 }),
    equipment: fc.integer({ min: 0, max: 3 }),
    zone: fc.constantFrom("Europe/London", "Asia/Kolkata"),
    grid: fc.constantFrom(10, 15, 30, 45, 60),
    duration: fc.integer({ min: 1, max: 90 }),
    notice: fc.integer({ min: 0, max: 240 }),
    advance: fc.integer({ min: 0, max: 30 }),
    limit: fc.integer({ min: 0, max: 5 }),
    cap: fc.integer({ min: 0, max: 8 }),
    hours: fc.array(
      fc.record({
        weekday: fc.integer({ min: 1, max: 7 }),
        from: fc.constantFrom("00:00", "08:00", "10:00"),
        to: fc.constantFrom("12:00", "18:00", "24:00"),
      }),
      { maxLength: 7 },
    ),
    bookings: fc.array(
      fc.record({
        offset: fc.integer({ min: 0, max: 10080 }),
        practitioner: fc.nat({ max: 7 }),
        room: fc.nat({ max: 5 }),
        equipment: fc.nat({ max: 2 }),
        status: fc.constantFrom("confirmed", "cancelled"),
      }),
      { maxLength: 16 },
    ),
  })
  .map((generated) => {
    const base = buildMinimalSnapshot();
    const practitioners = Array.from({ length: generated.practitioners }, (_, index) => ({
      ...base.practitioners[0]!,
      id: `practitioner-${index}`,
      dailyCap: generated.cap,
      workingHours: generated.hours,
    }));
    const rooms = Array.from({ length: generated.rooms }, (_, index) => ({
      id: `room-${index}`,
      displayName: `Test Room ${index}`,
      capabilities: [],
      maintenance: [],
    }));
    const equipment = Array.from({ length: generated.equipment }, (_, index) => ({
      id: `equipment-${index}`,
      displayName: `Test Unit ${index}`,
      type: "test-unit",
      maintenance: [],
    }));
    const bookings: Booking[] =
      practitioners.length === 0 || rooms.length === 0
        ? []
        : generated.bookings.map((booking, index) => ({
            id: `booking-${index}`,
            patientId: "patient-test",
            serviceId: "consult",
            practitionerId: practitioners[booking.practitioner % practitioners.length]!.id,
            roomId: rooms[booking.room % rooms.length]!.id,
            ...(equipment.length === 0
              ? {}
              : { equipmentId: equipment[booking.equipment % equipment.length]!.id }),
            start: demoNow + booking.offset,
            end: demoNow + booking.offset + generated.duration,
            status: booking.status,
          }));
    return {
      ...base,
      clinic: {
        ...base.clinic,
        timezone: generated.zone,
        slotGridMinutes: generated.grid,
        openingHours: generated.hours,
      },
      practitioners,
      rooms,
      equipment,
      bookings,
      services: base.services.map((service) => ({ ...service, durationMin: generated.duration })),
      policy: {
        ...base.policy,
        minNoticeMin: generated.notice,
        maxAdvanceDays: generated.advance,
        patientMaxBookingsPerDay: generated.limit,
      },
    };
  });

/** Reproduce random test cases from a reported fast-check seed, never from a real clock. */
export function generateSnapshots(seed: number, count: number): ClinicSnapshot[] {
  return fc.sample(snapshotArbitrary, { seed, numRuns: count });
}
