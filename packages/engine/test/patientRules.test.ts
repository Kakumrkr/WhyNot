import { describe, expect, it } from "vitest";
import { FactSchema } from "@whynot/contracts";
import { buildMinimalRequest, buildMinimalSnapshot } from "../../fixtures/src/index.js";
import { booking, context, instant } from "./requestTestHelpers.js";
import type { RuleContext } from "../src/validateRequest.js";
import { checkPatient } from "../src/rules/patient.js";
import { checkPreference } from "../src/rules/preference.js";
function patientCase(
  eligibility: "any" | "returning_only" | "referral_required",
  isReturning: boolean,
  referrals: string[] = [],
): RuleContext {
  const snapshot = buildMinimalSnapshot();
  snapshot.services[0]!.eligibility = eligibility;
  snapshot.patients[0]!.isReturning = isReturning;
  snapshot.patients[0]!.referrals = referrals;
  return context(snapshot);
}

describe("patient and preference rules", () => {
  it("checks returning-only eligibility and service-specific referrals", () => {
    expect(checkPatient(patientCase("returning_only", false))[0]?.ruleId).toBe(
      "patient-eligibility-returning",
    );
    expect(checkPatient(patientCase("returning_only", true))).toEqual([]);
    expect(checkPatient(patientCase("any", false))).toEqual([]);
    expect(checkPatient(patientCase("referral_required", true))[0]?.params).toEqual({
      serviceId: "consult",
    });
    expect(checkPatient(patientCase("referral_required", false, ["consult"]))).toEqual([]);
    const snapshot = buildMinimalSnapshot();
    snapshot.services.push({ ...snapshot.services[0]!, id: "other" });
    snapshot.services[0]!.eligibility = "referral_required";
    snapshot.patients[0]!.referrals = ["other"];
    expect(checkPatient(context(snapshot))[0]?.ruleId).toBe("patient-eligibility-referral");
  });
  it("counts confirmed starts on the clinic date, including local midnight and ignoring other patients/cancellations", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.timezone = "Asia/Kolkata";
    snapshot.patients.push({ ...snapshot.patients[0]!, id: "other" });
    const start = instant("2026-11-16T00:00:00+05:30");
    const request = buildMinimalRequest({ start });
    snapshot.bookings = [
      booking(start - 1, { id: "previous" }),
      booking(start, { id: "cancelled", status: "cancelled" }),
      booking(start, { id: "other", patientId: "other" }),
    ];
    expect(checkPatient(context(snapshot, request))).toEqual([]);
    snapshot.bookings.push(booking(start + 60, { id: "same-date" }));
    expect(checkPatient(context(snapshot, request))[0]?.params).toEqual({
      date: "2026-11-16",
      count: 1,
      limit: 1,
    });
    snapshot.policy.patientMaxBookingsPerDay = 2;
    expect(checkPatient(context(snapshot, request))).toEqual([]);
    snapshot.policy.patientMaxBookingsPerDay = 0;
    snapshot.bookings = [];
    expect(checkPatient(context(snapshot, request))[0]?.params).toEqual({
      date: "2026-11-16",
      count: 0,
      limit: 0,
    });
  });
  it("emits one stable requested-practitioner fact shared by nonmatching candidates", () => {
    const ctx = context();
    expect(checkPreference(ctx, "other")).toEqual([]);
    const preferred = context(
      ctx.snapshot,
      buildMinimalRequest({ practitionerId: "practitioner-test" }),
    );
    expect(checkPreference(preferred, "practitioner-test")).toEqual([]);
    const first = checkPreference(preferred, "other");
    expect(first).toHaveLength(1);
    expect(first).toEqual(checkPreference(preferred, "another"));
    expect(first[0]?.params).toEqual({ practitionerId: "practitioner-test" });
    expect(FactSchema.safeParse(first[0]).success).toBe(true);
  });
});
