import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("fixtures built package entry loads in native Node ESM", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'const entry = await import("@whynot/fixtures"); console.log(JSON.stringify({ exports: Object.keys(entry).sort(), now: entry.demoNow, snapshot: entry.buildMinimalSnapshot().clinic.id }));',
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual({
    exports: [
      "buildMinimalRequest",
      "buildMinimalSnapshot",
      "buildRiverside",
      "buildScenario",
      "demoNow",
      "riversideMinute",
    ],
    now: 29913660,
    snapshot: "clinic-test",
  });
});
