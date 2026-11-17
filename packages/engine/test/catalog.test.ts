import { expect, it } from "vitest";
import fc from "fast-check";
import { FactSchema, RuleIdSchema, RuleSchema } from "@whynot/contracts";
import { catalog, catalogVersion } from "../src/catalog.js";
import { factId, makeFact } from "../src/factId.js";

it("matches all 23 doc-02 entries, with no presentation replacements", () => {
  const expected = [
    ["clinic-closed-day", "availability", 1, "public", ["patient"]],
    ["clinic-hours", "availability", 2, "public", ["patient"]],
    ["min-notice", "timing-policy", 2, "public", ["patient", "admin"]],
    ["max-advance", "timing-policy", 2, "public", ["patient", "admin"]],
    ["patient-eligibility-returning", "patient", 1, "public", ["admin"]],
    ["patient-eligibility-referral", "patient", 1, "public", []],
    ["patient-daily-limit", "patient", 2, "public", ["patient", "admin"]],
    ["request-practitioner", "preference", 4, "public", ["patient"]],
    ["practitioner-skill", "capability", 5, "public", []],
    ["practitioner-hours", "availability", 3, "public", ["patient"]],
    ["practitioner-break", "availability", 3, "public", ["patient"]],
    ["practitioner-time-off", "availability", 3, "staff", ["patient"]],
    ["practitioner-busy", "occupancy", 3, "public", ["patient"]],
    ["practitioner-buffer", "occupancy", 3, "public", ["patient", "admin"]],
    ["practitioner-daily-cap", "policy", 3, "public", ["patient", "admin"]],
    ["room-capability", "capability", 6, "staff", []],
    ["room-maintenance", "availability", 4, "public", ["patient"]],
    ["room-busy", "occupancy", 4, "public", ["patient"]],
    ["room-turnover", "occupancy", 4, "public", ["patient", "admin"]],
    ["equipment-type", "capability", 6, "staff", []],
    ["equipment-maintenance", "availability", 4, "public", ["patient"]],
    ["equipment-busy", "occupancy", 4, "public", ["patient"]],
    ["resource-missing", "capability", 1, "public", []],
  ];
  expect(catalogVersion).toBe(1);
  expect(Object.keys(catalog).sort()).toEqual([...RuleIdSchema.options].sort());
  expect(
    Object.values(catalog).map((entry) => [
      entry.id,
      entry.family,
      entry.weight,
      entry.visibility,
      entry.relaxableBy,
    ]),
  ).toEqual(expected);
  for (const [id, entry] of Object.entries(catalog)) {
    expect(entry.id).toBe(id);
    expect(entry.version).toBe(1);
    expect(RuleSchema.safeParse(entry).success).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.relaxableBy)).toBe(true);
  }
  expect(Object.isFrozen(catalog)).toBe(true);
});

it("encodes sorted grounding keys without delimiter, type, Unicode or window collisions", () => {
  expect(factId("clinic-hours", { b: "2", a: "1" })).toBe(
    factId("clinic-hours", { a: "1", b: "2" }),
  );
  expect(factId("clinic-hours", { "\u{10000}": "astral", "\uE000": "bmp" })).toBe(
    'clinic-hours:[["\uE000","bmp"],["\u{10000}","astral"]]',
  );
  const keys = [
    { a: "x:b=y" },
    { a: "x", b: "y" },
    { a: 1 },
    { a: "1" },
    { a: "\ud800" },
    { a: "\\ud800" },
  ];
  expect(new Set(keys.map((key) => factId("clinic-hours", key))).size).toBe(keys.length);
  const subject = { type: "clinic", id: "id:with=delimiters" } as const;
  const first = makeFact("clinic-hours", subject, { date: "2026-11-16" }, { from: 1, to: 2 });
  expect(first.id).not.toBe(
    makeFact("clinic-hours", subject, { date: "2026-11-16" }, { from: 1, to: 3 }).id,
  );
  expect(first.id).not.toBe(
    makeFact(
      "clinic-hours",
      { ...subject, id: "other" },
      { date: "2026-11-16" },
      { from: 1, to: 2 },
    ).id,
  );
  fc.assert(
    fc.property(fc.string(), fc.string(), (a, b) => {
      expect(factId("clinic-hours", { a, b })).toBe(factId("clinic-hours", { b, a }));
      expect(factId("clinic-hours", { a })).not.toBe(factId("clinic-hours", { a, b }));
    }),
    { numRuns: Number(process.env.FC_NUM_RUNS ?? 500) },
  );
});

it("carries exact staff visibility and raw parameters only in internal facts", () => {
  const fact = makeFact(
    "practitioner-time-off",
    { type: "practitioner", id: "staff-1" },
    { timeOffId: "leave-1", reason: "Private staff reason" },
    { from: 1, to: 2 },
  );
  expect(fact.visibility).toBe("staff");
  expect(fact.kind).toBe("availability");
  expect(fact.relaxableBy).toEqual(["patient"]);
  expect(FactSchema.safeParse(fact).success).toBe(true);
  expect(() =>
    makeFact(
      "practitioner-time-off",
      { type: "practitioner", id: "staff-1" },
      { timeOffId: "leave-1", reason: "Reason" },
      { from: 2, to: 1 },
    ),
  ).toThrow();
});
