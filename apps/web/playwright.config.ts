import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "../../.tools/playwright",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: baseURL,
  },
  projects: [
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-390",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
});
