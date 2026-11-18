import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("engine built package entry loads in native Node ESM", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const entry = await import("@whynot/engine");
      const invalid = entry.evaluate(null, {}, { now: 0 });
      console.log(JSON.stringify({
        epoch: entry.parseOffsetInstant("1970-01-01T00:00:00Z"),
        catalogVersion: entry.catalogVersion,
        catalogSize: Object.keys(entry.catalog).length,
        invalidBookable: entry.isBookable(null, {}, 0),
        invalidEvaluation: invalid.status,
        projected: entry.projectForAudience(invalid, "patient", { requesterPatientId: "test" }),
        absent: ["explain", "bookingLocalDates", "validatedDatedSchedules", "referenceRows",
          "referenceAssignment", "chooseAssignment", "buildMatrix", "enumerateCandidates",
          "previewPolicyChanges", "validateRequest", "checkClinic", "makeFact"].filter(key => key in entry),
      }));`,
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual({
    epoch: { ok: true, value: 0 },
    catalogVersion: 1,
    catalogSize: 23,
    invalidBookable: false,
    invalidEvaluation: "invalid_request",
    projected: {
      status: "invalid_request",
      errors: [{ code: "invalid_snapshot", field: "snapshot" }],
    },
    absent: [],
  });
});
