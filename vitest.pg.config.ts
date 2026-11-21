import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { conditions: ["development"] },
  // Each file applies the migration that installs the shared btree_gist extension.
  test: { include: ["apps/api/test/**/*.pg.test.ts"], fileParallelism: false },
});
