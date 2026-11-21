import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["development"] },
  test: {
    include: ["packages/*/test/**/*.test.ts", "apps/api/test/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.git/**", "**/*.pg.test.ts"],
  },
});
