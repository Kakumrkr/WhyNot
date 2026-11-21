import { randomUUID } from "node:crypto";
import type { BookingRequest } from "@whynot/contracts";
import {
  ApiBookingRequestSchema,
  BookingParamsSchema,
  BookingResponseSchema,
  CancellationResponseSchema,
} from "@whynot/contracts/api";
import { evaluate } from "@whynot/engine";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/database.js";
import { bookings, clinics } from "../db/schema.js";
import { serializable } from "../db/transactions.js";
import { demoRole, requireRequester } from "../demoRole.js";
import { ApiError, isoInstant, parseBody, slotRequest } from "../http.js";
import { loadSnapshot } from "../snapshotLoader/loadSnapshot.js";
import { sendSlot } from "./evaluationResponse.js";

async function book(
  tx: Database,
  request: BookingRequest,
  id: string,
  cancellationId: string,
  staff: boolean,
) {
  const { snapshot, clock } = await loadSnapshot(tx);
  const result = evaluate(snapshot, request, {
    now: clock.now,
    trace: staff,
    includeAdminFix: staff,
  });
  if (result.status !== "bookable") return result;
  const { equipmentId, ...assignment } = result.assignment;
  // Speculative insertion lets the exclusion indexes arbitrate concurrent writes without
  // deadlock cascades. A conflict invisible to the serializable snapshot raises 40001.
  const [inserted] = await tx
    .insert(bookings)
    .values({
      id,
      cancellationId,
      patientId: request.patientId,
      serviceId: request.serviceId,
      ...assignment,
      equipmentId,
      createdAt: clock.now,
      status: "confirmed",
    })
    .onConflictDoNothing()
    .returning({ id: bookings.id });
  if (inserted === undefined) throw new Error("Bookable assignment conflicts with a visible row");
  return result;
}

/** Register transactional booking and fictional-owner/staff cancellation. */
export function registerBookings(app: FastifyInstance, db: Database): void {
  app.post("/bookings", async (http, reply) => {
    const request = slotRequest(parseBody(ApiBookingRequestSchema, http.body));
    const role = requireRequester(http, request.patientId);
    const staff = role.audience === "staff";
    const id = randomUUID();
    const cancellationId = randomUUID();
    const attempted = await serializable(
      db,
      (tx) => book(tx, request, id, cancellationId, staff),
      true,
    );
    if (!attempted.ok) {
      const fresh = await db.transaction(
        async (tx) => {
          const { snapshot, clock } = await loadSnapshot(tx);
          return evaluate(snapshot, request, {
            now: clock.now,
            trace: staff,
            includeAdminFix: staff,
          });
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
      return sendSlot(reply, fresh, role, "contended");
    }
    const result = attempted.value;
    if (result.status === "invalid_request") return sendSlot(reply, result, role);
    if (result.status === "blocked") return sendSlot(reply, result, role, "booking_conflict");
    const { start, end, practitionerId } = result.assignment;
    return reply.code(201).send(
      BookingResponseSchema.parse({
        id: cancellationId,
        start: isoInstant(start),
        end: isoInstant(end),
        practitionerId,
      }),
    );
  });

  app.delete("/bookings/:id", async (http) => {
    const role = demoRole(http);
    const { id } = parseBody(BookingParamsSchema, http.params);
    const publicId = eq(bookings.cancellationId, id);
    const scope =
      role.audience === "staff" ? publicId : and(publicId, eq(bookings.patientId, role.patientId));
    const attempted = await serializable(db, async (tx) => {
      const find = (condition: typeof scope) =>
        tx
          .select({ id: bookings.id, status: bookings.status })
          .from(bookings)
          .where(condition)
          .for("update");
      const [scoped] = await find(scope);
      const booking =
        scoped ?? (role.audience === "staff" ? (await find(eq(bookings.id, id)))[0] : undefined);
      if (booking === undefined) throw new ApiError("not_found");
      if (booking.status === "cancelled") return;
      const [clock] = await tx.select({ now: clinics.demoNow }).from(clinics);
      if (clock === undefined) throw new Error("Demo clinic has not been seeded");
      await tx
        .update(bookings)
        .set({ status: "cancelled", cancelledAt: clock.now })
        .where(eq(bookings.id, booking.id));
    });
    if (!attempted.ok) throw new ApiError("contended");
    return CancellationResponseSchema.parse({ status: "cancelled" });
  });
}
