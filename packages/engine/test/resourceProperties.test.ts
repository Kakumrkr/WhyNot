import { expect, it } from "vitest";
import fc from "fast-check";
import { FactSchema, type Fact } from "@whynot/contracts";
import { resourceRuleCaseArbitrary } from "../../fixtures/test/generate.js";
import { context } from "./requestTestHelpers.js";
import { checkPractitioner } from "../src/rules/practitioner.js";
import { checkRoom } from "../src/rules/room.js";
import { checkEquipment } from "../src/rules/equipment.js";
import type { RuleContext } from "../src/validateRequest.js";

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

function run(ctx: RuleContext): Fact[] {
  return [
    ...ctx.snapshot.practitioners.flatMap((practitioner) => checkPractitioner(ctx, practitioner)),
    ...ctx.snapshot.rooms.flatMap((room) => checkRoom(ctx, room)),
    ...ctx.snapshot.equipment.flatMap((equipment) => checkEquipment(ctx, equipment)),
  ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

it(
  "generated resource facts agree with direct arithmetic, preserve frozen inputs and ignore input ordering",
  { timeout: 60000 },
  () => {
    fc.assert(
      fc.property(resourceRuleCaseArbitrary, ({ snapshot, request, now }) => {
        const before = structuredClone({ snapshot, request });
        freeze(snapshot);
        freeze(request);
        const ctx = context(snapshot, request, now);
        const facts = run(ctx);
        expect(run(ctx)).toEqual(facts);
        expect({ snapshot, request }).toEqual(before);
        expect(facts.every((fact) => FactSchema.safeParse(fact).success)).toBe(true);
        expect(new Set(facts.map((fact) => fact.id)).size).toBe(facts.length);
        const shuffled = structuredClone(snapshot);
        shuffled.bookings.reverse();
        shuffled.services.reverse();
        shuffled.practitioners.reverse();
        shuffled.rooms.reverse();
        shuffled.equipment.reverse();
        for (const practitioner of shuffled.practitioners) {
          practitioner.workingHours.reverse();
          practitioner.breaks.reverse();
          practitioner.timeOff.reverse();
          practitioner.skills.reverse();
        }
        for (const room of shuffled.rooms) {
          room.capabilities.reverse();
          room.maintenance.reverse();
        }
        for (const equipment of shuffled.equipment) equipment.maintenance.reverse();
        expect(run(context(shuffled, request, now))).toEqual(facts);

        // Independent expectations use ordinary loops and authored November zone offsets.
        // No optimized rule, index, fact builder or time helper is reused here.
        const expected: string[] = [];
        const add = (rule: string, subject: string, source = "") =>
          expected.push(`${rule}|${subject}|${source}`);
        const start = request.start;
        const end = start + ctx.service.durationMin;
        const offset = snapshot.clinic.timezone === "Asia/Kolkata" ? 330 : 0;
        const day = Math.floor((start + offset) / 1440);
        for (const practitioner of snapshot.practitioners) {
          if (!practitioner.skills.includes(ctx.service.requiredSkill))
            add("practitioner-skill", practitioner.id);
          // Generated starts are Monday noon, end <=13:30; each opening starts <=10:00.
          if (
            !practitioner.workingHours.some((hours) => hours.weekday === 1 && hours.to !== "12:00")
          )
            add("practitioner-hours", practitioner.id);
          if (practitioner.breaks.length > 0) add("practitioner-break", practitioner.id);
          if (practitioner.timeOff.length > 0)
            add("practitioner-time-off", practitioner.id, "window");
          let count = 0;
          for (const booking of snapshot.bookings) {
            if (
              booking.status === "confirmed" &&
              booking.practitionerId === practitioner.id &&
              Math.floor((booking.start + offset) / 1440) === day
            )
              count++;
          }
          const limit = practitioner.dailyCap ?? snapshot.policy.defaultDailyCap;
          if (limit !== undefined && count >= limit) add("practitioner-daily-cap", practitioner.id);
        }
        for (const room of snapshot.rooms) {
          if (
            ctx.service.requiredRoomCapability !== undefined &&
            !room.capabilities.includes(ctx.service.requiredRoomCapability)
          )
            add("room-capability", room.id);
          if (room.maintenance.length > 0) add("room-maintenance", room.id, "window");
        }
        if (ctx.service.requiredEquipmentType !== undefined) {
          for (const equipment of snapshot.equipment) {
            if (equipment.type !== ctx.service.requiredEquipmentType)
              add("equipment-type", equipment.id);
            if (equipment.maintenance.length > 0)
              add("equipment-maintenance", equipment.id, "window");
          }
        }
        for (const booking of snapshot.bookings) {
          if (booking.status !== "confirmed") continue;
          const existing = snapshot.services.find((service) => service.id === booking.serviceId)!;
          const overlap = start < booking.end && booking.start < end;
          for (const dimension of ["practitioner", "room", "equipment"] as const) {
            if (dimension === "equipment" && ctx.service.requiredEquipmentType === undefined)
              continue;
            const subject = booking[`${dimension}Id`];
            if (subject === undefined) continue;
            if (overlap) add(`${dimension}-busy`, subject, booking.id);
            else if (dimension !== "equipment") {
              const field = dimension === "room" ? "roomTurnoverMin" : "bufferAfterMin";
              if (
                (booking.start <= start && start < booking.end + existing[field]) ||
                (start <= booking.start && booking.start < end + ctx.service[field])
              )
                add(
                  dimension === "room" ? "room-turnover" : "practitioner-buffer",
                  subject,
                  booking.id,
                );
            }
          }
        }
        const actual = facts.map((fact) => {
          const params = fact.params;
          const source =
            "bookingId" in params
              ? params.bookingId
              : "timeOffId" in params
                ? params.timeOffId
                : "windowId" in params
                  ? params.windowId
                  : "";
          return `${fact.ruleId}|${fact.subject.id}|${source}`;
        });
        expect(actual.sort()).toEqual(expected.sort());
      }),
      { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
    );
  },
);

it("a fixed generator corpus reaches every resource rule", () => {
  const seen = new Set<string>();
  for (const { snapshot, request, now } of fc.sample(resourceRuleCaseArbitrary, {
    seed: 14014026,
    numRuns: 300,
  })) {
    for (const fact of run(context(snapshot, request, now))) seen.add(fact.ruleId);
  }
  expect([...seen].sort()).toEqual([
    "equipment-busy",
    "equipment-maintenance",
    "equipment-type",
    "practitioner-break",
    "practitioner-buffer",
    "practitioner-busy",
    "practitioner-daily-cap",
    "practitioner-hours",
    "practitioner-skill",
    "practitioner-time-off",
    "room-busy",
    "room-capability",
    "room-maintenance",
    "room-turnover",
  ]);
});
