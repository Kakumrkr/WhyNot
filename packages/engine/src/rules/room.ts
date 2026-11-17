import type { Fact, Room } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";
import { canonicalFacts, intervalLookup, occupancyFacts } from "./resourceIntervals.js";

/** Capability, maintenance, occupancy and both service turnover settings for one room. */
export function checkRoom(context: RuleContext, room: Room): Fact[] {
  const subject = { type: "room", id: room.id } as const;
  const facts: Fact[] = [];
  const requiredCapability = context.service.requiredRoomCapability;
  if (requiredCapability !== undefined && !room.capabilities.includes(requiredCapability))
    facts.push(makeFact("room-capability", subject, { requiredCapability }));
  for (const window of intervalLookup(room.maintenance)(context.interval))
    facts.push(
      makeFact(
        "room-maintenance",
        subject,
        { windowId: window.id },
        { from: window.from, to: window.to },
      ),
    );
  facts.push(
    ...occupancyFacts(
      context,
      subject,
      context.snapshot.bookings.filter((booking) => booking.roomId === room.id),
      "room",
    ),
  );
  return canonicalFacts(facts);
}
