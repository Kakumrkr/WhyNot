import fc from "fast-check";
import type { Booking, ClinicSnapshot } from "@whynot/contracts";
import { resolveRecurringBoundary } from "@whynot/engine";
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
    eligibility: fc.constantFrom("any", "returning_only", "referral_required"),
    returning: fc.boolean(),
    referral: fc.boolean(),
    closed: fc.boolean(),
    equipmentRequired: fc.boolean(),
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
        closedDates: generated.closed ? ["2026-11-16"] : [],
      },
      practitioners,
      rooms,
      equipment,
      bookings,
      services: base.services.map((service) => ({
        ...service,
        durationMin: generated.duration,
        eligibility: generated.eligibility,
        ...(generated.equipmentRequired ? { requiredEquipmentType: "test-unit" } : {}),
      })),
      patients: base.patients.map((patient) => ({
        ...patient,
        isReturning: generated.returning,
        referrals: generated.referral ? ["consult"] : [],
      })),
      policy: {
        ...base.policy,
        minNoticeMin: generated.notice,
        maxAdvanceDays: generated.advance,
        patientMaxBookingsPerDay: generated.limit,
      },
    };
  });

/** Local-noon requests exercise every request rule, including absent resource pools. */
export const requestRuleCaseArbitrary = fc
  .tuple(snapshotArbitrary, fc.boolean(), fc.integer({ min: -60, max: 50000 }))
  .map(([snapshot, preferred, lead]) => {
    const start = resolveRecurringBoundary("2026-11-16", "12:00", snapshot.clinic.timezone);
    if (!start.ok) throw new Error("Authored generator date must resolve");
    const practitioner = snapshot.practitioners[0];
    return {
      snapshot,
      request: {
        patientId: "patient-test",
        serviceId: "consult",
        start: start.value,
        ...(preferred && practitioner !== undefined ? { practitionerId: practitioner.id } : {}),
      },
      now: start.value - lead,
    };
  });

/** Reproduce random test cases from a reported fast-check seed, never from a real clock. */
export function generateSnapshots(seed: number, count: number): ClinicSnapshot[] {
  return fc.sample(snapshotArbitrary, { seed, numRuns: count });
}

/** Resource cases retain variable/empty pools and put independent windows near the request. */
export const resourceRuleCaseArbitrary = fc
  .tuple(
    requestRuleCaseArbitrary,
    fc.record({
      qualified: fc.boolean(),
      capable: fc.boolean(),
      correctType: fc.boolean(),
      roomRequired: fc.boolean(),
      equipmentRequired: fc.boolean(),
      breakOn: fc.boolean(),
      leaveOn: fc.boolean(),
      maintenanceOn: fc.boolean(),
      buffer: fc.integer({ min: 0, max: 60 }),
      turnover: fc.integer({ min: 0, max: 60 }),
      existingBuffer: fc.integer({ min: 0, max: 60 }),
      existingTurnover: fc.integer({ min: 0, max: 60 }),
      bookings: fc.array(
        fc.record({
          offset: fc.integer({ min: -180, max: 180 }),
          duration: fc.integer({ min: 1, max: 240 }),
          cancelled: fc.boolean(),
        }),
        { maxLength: 10 },
      ),
    }),
  )
  .map(([testCase, generated]) => {
    const { snapshot, request } = testCase;
    const service = snapshot.services[0]!;
    service.bufferAfterMin = generated.buffer;
    service.roomTurnoverMin = generated.turnover;
    if (generated.roomRequired) service.requiredRoomCapability = "imaging";
    if (generated.equipmentRequired) service.requiredEquipmentType = "scanner";
    else delete service.requiredEquipmentType;
    snapshot.services.push({
      ...service,
      id: "existing",
      bufferAfterMin: generated.existingBuffer,
      roomTurnoverMin: generated.existingTurnover,
    });
    const window = { id: "window", from: request.start - 10, to: request.start + 10 };
    for (const practitioner of snapshot.practitioners) {
      practitioner.skills = generated.qualified ? ["consult"] : [];
      practitioner.breaks = generated.breakOn ? [{ weekday: 1, from: "12:00", to: "12:30" }] : [];
      practitioner.timeOff = generated.leaveOn ? [{ ...window, reason: "Synthetic leave" }] : [];
    }
    for (const room of snapshot.rooms) {
      room.capabilities = generated.capable ? ["imaging"] : [];
      room.maintenance = generated.maintenanceOn ? [window] : [];
    }
    for (const equipment of snapshot.equipment) {
      equipment.type = generated.correctType ? "scanner" : "other";
      equipment.maintenance = generated.maintenanceOn ? [window] : [];
    }
    snapshot.bookings =
      snapshot.practitioners.length === 0 || snapshot.rooms.length === 0
        ? []
        : generated.bookings.map((item, index) => ({
            id: `nearby-${index}`,
            patientId: request.patientId,
            serviceId: "existing",
            practitionerId: snapshot.practitioners[index % snapshot.practitioners.length]!.id,
            roomId: snapshot.rooms[index % snapshot.rooms.length]!.id,
            ...(snapshot.equipment.length === 0
              ? {}
              : { equipmentId: snapshot.equipment[index % snapshot.equipment.length]!.id }),
            start: request.start + item.offset,
            end: request.start + item.offset + item.duration,
            status: item.cancelled ? "cancelled" : "confirmed",
          }));
    return testCase;
  });
