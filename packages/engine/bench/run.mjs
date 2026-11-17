import { performance } from "node:perf_hooks";
import { cpus, platform, arch, totalmem } from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import console from "node:console";
import { URL } from "node:url";
import { evaluate, isBookable } from "../dist/index.js";
import { buildScenario, riversideMinute } from "../../fixtures/dist/index.js";

const warmup = 1000;
const samples = 300;
const now = riversideMinute(0, "09:00");
const scenarios = Array.from({ length: 8 }, (_, i) => {
  const golden = JSON.parse(
    readFileSync(new URL(`../../fixtures/scenarios/H${i + 1}.json`, import.meta.url), "utf8"),
  );
  return {
    snapshot: buildScenario(golden.id),
    request: {
      patientId: golden.patientId,
      serviceId: golden.serviceId,
      start: riversideMinute(golden.day, golden.time),
      ...(golden.practitionerId === undefined ? {} : { practitionerId: golden.practitionerId }),
    },
  };
});

function scale(snapshot, resources, bookings) {
  const copy = JSON.parse(JSON.stringify(snapshot));
  for (const field of ["practitioners", "rooms", "equipment"]) {
    copy[field] = Array.from({ length: resources }, (_, i) =>
      snapshot[field].map((entry) => ({
        ...entry,
        id: i === 0 ? entry.id : `${entry.id}-copy-${i}`,
      })),
    ).flat();
  }
  copy.bookings = Array.from({ length: bookings }, (_, i) =>
    snapshot.bookings.map((b) => ({
      ...b,
      id: `${b.id}-copy-${i}`,
      practitionerId: i === 0 ? b.practitionerId : `${b.practitionerId}-copy-${i % resources}`,
      roomId: i === 0 ? b.roomId : `${b.roomId}-copy-${i % resources}`,
      ...(b.equipmentId === undefined
        ? {}
        : { equipmentId: i === 0 ? b.equipmentId : `${b.equipmentId}-copy-${i % resources}` }),
    })),
  ).flat();
  return copy;
}

const environment = {
  node: process.version,
  pnpm: "12.21.0",
  platform: platform(),
  arch: arch(),
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  memoryBytes: totalmem(),
};
const datasets = {};
for (const [name, resources, bookings] of [
  ["S", 1, 1],
  ["M", 3, 2],
  ["L", 10, 1],
]) {
  const cases = scenarios.map((entry) => ({
    ...entry,
    snapshot: scale(entry.snapshot, resources, bookings),
  }));
  const metrics = {};
  for (const operation of ["isBookable", "evaluate"]) {
    const run = (i) => {
      const entry = cases[i % cases.length];
      return operation === "isBookable"
        ? isBookable(entry.snapshot, entry.request, now)
        : evaluate(entry.snapshot, entry.request, {
            now,
            alternatives: false,
            includeAdminFix: false,
          });
    };
    for (let i = 0; i < warmup; i++) run(i);
    const durations = [];
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      run(i);
      durations.push(performance.now() - start);
    }
    durations.sort((a, b) => a - b);
    metrics[operation] = {
      p50Ms: durations[Math.ceil(samples * 0.5) - 1],
      p95Ms: durations[Math.ceil(samples * 0.95) - 1],
    };
    console.log(`${name} ${operation}: ${JSON.stringify(metrics[operation])}`);
  }
  datasets[name] = {
    resources: resources,
    bookings: bookings,
    scenarioBookingCounts: cases.map((entry) => entry.snapshot.bookings.length),
    ...metrics,
  };
}
const report = {
  schemaVersion: 1,
  environment,
  warmup,
  samples,
  dataset: "H1–H8 round robin; M 3x resources/2x bookings, L 10x resources/1x bookings",
  datasets,
};
console.log(JSON.stringify(report, null, 2));
const output = process.argv.indexOf("--write");
if (output >= 0) writeFileSync(process.argv[output + 1], JSON.stringify(report, null, 2) + "\n");
for (const [operation, target] of [
  ["isBookable", 2],
  ["evaluate", 20],
]) {
  if (datasets.S[operation].p95Ms > target)
    throw new Error(`${operation} S p95 exceeds ${target}ms`);
}
const baselinePath = new URL(`./baseline-${platform()}.json`, import.meta.url);
let baseline;
try {
  baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (baseline !== undefined) {
  const comparable = ["node", "platform", "arch", "cpu", "logicalCpus"].every(
    (key) => baseline.environment[key] === environment[key],
  );
  if (comparable) {
    for (const operation of ["isBookable", "evaluate"])
      if (datasets.S[operation].p95Ms > baseline.datasets.S[operation].p95Ms * 1.5)
        throw new Error(`${operation} S p95 regressed by >50%`);
  } else
    console.log(
      "Hardware/runtime differs from baseline; absolute S gates checked, relative comparison unavailable.",
    );
} else
  console.log(
    "Initial environment baseline: absolute S gates checked; record this report for future regression checks.",
  );
