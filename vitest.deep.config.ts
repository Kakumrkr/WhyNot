import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.js";

// Milestone-gate run (D-071): same suite at 5000 property cases. Setting the
// variable here instead of in the npm script keeps it working on Windows shells.
export default mergeConfig(base, defineConfig({ test: { env: { FC_NUM_RUNS: "5000" } } }));
