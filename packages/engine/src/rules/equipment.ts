import type { Equipment, Fact } from "@whynot/contracts";
import { makeFact } from "../factId.js";
import type { RuleContext } from "../validateRequest.js";
import { canonicalFacts, intervalLookup, occupancyFacts } from "./resourceIntervals.js";

/** Required type, maintenance and confirmed occupancy for one equipment unit. */
export function checkEquipment(context: RuleContext, equipment: Equipment): Fact[] {
  if (context.service.requiredEquipmentType === undefined) return [];
  const subject = { type: "equipment", id: equipment.id } as const;
  const facts: Fact[] = [];
  if (equipment.type !== context.service.requiredEquipmentType)
    facts.push(
      makeFact("equipment-type", subject, { requiredType: context.service.requiredEquipmentType }),
    );
  for (const window of intervalLookup(equipment.maintenance)(context.interval))
    facts.push(
      makeFact(
        "equipment-maintenance",
        subject,
        { windowId: window.id },
        { from: window.from, to: window.to },
      ),
    );
  facts.push(
    ...occupancyFacts(
      context,
      subject,
      context.snapshot.bookings.filter((booking) => booking.equipmentId === equipment.id),
      "equipment",
    ),
  );
  return canonicalFacts(facts);
}
