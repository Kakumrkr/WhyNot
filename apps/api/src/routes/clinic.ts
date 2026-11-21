import type { ClinicSnapshot } from "@whynot/contracts";
import {
  AvailabilityQuerySchema,
  AvailabilityResponseSchema,
  ClinicResponseSchema,
  HealthResponseSchema,
  type AvailabilityQuery,
} from "@whynot/contracts/api";
import { datedSchedule, gridStarts, isBookable, localDate } from "@whynot/engine";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { requireRequester } from "../demoRole.js";
import { ApiError, isoInstant, parseBody } from "../http.js";
import { loadSnapshot } from "../snapshotLoader/loadSnapshot.js";

function availability(snapshot: ClinicSnapshot, query: AvailabilityQuery, now: number) {
  const { date, ...request } = query;
  const { timezone, openingHours, slotGridMinutes, closedDates } = snapshot.clinic;
  const service = snapshot.services.find(({ id }) => id === request.serviceId);
  if (
    !snapshot.patients.some(({ id }) => id === request.patientId) ||
    service === undefined ||
    (request.practitionerId !== undefined &&
      !snapshot.practitioners.some(({ id }) => id === request.practitionerId))
  )
    throw new ApiError("invalid_request");
  if (closedDates.includes(date)) return [];
  const hours = datedSchedule(openingHours, date, timezone);
  const grid = gridStarts(date, timezone, slotGridMinutes);
  if (!hours.ok || !grid.ok) throw new ApiError("invalid_request");
  const scheduled = grid.value.filter(
    (start) =>
      start >= snapshot.coverage.from &&
      start + service.durationMin <= snapshot.coverage.to &&
      hours.value.some(({ from, to }) => start >= from && start < to),
  );
  const slots = scheduled.map((start) => {
    const instant = isoInstant(start, timezone);
    return { start, instant, time: instant.slice(11, 16) };
  });
  const counts = new Map<string, number>();
  for (const { time } of slots) counts.set(time, (counts.get(time) ?? 0) + 1);
  return slots.map(({ start, instant, time }) => {
    const slot = { ...request, start };
    return {
      start: instant,
      time:
        counts.get(time) === 1
          ? time
          : `${time} (UTC${instant.slice(19) === "Z" ? "+00:00" : instant.slice(19)})`,
      available: isBookable(snapshot, slot, now),
    };
  });
}

/** Register public configuration and requester-scoped availability. */
export function registerClinic(app: FastifyInstance, db: Database): void {
  const read = () =>
    db.transaction((tx) => loadSnapshot(tx), {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });
  app.get("/health", () => HealthResponseSchema.parse({ status: "ok" }));
  app.get("/clinic", async () => {
    const { snapshot, clock, demoWindow } = await read();
    return ClinicResponseSchema.parse({
      clinic: snapshot.clinic,
      services: snapshot.services.map(({ id, displayName, durationMin }) => ({
        id,
        displayName,
        durationMin,
      })),
      practitioners: snapshot.practitioners.map(({ id, displayName, role }) => ({
        id,
        displayName,
        role,
      })),
      demoDate: clock.date,
      now: isoInstant(clock.now),
      demoWindow: { from: isoInstant(demoWindow.from), to: isoInstant(demoWindow.to) },
      coverage: { from: isoInstant(snapshot.coverage.from), to: isoInstant(snapshot.coverage.to) },
    });
  });
  app.get("/availability", async (http) => {
    const query = parseBody(AvailabilityQuerySchema, http.query);
    requireRequester(http, query.patientId);
    const { snapshot, clock } = await read();
    const first = localDate(snapshot.coverage.from, snapshot.clinic.timezone);
    const last = localDate(snapshot.coverage.to - 1, snapshot.clinic.timezone);
    if (!first.ok || !last.ok) throw new Error("Unsupported coverage dates");
    if (query.date < first.value || query.date > last.value) throw new ApiError("invalid_request");
    return AvailabilityResponseSchema.parse({
      date: query.date,
      starts: availability(snapshot, query, clock.now),
    });
  });
}
