import { ESLint } from "eslint";
import { expect, test } from "vitest";

const eslint = new ESLint();

const invalid = [
  ["packages/engine/src/rules.ts", 'import fs from "node:fs"; void fs;', "whynot/boundaries"],
  ["packages/engine/src/rules.ts", 'export * from "@whynot/narrator";', "whynot/boundaries"],
  [
    "packages/engine/src/rules.ts",
    'import { DateTime } from "luxon"; void DateTime;',
    "whynot/boundaries",
  ],
  ["packages/engine/src/rules.ts", 'import "../test/reference/check.js";', "whynot/boundaries"],
  ["packages/engine/src/rules.ts", 'import "../../contracts/src/index.js";', "whynot/boundaries"],
  ["packages/engine/src/rules.ts", 'void import("node:fs");', "whynot/boundaries"],
  [
    "packages/engine/src/rules.ts",
    'const target = "node:fs"; void import(target);',
    "whynot/boundaries",
  ],
  ["packages/engine/src/rules.ts", "Date.now();", "no-restricted-globals"],
  ["packages/engine/src/rules.ts", "globalThis.Date.now();", "no-restricted-globals"],
  ["packages/engine/src/rules.ts", "Math.random();", "no-restricted-syntax"],
  ["packages/engine/src/rules.ts", 'Math["random"]();', "no-restricted-syntax"],
  ["packages/engine/src/rules.ts", "const { random } = Math; random();", "no-restricted-syntax"],
  ["packages/engine/src/rules.ts", "console.log(1);", "no-restricted-globals"],
  ["packages/engine/src/rules.ts", 'fetch("https://example.com");', "no-restricted-globals"],
  ["packages/engine/src/rules.ts", "setTimeout(() => {}, 1);", "no-restricted-globals"],
  ["packages/narrator/src/index.ts", 'import "@whynot/engine";', "whynot/boundaries"],
  ["packages/contracts/src/index.ts", 'import "@whynot/engine";', "whynot/boundaries"],
  ["apps/web/src/App.tsx", 'import "@whynot/fixtures";', "whynot/boundaries"],
  [
    "apps/web/src/App.tsx",
    'import "../../../packages/fixtures/src/index.js";',
    "whynot/boundaries",
  ],
  ["apps/web/src/App.tsx", 'import "openai";', "whynot/boundaries"],
  ["apps/web/src/App.tsx", 'import "./credentials.server.js";', "whynot/boundaries"],
  ["apps/web/src/App.tsx", 'import "node:process";', "whynot/boundaries"],
  ["apps/web/src/App.tsx", "void process.env.OPENAI_API_KEY;", "no-restricted-globals"],
  ["apps/web/src/App.tsx", "void import.meta.env.VITE_SECRET;", "whynot/browser-environment"],
  [
    "apps/web/src/App.tsx",
    "const { env } = import.meta; void env.VITE_SECRET;",
    "whynot/browser-environment",
  ],
  [
    "apps/web/src/App.tsx",
    "const meta = import.meta; void meta.env;",
    "whynot/browser-environment",
  ],
  ["apps/web/src/App.tsx", "void globalThis.process.env.SECRET;", "no-restricted-globals"],
  [
    "apps/web/src/adapter/staticAdapter.ts",
    'import "@whynot/fixtures/test/generators";',
    "whynot/boundaries",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { test } from "vitest"; test.skip("bad", () => {});',
    "whynot/complete-tests",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { test } from "vitest"; test["only"]("bad", () => {});',
    "whynot/complete-tests",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { test } from "vitest"; test.todo("bad");',
    "whynot/complete-tests",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { xtest as test } from "vitest"; test("bad", () => {});',
    "whynot/complete-tests",
  ],
  [
    "packages/contracts/src/index.ts",
    "export const value: any = 1;",
    "@typescript-eslint/no-explicit-any",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { test } from "vitest"; const { skip } = test; skip("bad", () => {});',
    "whynot/complete-tests",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import { test } from "vitest"; const { only: focus } = test; focus("bad", () => {});',
    "whynot/complete-tests",
  ],
  [
    "packages/engine/test/sample.test.ts",
    'import * as suite from "vitest"; suite.xtest("bad", () => {});',
    "whynot/complete-tests",
  ],
];

test.each(invalid)("rejects %s: %s", async (filePath, code, ruleId) => {
  if (!filePath || !code) throw new Error("Malformed lint sample");
  const results = await eslint.lintText(code, { filePath });
  expect(results.flatMap((result) => result.messages).map((message) => message.ruleId)).toContain(
    ruleId,
  );
});

const valid = [
  ["packages/engine/src/rules.ts", 'import "./time.js"; import "@whynot/contracts";'],
  ["packages/engine/src/time.ts", 'import { DateTime } from "luxon"; void DateTime;'],
  ["packages/engine/src/rules.ts", "export const rounded = Math.floor(1.2);"],
  ["packages/contracts/src/index.ts", 'import "zod";'],
  ["packages/narrator/src/index.ts", 'import "@whynot/contracts";'],
  ["apps/web/src/adapter/staticAdapter.ts", 'import "@whynot/fixtures";'],
  ["packages/engine/test/sample.test.ts", 'import "@whynot/fixtures/test/generators";'],
  ["apps/web/src/App.tsx", 'import "react"; import "./App.js";'],
  ["apps/web/src/App.tsx", 'export const asset = new URL("./image.png", import.meta.url);'],
];

test.each(valid)("allows %s: %s", async (filePath, code) => {
  if (!filePath || !code) throw new Error("Malformed lint sample");
  const results = await eslint.lintText(code, { filePath });
  expect(results.flatMap((result) => result.messages)).toEqual([]);
});
