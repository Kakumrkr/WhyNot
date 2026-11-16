import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("contracts built package entry loads in native Node ESM", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'const entry = await import("@whynot/contracts"); console.log(JSON.stringify({ version: entry.schemaVersion, request: entry.BookingRequestSchema.parse({ patientId: "p", serviceId: "s", start: 0 }), behavior: ["evaluate", "isBookable", "projectForAudience", "previewPolicyChanges"].filter(key => key in entry) }));',
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual({
    version: 1,
    request: { patientId: "p", serviceId: "s", start: 0 },
    behavior: [],
  });
});
