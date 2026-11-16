import { expect, test } from "vitest";
import * as entry from "../src/index.js";

test("contracts ESM entry loads without side effects", () => {
  expect(Object.keys(entry)).toEqual([]);
});
