import type { ClinicSnapshot } from "@whynot/contracts";
import { datedSchedule } from "@whynot/engine";
import { addLocalDays } from "@whynot/engine";

/** Deterministic synthetic load; reserve roughly 70% of usable service intervals.
 * This fixture generator has no runtime clock and is never an engine dependency.
 */
export function fillBackground(
  snapshot: ClinicSnapshot,
  demoDate: string,
  seed: number,
): ClinicSnapshot {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let day = 0; day < 6; day++) {
    const date = addLocalDays(demoDate, day);
    if (!date.ok) throw new Error("Invalid fixture date");
    for (const p of snapshot.practitioners) {
      const schedule = datedSchedule(p.workingHours, date.value, snapshot.clinic.timezone);
      const breaks = datedSchedule(p.breaks, date.value, snapshot.clinic.timezone);
      if (!schedule.ok || !breaks.ok) throw new Error("Unsupported fixture schedule");
      let count = 0;
      for (const hours of schedule.value) {
        for (let start = hours.from; start < hours.to; start += 15) {
          if (random() >= 0.7 || count >= (p.dailyCap ?? Infinity)) continue;
          const service = snapshot.services.find((s) => p.skills.includes(s.requiredSkill));
          if (service === undefined) throw new Error("Fixture practitioner has no service");
          const end = start + service.durationMin;
          if (
            end > hours.to ||
            [...breaks.value, ...p.timeOff].some((w) => w.from < end && start < w.to)
          )
            continue;
          const equipment =
            service.requiredEquipmentType === undefined
              ? undefined
              : snapshot.equipment.find((e) => e.type === service.requiredEquipmentType);
          if (service.requiredEquipmentType !== undefined && equipment === undefined) continue;
          if (equipment?.maintenance.some((w) => w.from < end && start < w.to)) continue;
          const room = snapshot.rooms.find(
            (r) =>
              (service.requiredRoomCapability === undefined ||
                r.capabilities.includes(service.requiredRoomCapability)) &&
              !r.maintenance.some((w) => w.from < end && start < w.to) &&
              !snapshot.bookings.some((b) => {
                const existing = snapshot.services.find((s) => s.id === b.serviceId)!;
                return (
                  (b.practitionerId === p.id &&
                    b.start < end + service.bufferAfterMin &&
                    start < b.end + existing.bufferAfterMin) ||
                  (b.roomId === r.id &&
                    b.start < end + service.roomTurnoverMin &&
                    start < b.end + existing.roomTurnoverMin) ||
                  (equipment !== undefined &&
                    b.equipmentId === equipment.id &&
                    b.start < end &&
                    start < b.end)
                );
              }),
          );
          if (room === undefined) continue;
          snapshot.bookings.push({
            id: `background-${snapshot.bookings.length}`,
            patientId: `patient-${2 + (snapshot.bookings.length % 10)}`,
            serviceId: service.id,
            practitionerId: p.id,
            roomId: room.id,
            ...(equipment === undefined ? {} : { equipmentId: equipment.id }),
            start,
            end,
            status: "confirmed",
          });
          count++;
          start += Math.ceil((service.durationMin + service.bufferAfterMin) / 15) * 15 - 15;
        }
      }
    }
  }
  return snapshot;
}
