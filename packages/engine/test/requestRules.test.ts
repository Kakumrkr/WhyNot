import { describe, expect, it } from "vitest";
import { buildMinimalRequest, buildMinimalSnapshot } from "../../fixtures/src/index.js";
import { context, instant } from "./requestTestHelpers.js";
import { checkClinic, checkMissingResource } from "../src/rules/clinic.js";
import { checkTiming } from "../src/rules/timing.js";
describe("clinic rules", () => {
  it("distinguishes explicit closure and a weekday with no hours from an hours violation", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.closedDates = ["2026-11-16"];
    expect(checkClinic(context(snapshot)).map((fact) => [fact.ruleId, fact.params])).toEqual([
      ["clinic-closed-day", { date: "2026-11-16" }],
    ]);
    snapshot.clinic.closedDates = [];
    snapshot.clinic.openingHours = [];
    expect(checkClinic(context(snapshot))[0]?.ruleId).toBe("clinic-closed-day");
    expect(checkClinic(context())).toEqual([]);
  });

  it("accepts exact opening/closing and rejects appointments crossing either boundary or a gap", () => {
    for (const [clock, violated] of [
      ["07:45", true],
      ["08:00", false],
      ["17:45", false],
      ["18:00", true],
    ] as const) {
      const facts = checkClinic(
        context(
          buildMinimalSnapshot(),
          buildMinimalRequest({ start: instant(`2026-11-16T${clock}:00Z`) }),
        ),
      );
      expect(facts.map((fact) => fact.ruleId)).toEqual(violated ? ["clinic-hours"] : []);
    }
    const snapshot = buildMinimalSnapshot();
    snapshot.clinic.openingHours = [
      { weekday: 1, from: "08:00", to: "11:00" },
      { weekday: 1, from: "11:15", to: "18:00" },
    ];
    expect(checkClinic(context(snapshot))[0]?.ruleId).toBe("clinic-hours");
    snapshot.clinic.openingHours[0]!.to = "11:15";
    expect(checkClinic(context(snapshot))).toEqual([]);
  });

  it("covers explicit cross-midnight appointments with split dated hours; midnight end excludes the next day", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.services[0]!.durationMin = 30;
    snapshot.clinic.openingHours = [
      { weekday: 1, from: "23:00", to: "24:00" },
      { weekday: 2, from: "00:00", to: "01:00" },
    ];
    const request = buildMinimalRequest({ start: instant("2026-11-16T23:45:00Z") });
    expect(checkClinic(context(snapshot, request))).toEqual([]);
    snapshot.clinic.closedDates = ["2026-11-17"];
    expect(checkClinic(context(snapshot, request))[0]?.params).toEqual({ date: "2026-11-17" });
    snapshot.services[0]!.durationMin = 15;
    expect(checkClinic(context(snapshot, request))).toEqual([]);
  });

  it("returns exactly the first absent dimension and does not misclassify incompatible pools", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.services[0]!.requiredEquipmentType = "required";
    expect(checkMissingResource(context(snapshot))[0]?.params).toEqual({ dimension: "equipment" });
    snapshot.rooms = [];
    expect(checkMissingResource(context(snapshot))[0]?.params).toEqual({ dimension: "room" });
    snapshot.practitioners = [];
    expect(checkMissingResource(context(snapshot)).map((fact) => fact.params)).toEqual([
      { dimension: "practitioner" },
    ]);
    expect(checkMissingResource(context())).toEqual([]);
    const incompatible = buildMinimalSnapshot();
    incompatible.services[0]!.requiredEquipmentType = "required";
    incompatible.equipment = [{ id: "unit", displayName: "Unit", type: "wrong", maintenance: [] }];
    incompatible.practitioners[0]!.skills = [];
    incompatible.services[0]!.requiredRoomCapability = "absent";
    expect(checkMissingResource(context(incompatible))).toEqual([]);
  });
});

describe("timing rules", () => {
  it("uses exact notice equality, past starts and one-minute boundaries", () => {
    const ctx = context();
    for (const [lead, expected] of [
      [119, ["min-notice"]],
      [120, []],
      [121, []],
      [-1, ["min-notice"]],
    ] as const) {
      expect(
        checkTiming(context(ctx.snapshot, ctx.request, ctx.request.start - lead)).map(
          (fact) => fact.ruleId,
        ),
      ).toEqual(expected);
    }
  });
  it("uses elapsed advance equality and handles zero-day policy", () => {
    const ctx = context();
    for (const [lead, violated] of [
      [30 * 1440 - 1, false],
      [30 * 1440, false],
      [30 * 1440 + 1, true],
    ] as const)
      expect(
        checkTiming(context(ctx.snapshot, ctx.request, ctx.request.start - lead)).some(
          (fact) => fact.ruleId === "max-advance",
        ),
      ).toBe(violated);
    ctx.snapshot.policy.maxAdvanceDays = 0;
    ctx.snapshot.policy.minNoticeMin = 0;
    expect(checkTiming(context(ctx.snapshot, ctx.request, ctx.request.start))).toEqual([]);
    expect(checkTiming(context(ctx.snapshot, ctx.request, ctx.request.start - 1))[0]?.ruleId).toBe(
      "max-advance",
    );
  });
  it("does not mistake a 25-hour fall-back calendar day for one elapsed day", () => {
    const snapshot = buildMinimalSnapshot();
    snapshot.coverage = {
      from: instant("2026-10-24T00:00:00Z"),
      to: instant("2026-10-27T00:00:00Z"),
    };
    snapshot.policy.maxAdvanceDays = 1;
    const request = { ...buildMinimalRequest(), start: instant("2026-10-25T12:00:00+00:00") };
    const facts = checkTiming(context(snapshot, request, instant("2026-10-24T12:00:00+01:00")));
    expect(facts.map((fact) => [fact.ruleId, fact.params])).toEqual([
      ["max-advance", { maxAdvanceDays: 1, actualMin: 1500 }],
    ]);
    expect(checkTiming(context(snapshot, request, request.start - 1440))).toEqual([]);
    request.start = instant("2026-03-29T12:00:00+01:00");
    snapshot.coverage = { from: request.start - 3000, to: request.start + 3000 };
    expect(checkTiming(context(snapshot, request, instant("2026-03-28T12:00:00+00:00")))).toEqual(
      [],
    );
  });
});
