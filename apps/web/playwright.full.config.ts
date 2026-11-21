import { defineConfig } from "@playwright/test";
import staticConfig from "./playwright.config.js";

const baseURL = "http://127.0.0.1:4174";

export default defineConfig({
  ...staticConfig,
  testIgnore: [],
  testMatch: ["**/parity.spec.ts", "**/*.full.spec.ts"],
  outputDir: "../../.tools/playwright-full",
  // Both viewports exercise the same seeded booking scopes and undo their writes.
  workers: 1,
  use: { ...staticConfig.use, baseURL },
  webServer: [
    {
      command: "pnpm --filter @whynot/api start",
      url: "http://127.0.0.1:8787/api/health",
      env: { DEMO_RESET_ENABLED: "true" },
    },
    {
      command: "pnpm exec vite preview --mode full --host 127.0.0.1 --port 4174 --strictPort",
      url: baseURL,
    },
  ],
});
