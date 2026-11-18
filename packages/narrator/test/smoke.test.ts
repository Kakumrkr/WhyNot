import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("narrator built package entry loads in native Node ESM", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const { TemplateNarrator } = await import("@whynot/narrator");
       const result = TemplateNarrator.renderPatient({ status: "invalid_request",
         errors: [{ code: "off_grid", field: "start" }] }, { timeZone: "UTC" });
       console.log(JSON.stringify([result.source, result.status]));`,
    ],
    { cwd: fileURLToPath(new URL("..", import.meta.url)), encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual(["template", "invalid_request"]);
});
