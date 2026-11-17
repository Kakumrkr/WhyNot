import { expect, it } from "vitest";
import fc from "fast-check";
import { FactSchema } from "@whynot/contracts";
import { requestRuleCaseArbitrary } from "../../fixtures/test/generate.js";
import { validateRequest } from "../src/validateRequest.js";
import { checkClinic, checkMissingResource } from "../src/rules/clinic.js";
import { checkPatient } from "../src/rules/patient.js";
import { checkTiming } from "../src/rules/timing.js";
import { checkPreference } from "../src/rules/preference.js";

function freeze(value: unknown): void {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}

it("generated request checks are schema-valid, deterministic, immutable and invariant to input order", () => {
  fc.assert(
    fc.property(requestRuleCaseArbitrary, ({ snapshot, request, now }) => {
      const before = structuredClone({ snapshot, request });
      freeze(snapshot);
      freeze(request);
      const result = validateRequest(snapshot, request, { now });
      if (!result.ok) throw new Error(JSON.stringify(result.issues));
      const ctx = result.value;
      const run = (context: typeof ctx) =>
        [
          ...checkClinic(context),
          ...checkPatient(context),
          ...checkTiming(context),
          ...checkPreference(context, "different-practitioner"),
          ...checkMissingResource(context),
        ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const facts = run(ctx);
      expect(run(ctx)).toEqual(facts);
      expect({ snapshot, request }).toEqual(before);
      expect(facts.every((fact) => FactSchema.safeParse(fact).success)).toBe(true);
      expect(new Set(facts.map((fact) => fact.id)).size).toBe(facts.length);
      const shuffled = structuredClone(snapshot);
      shuffled.bookings.reverse();
      shuffled.practitioners.reverse();
      shuffled.rooms.reverse();
      shuffled.equipment.reverse();
      shuffled.clinic.openingHours.reverse();
      const second = validateRequest(shuffled, request, { now });
      if (!second.ok) throw new Error(JSON.stringify(second.issues));
      expect(run(second.value)).toEqual(facts);

      // Independent arithmetic and authored zone offsets, without calling rule/time helpers.
      const localStartMinute =
        request.start + (snapshot.clinic.timezone === "Asia/Kolkata" ? 330 : 0);
      const day = Math.floor(localStartMinute / 1440);
      const count = snapshot.bookings.filter(
        (booking) =>
          booking.status === "confirmed" &&
          booking.patientId === request.patientId &&
          Math.floor(
            (booking.start + (snapshot.clinic.timezone === "Asia/Kolkata" ? 330 : 0)) / 1440,
          ) === day,
      ).length;
      const ids = new Set(facts.map((fact) => fact.ruleId));
      expect(ids.has("patient-daily-limit")).toBe(
        count >= snapshot.policy.patientMaxBookingsPerDay,
      );
      expect(ids.has("patient-eligibility-returning")).toBe(
        ctx.service.eligibility === "returning_only" && !ctx.patient.isReturning,
      );
      expect(ids.has("patient-eligibility-referral")).toBe(
        ctx.service.eligibility === "referral_required" &&
          !ctx.patient.referrals.includes(request.serviceId),
      );
      expect(ids.has("min-notice")).toBe(request.start - now < snapshot.policy.minNoticeMin);
      expect(ids.has("max-advance")).toBe(
        request.start - now > snapshot.policy.maxAdvanceDays * 1440,
      );
      expect(ids.has("request-practitioner")).toBe(request.practitionerId !== undefined);
      const expectedMissing =
        snapshot.practitioners.length === 0
          ? "practitioner"
          : snapshot.rooms.length === 0
            ? "room"
            : ctx.service.requiredEquipmentType !== undefined && snapshot.equipment.length === 0
              ? "equipment"
              : null;
      expect(checkMissingResource(ctx).map((fact) => fact.params)).toEqual(
        expectedMissing === null ? [] : [{ dimension: expectedMissing }],
      );
      const mondayHours = snapshot.clinic.openingHours.filter((hours) => hours.weekday === 1);
      expect(ids.has("clinic-closed-day")).toBe(
        snapshot.clinic.closedDates.includes("2026-11-16") || mondayHours.length === 0,
      );
      // Generated intervals all start before noon; end=12:00 is the only endpoint
      // before this positive-duration request finishes.
      expect(ids.has("clinic-hours")).toBe(
        !ids.has("clinic-closed-day") && mondayHours.every((hours) => hours.to === "12:00"),
      );
    }),
    { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
  );
});

it("the fixed generator corpus exercises all nine implemented checks", () => {
  const seen = new Set<string>();
  for (const { snapshot, request, now } of fc.sample(requestRuleCaseArbitrary, {
    seed: 13013026,
    numRuns: 200,
  })) {
    const result = validateRequest(snapshot, request, { now });
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    const ctx = result.value;
    for (const fact of [
      ...checkClinic(ctx),
      ...checkPatient(ctx),
      ...checkTiming(ctx),
      ...checkPreference(ctx, "other"),
      ...checkMissingResource(ctx),
    ])
      seen.add(fact.ruleId);
  }
  expect([...seen].sort()).toEqual([
    "clinic-closed-day",
    "clinic-hours",
    "max-advance",
    "min-notice",
    "patient-daily-limit",
    "patient-eligibility-referral",
    "patient-eligibility-returning",
    "request-practitioner",
    "resource-missing",
  ]);
});
