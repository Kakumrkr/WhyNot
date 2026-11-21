import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["development"] },
  test: { include: ["apps/api/test/**/*.pg.test.ts"] },
});
