import { describe, expect, it } from "vitest";
import { buildMinimalRequest, buildMinimalSnapshot, demoNow } from "../../fixtures/src/index.js";
import { booking, instant } from "./requestTestHelpers.js";
import type { BookingRequest } from "@whynot/contracts";
import { validateRequest } from "../src/validateRequest.js";
describe("request validation before rule checks", () => {
  function code(snapshot: unknown, request: unknown, now: unknown = demoNow): string | undefined {
    const result = validateRequest(snapshot, request, { now });
    expect(result.ok).toBe(false);
    return result.ok ? undefined : result.issues[0]?.code;
  }
  it("rejects malformed input without echoing it, dangling references and duplicate IDs", () => {
    expect(code(null, null)).toBe("invalid_snapshot");
    const snapshot = buildMinimalSnapshot();
    expect(code(snapshot, { ...buildMinimalRequest(), patientId: "SECRET-payload" })).toBe(
      "unknown_reference",
    );
    const result = validateRequest(
      snapshot,
      { ...buildMinimalRequest(), patientId: "SECRET-payload" },
      { now: demoNow },
    );
    expect(JSON.stringify(result)).not.toContain("SECRET-payload");
    for (const field of ["patientId", "serviceId", "practitionerId"] as const)
      expect(code(snapshot, { ...buildMinimalRequest(), [field]: "missing" })).toBe(
        "unknown_reference",
      );
    expect(code(snapshot, { ...buildMinimalRequest(), start: Infinity })).toBe("invalid_request");
    expect(code(snapshot, buildMinimalRequest(), NaN)).toBe("invalid_request");
    snapshot.bookings = [booking(demoNow, { practitionerId: "missing" })];
    expect(code(snapshot, buildMinimalRequest())).toBe("invalid_snapshot");
    snapshot.bookings = [];
    snapshot.practitioners.push({ ...snapshot.practitioners[0]! });
    expect(code(snapshot, buildMinimalRequest())).toBe("invalid_snapshot");
  });
  it("permits empty pools but rejects a preference referencing an absent practitioner", () => {
    const snapshot = buildMinimalSnapshot({ practitioners: [], rooms: [], equipment: [] });
    expect(validateRequest(snapshot, buildMinimalRequest(), { now: demoNow }).ok).toBe(true);
    expect(code(snapshot, buildMinimalRequest({ practitionerId: "practitioner-test" }))).toBe(
      "unknown_reference",
    );
  });
  it("checks local grid independently of UTC and service duration; checks coverage and arithmetic", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.timezone = "Asia/Kolkata";
    snapshot.clinic.slotGridMinutes = 60;
    snapshot.services[0]!.durationMin = 10;
    const request: BookingRequest = {
      ...buildMinimalRequest(),
      start: instant("2026-11-16T12:00:00+05:30"),
    };
    expect(validateRequest(snapshot, request, { now: demoNow }).ok).toBe(true);
    expect(code(snapshot, { ...request, start: request.start + 30 })).toBe("off_grid");
    snapshot.coverage = { from: request.start, to: request.start + 10 };
    expect(validateRequest(snapshot, request, { now: demoNow }).ok).toBe(true);
    snapshot.coverage.to--;
    expect(code(snapshot, request)).toBe("outside_coverage");
    snapshot.coverage = { from: 0, to: Number.MAX_SAFE_INTEGER };
    expect(code(snapshot, { ...request, start: Number.MAX_SAFE_INTEGER - 1 })).toBe(
      "invalid_request",
    );
    expect(code(snapshot, request, -Number.MAX_SAFE_INTEGER)).toBe("invalid_request");
    snapshot.policy.maxAdvanceDays = Number.MAX_SAFE_INTEGER;
    expect(code(snapshot, request)).toBe("invalid_request");
  });
  it("rejects unsupported recurring clinic/working/break boundaries on affected dates only", () => {
    for (const [date, boundary] of [
      ["2026-03-29", "01:30"],
      ["2026-10-25", "01:30"],
    ]) {
      const start = instant(`${date}T10:00:00Z`);
      for (const target of ["clinic", "working", "break"] as const) {
        const snapshot = buildMinimalSnapshot();
        snapshot.coverage = { from: start - 1440, to: start + 1440 };
        const hours = [{ weekday: 7, from: boundary!, to: "12:00" }];
        if (target === "clinic") snapshot.clinic.openingHours = hours;
        else if (target === "working") snapshot.practitioners[0]!.workingHours = hours;
        else snapshot.practitioners[0]!.breaks = hours;
        expect(code(snapshot, { ...buildMinimalRequest(), start })).toBe("unsupported_wall_time");
      }
    }
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.openingHours.push({ weekday: 7, from: "01:30", to: "02:30" });
    expect(validateRequest(snapshot, buildMinimalRequest(), { now: demoNow }).ok).toBe(true);
  });
});
