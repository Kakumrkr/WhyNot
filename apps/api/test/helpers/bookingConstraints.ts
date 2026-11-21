import { riversideMinute } from "@whynot/fixtures";
import { eq } from "drizzle-orm";
import { expect } from "vitest";
import { DEMO_NOW } from "../../src/clock/demoClock.js";
import type { Database } from "../../src/db/database.js";
import { bookings } from "../../src/db/schema.js";

const start = riversideMinute(22, "10:00");

export const baseBooking = {
  id: "constraint-booking",
  patientId: "patient-0",
  serviceId: "consult",
  practitionerId: "rao",
  roomId: "consult-1",
  equipmentId: "cryo-unit",
  start,
  end: start + 30,
  status: "confirmed",
  createdAt: DEMO_NOW,
} satisfies typeof bookings.$inferInsert;

export async function checkBookingExclusions(db: Database): Promise<void> {
  await db.insert(bookings).values(baseBooking);
  const attempts = [
    ["practitioner", { roomId: "consult-2", equipmentId: null }],
    ["room", { practitionerId: "okafor", equipmentId: null }],
    ["equipment", { practitionerId: "okafor", roomId: "consult-2" }],
  ] as const;
  for (const [dimension, changes] of attempts) {
    await expect(
      db.insert(bookings).values({ ...baseBooking, id: `overlap-${dimension}`, ...changes }),
    ).rejects.toMatchObject({
      cause: { code: "23P01", constraint: `bookings_${dimension}_overlap` },
    });
  }

  const touching = {
    ...baseBooking,
    id: "touching",
    start: baseBooking.end,
    end: baseBooking.end + 30,
  };
  await db.insert(bookings).values(touching);
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: DEMO_NOW })
    .where(eq(bookings.id, baseBooking.id));
  await db.insert(bookings).values({ ...baseBooking, id: "replacement" });
  await db.insert(bookings).values([
    {
      ...baseBooking,
      id: "no-equipment-one",
      practitionerId: "mehta",
      roomId: "consult-2",
      equipmentId: null,
    },
    {
      ...baseBooking,
      id: "no-equipment-two",
      practitionerId: "okafor",
      roomId: "consult-3",
      equipmentId: null,
    },
  ]);
}
