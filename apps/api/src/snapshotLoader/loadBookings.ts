import type { Booking, ClinicSnapshot, Service } from "@whynot/contracts";
import { localDate, resolveRecurringBoundary } from "@whynot/engine";
import { and, gte, gt, lt, or, sql } from "drizzle-orm";
import type { Database } from "../db/database.js";
import { bookings } from "../db/schema.js";

type Coverage = ClinicSnapshot["coverage"];

function localDayBounds(coverage: Coverage, timezone: string): Coverage {
  const first = localDate(coverage.from, timezone);
  const last = localDate(coverage.to - 1, timezone);
  if (!first.ok || !last.ok) throw new Error("Unsupported snapshot calendar coverage");
  const start = resolveRecurringBoundary(first.value, "00:00", timezone);
  const end = resolveRecurringBoundary(last.value, "24:00", timezone, true);
  // If midnight is ambiguous or absent, keep a conservative bound for the touched dates.
  const calendarPadding = 3 * 1440;
  return {
    from: start.ok ? start.value : coverage.from - calendarPadding,
    to: end.ok ? end.value : coverage.to + calendarPadding,
  };
}

/** Retain every booking that could affect coverage, its adjacent buffers or local-day counts. */
export async function loadBookings(
  tx: Database,
  coverage: Coverage,
  timezone: string,
  services: Service[],
): Promise<Booking[]> {
  const days = localDayBounds(coverage, timezone);
  const buffer = services.reduce(
    (max, service) => Math.max(max, service.bufferAfterMin, service.roomTurnoverMin),
    0,
  );
  const from = Math.max(Number.MIN_SAFE_INTEGER, coverage.from - buffer);
  const to = Math.min(Number.MAX_SAFE_INTEGER, coverage.to + buffer);
  const rows = await tx
    .select({
      id: bookings.id,
      patientId: bookings.patientId,
      serviceId: bookings.serviceId,
      practitionerId: bookings.practitionerId,
      roomId: bookings.roomId,
      equipmentId: bookings.equipmentId,
      start: bookings.start,
      end: bookings.end,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      or(
        and(gte(bookings.start, days.from), lt(bookings.start, days.to)),
        and(lt(bookings.start, to), gt(bookings.end, from)),
      ),
    )
    .orderBy(sql`${bookings.id} collate "C"`);

  return rows.map(({ equipmentId, ...booking }) =>
    equipmentId === null ? booking : { ...booking, equipmentId },
  );
}
