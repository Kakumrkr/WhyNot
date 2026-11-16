import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("engine built package entry loads in native Node ESM", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'const entry = await import("@whynot/engine"); console.log(JSON.stringify({ epoch: entry.parseOffsetInstant("1970-01-01T00:00:00Z"), future: ["evaluate", "isBookable", "projectForAudience", "previewPolicyChanges"].filter(key => key in entry) }));',
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual({ epoch: { ok: true, value: 0 }, future: [] });
});
