import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { log } from "node:console";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";

const pnpm = process.env.npm_execpath;
assert(pnpm, "Run with pnpm exec node examples/node/verify-packages.mjs");
const root = fileURLToPath(new URL("../../", import.meta.url));
const temporaryRoot = realpathSync(tmpdir());
const consumer = mkdtempSync(join(temporaryRoot, "whynot-consumer-"));
const child = relative(temporaryRoot, consumer);
assert(!isAbsolute(child) && !child.includes(sep) && child.startsWith("whynot-consumer-"));
const location = relative(root, consumer);
assert(isAbsolute(location) || location.startsWith(`..${sep}`), "Use a temp folder outside WhyNot");

const libraries = {
  contracts: { entries: [".", "./schemas"], dependencies: ["zod"] },
  engine: { entries: ["."], dependencies: ["@whynot/contracts", "luxon"] },
  narrator: { entries: [".", "./templates"], dependencies: ["@whynot/contracts"] },
};

function runPnpm(args, cwd) {
  if (/\.[cm]?js$/u.test(pnpm)) {
    execFileSync(process.execPath, [pnpm, ...args], { cwd, stdio: "inherit" });
  } else {
    execFileSync(pnpm, args, { cwd, stdio: "inherit" });
  }
}

try {
  const packs = join(consumer, "packs");
  mkdirSync(packs);
  const dependencies = {};
  for (const name of Object.keys(libraries)) {
    runPnpm(["pack", "--pack-destination", packs], join(root, "packages", name));
    const archive = readdirSync(packs).find((file) => file.startsWith(`whynot-${name}-`));
    assert(archive, `Missing archive for ${name}`);
    dependencies[`@whynot/${name}`] = `file:./packs/${archive}`;
  }
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies }),
  );
  writeFileSync(
    join(consumer, "pnpm-workspace.yaml"),
    `overrides:\n  '@whynot/contracts': ${dependencies["@whynot/contracts"]}\n`,
  );
  runPnpm(["install", "--ignore-scripts", "--prefer-offline"], consumer);

  for (const [name, expected] of Object.entries(libraries)) {
    const path = join(consumer, "node_modules", "@whynot", name);
    assert(realpathSync(path).startsWith(`${consumer}${sep}`), "Expected an installed archive");
    const manifest = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    assert.deepEqual(Object.keys(manifest.dependencies).sort(), expected.dependencies);
    assert.deepEqual(Object.keys(manifest.exports), expected.entries);
    for (const entry of Object.values(manifest.exports)) {
      assert.deepEqual(Object.keys(entry), ["types", "import"]);
    }
    const files = readdirSync(path, { recursive: true, withFileTypes: true });
    for (const file of files) {
      const parts = relative(path, join(file.parentPath, file.name)).split(sep);
      if (parts[0] === "dist") {
        assert(
          parts.every(
            (part) =>
              !/^(?:tests?|fixtures?|reference|generators?|providers?)(?:\.|$)|\.(?:test|spec)\./iu.test(
                part,
              ),
          ),
        );
        if (file.isFile()) assert(/\.(?:d\.ts|js)$/u.test(file.name));
      } else {
        assert(["package.json", "LICENSE", "README.md"].includes(parts.join("/")));
      }
    }
  }
  for (const file of ["snapshot.json", "check-appointment.mjs", "check-exports.mts"]) {
    copyFileSync(join(import.meta.dirname, file), join(consumer, file));
  }
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules", "typescript", "lib", "tsc.js"),
      "--strict",
      "--module",
      "nodenext",
      "--target",
      "es2022",
      "--noEmit",
      "check-exports.mts",
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  execFileSync(process.execPath, ["check-exports.mts"], { cwd: consumer, stdio: "inherit" });
  execFileSync(process.execPath, ["check-appointment.mjs"], { cwd: consumer, stdio: "inherit" });
  log("Packed ESM runtime and declaration checks passed.");
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
