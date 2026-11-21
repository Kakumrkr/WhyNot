import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const playwright = fileURLToPath(import.meta.resolve("@playwright/test/cli"));
// Give each group a fresh API process so the browser traffic respects the demo rate limit.
for (const project of ["desktop-1280", "mobile-390"]) {
  for (const [group, suite] of [
    ["booking", "booking.full.spec.ts"],
    ["parity", "parity.spec.ts"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        playwright,
        "test",
        "--config",
        "playwright.full.config.ts",
        "--project",
        project,
        "--output",
        `../../.tools/playwright-full/${project}/${group}`,
        suite,
      ],
      { stdio: "inherit" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
