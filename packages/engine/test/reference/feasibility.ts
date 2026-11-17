import { DateTime } from "luxon";
import type { Assignment, BookingRequest, ClinicSnapshot, WeeklyHours } from "@whynot/contracts";

type Window = { from: number; to: number };
const overlaps = (a: Window, b: Window) => a.from < b.to && b.from < a.to;

/** Deliberately naive specification oracle for validated inputs; no engine helpers or indexes. */
export function referenceRows(snapshot: ClinicSnapshot, request: BookingRequest, now: number) {
  const service = snapshot.services.find((s) => s.id === request.serviceId)!;
  const patient = snapshot.patients.find((p) => p.id === request.patientId)!;
  const zone = snapshot.clinic.timezone;
  const local = (minute: number) => DateTime.fromMillis(minute * 60000, { zone });
  const date = local(request.start).toISODate()!;
  const interval = { from: request.start, to: request.start + service.durationMin };
  const dates: string[] = [];
  for (
    let day = local(interval.from).startOf("day");
    day.toMillis() / 60000 < interval.to;
    day = day.plus({ days: 1 })
  )
    dates.push(day.toISODate()!);
  const schedule = (hours: WeeklyHours, day: string): Window[] => {
    const midnight = DateTime.fromISO(day, { zone });
    return hours
      .filter((h) => h.weekday === midnight.weekday)
      .map((h) => {
        const boundary = (clock: string) => {
          if (clock === "24:00") return midnight.plus({ days: 1 }).toMillis() / 60000;
          const [hour, minute] = clock.split(":").map(Number);
          return midnight.set({ hour, minute }).toMillis() / 60000;
        };
        return { from: boundary(h.from), to: boundary(h.to) };
      });
  };
  // Minute-by-minute coverage intentionally avoids the optimized merged-interval algorithm.
  const covers = (hours: Window[]) => {
    for (let minute = interval.from; minute < interval.to; minute++)
      if (!hours.some((h) => h.from <= minute && h.to >= minute + 1)) return false;
    return true;
  };
  const confirmed = snapshot.bookings.filter((b) => b.status === "confirmed");
  const global: string[] = [];
  if (
    dates.some(
      (d) =>
        snapshot.clinic.closedDates.includes(d) ||
        schedule(snapshot.clinic.openingHours, d).length === 0,
    )
  )
    global.push("clinic-closed-day");
  else if (!covers(dates.flatMap((d) => schedule(snapshot.clinic.openingHours, d))))
    global.push("clinic-hours");
  if (request.start - now < snapshot.policy.minNoticeMin) global.push("min-notice");
  if (request.start - now > snapshot.policy.maxAdvanceDays * 1440) global.push("max-advance");
  if (service.eligibility === "returning_only" && !patient.isReturning)
    global.push("patient-eligibility-returning");
  if (service.eligibility === "referral_required" && !patient.referrals.includes(service.id))
    global.push("patient-eligibility-referral");
  if (
    confirmed.filter((b) => b.patientId === patient.id && local(b.start).toISODate() === date)
      .length >= snapshot.policy.patientMaxBookingsPerDay
  )
    global.push("patient-daily-limit");
  const rows: { assignment: Assignment; rules: string[]; load: number }[] = [];
  for (const practitioner of snapshot.practitioners)
    for (const room of snapshot.rooms)
      for (const equipment of service.requiredEquipmentType === undefined
        ? [null]
        : snapshot.equipment) {
        const rules = [...global];
        if (request.practitionerId !== undefined && request.practitionerId !== practitioner.id)
          rules.push("request-practitioner");
        if (!practitioner.skills.includes(service.requiredSkill)) rules.push("practitioner-skill");
        if (!covers(dates.flatMap((d) => schedule(practitioner.workingHours, d))))
          rules.push("practitioner-hours");
        if (
          dates.flatMap((d) => schedule(practitioner.breaks, d)).some((w) => overlaps(w, interval))
        )
          rules.push("practitioner-break");
        if (practitioner.timeOff.some((w) => overlaps(w, interval)))
          rules.push("practitioner-time-off");
        const load = confirmed.filter(
          (b) => b.practitionerId === practitioner.id && local(b.start).toISODate() === date,
        ).length;
        const cap = practitioner.dailyCap ?? snapshot.policy.defaultDailyCap;
        if (cap !== undefined && load >= cap) rules.push("practitioner-daily-cap");
        if (
          service.requiredRoomCapability !== undefined &&
          !room.capabilities.includes(service.requiredRoomCapability)
        )
          rules.push("room-capability");
        if (room.maintenance.some((w) => overlaps(w, interval))) rules.push("room-maintenance");
        if (equipment !== null && equipment.type !== service.requiredEquipmentType)
          rules.push("equipment-type");
        if (equipment !== null && equipment.maintenance.some((w) => overlaps(w, interval)))
          rules.push("equipment-maintenance");
        for (const booking of confirmed) {
          const existing = snapshot.services.find((s) => s.id === booking.serviceId)!;
          for (const dimension of ["practitioner", "room", "equipment"] as const) {
            const id =
              dimension === "practitioner"
                ? practitioner.id
                : dimension === "room"
                  ? room.id
                  : equipment?.id;
            if (id === undefined || booking[`${dimension}Id`] !== id) continue;
            if (booking.start < interval.to && interval.from < booking.end)
              rules.push(`${dimension}-busy`);
            else if (dimension !== "equipment") {
              const field = dimension === "room" ? "roomTurnoverMin" : "bufferAfterMin";
              if (
                (booking.start <= interval.from && interval.from < booking.end + existing[field]) ||
                (interval.from <= booking.start && booking.start < interval.to + service[field])
              )
                rules.push(dimension === "room" ? "room-turnover" : "practitioner-buffer");
            }
          }
        }
        rows.push({
          assignment: {
            practitionerId: practitioner.id,
            roomId: room.id,
            equipmentId: equipment?.id ?? null,
            start: interval.from,
            end: interval.to,
          },
          rules: [...new Set(rules)].sort(),
          load,
        });
      }
  return rows;
}

/** Independently rank valid witnesses using numeric Unicode scalar sequences. */
export function referenceAssignment(
  snapshot: ClinicSnapshot,
  request: BookingRequest,
  now: number,
) {
  const key = (s: string) =>
    Array.from(s, (c) => c.codePointAt(0)!.toString(16).padStart(6, "0")).join("");
  const valid = referenceRows(snapshot, request, now).filter((r) => r.rules.length === 0);
  valid.sort((a, b) => {
    if (a.load !== b.load) return a.load - b.load;
    for (const field of ["practitionerId", "roomId", "equipmentId"] as const) {
      const left = key(a.assignment[field] ?? "");
      const right = key(b.assignment[field] ?? "");
      if (left !== right) return left < right ? -1 : 1;
    }
    return 0;
  });
  return valid[0]?.assignment ?? null;
}
