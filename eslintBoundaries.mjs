import path from "node:path";
import { builtinModules } from "node:module";

const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const normalize = (value) => value.replaceAll("\\", "/");
const root = normalize(import.meta.dirname);
const engineGlobals = [
  "Date",
  "performance",
  "process",
  "console",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "queueMicrotask",
  "requestAnimationFrame",
  "crypto",
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "Worker",
  "SharedWorker",
  "require",
  "eval",
  "Function",
  "global",
  "globalThis",
];

/** Enforce source dependency edges for both package and relative-path imports. */
export const boundaries = {
  meta: {
    type: "problem",
    schema: [],
    messages: { forbidden: "Forbidden dependency: {{source}}" },
  },
  create(context) {
    const file = normalize(context.filename);
    const relative = file.slice(root.length + 1);
    const engine = relative.startsWith("packages/engine/src/");
    const browser = relative.startsWith("apps/web/src/");
    const production = relative.includes("/src/");
    const test = /(?:^|\/)(?:test|tests)\//u.test(relative);
    const owner = relative.match(/^packages\/([^/]+)\/src\//u)?.[1];
    const adapter = relative === "apps/web/src/adapter/staticAdapter.ts";

    function check(node, source) {
      if (!production && !test) return;
      let forbidden = typeof source !== "string";
      if (typeof source === "string") {
        const target = source.startsWith(".")
          ? normalize(path.resolve(path.dirname(file), source))
          : source;
        const local = target.startsWith(`${root}/`) ? target.slice(root.length + 1) : target;
        const isTest = /(?:^|\/)(?:test|tests|reference|generators)(?:\/|$)/u.test(local);
        const fixtures =
          local.startsWith("@whynot/fixtures") || local.startsWith("packages/fixtures/");
        if (production && isTest) forbidden = true;
        if (fixtures && !test && !adapter && owner !== "fixtures") forbidden = true;
        if (engine) {
          const internal = local.startsWith("packages/engine/src/");
          forbidden ||= !(
            internal ||
            source === "@whynot/contracts" ||
            (source === "luxon" && relative === "packages/engine/src/time.ts")
          );
        } else if (owner) {
          const allowed =
            owner === "contracts"
              ? ["zod"]
              : owner === "narrator"
                ? ["@whynot/contracts"]
                : ["@whynot/contracts", "@whynot/engine"];
          forbidden ||= !(local.startsWith(`packages/${owner}/src/`) || allowed.includes(source));
        }
        if (browser) {
          const allowed = [
            "react",
            "react-dom",
            "@whynot/contracts",
            "@whynot/engine",
            "@whynot/narrator",
          ];
          const browserLocal =
            local.startsWith("apps/web/src/") &&
            !/(?:^|\/)(?:server|api)(?:\/|\.)|\.server\./u.test(local);
          const safePackage = allowed.some(
            (name) => source === name || source.startsWith(`${name}/`),
          );
          forbidden ||=
            builtins.has(source) ||
            !(browserLocal || safePackage || (adapter && source === "@whynot/fixtures"));
        }
      }
      if (forbidden)
        context.report({ node, messageId: "forbidden", data: { source: String(source) } });
    }
    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        check(node, node.source.value);
      },
      TSImportType(node) {
        check(node, node.argument?.value ?? node.argument?.literal?.value);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          check(node, node.arguments[0]?.value);
        }
      },
    };
  },
};

/** Forbid focused, skipped, conditional and todo suites, including computed modifiers. */
export const completeTests = {
  meta: {
    type: "problem",
    schema: [],
    messages: { incomplete: "Tests must run unconditionally." },
  },
  create(context) {
    const modifiers = [
      "skip",
      "only",
      "todo",
      "skipIf",
      "runIf",
      "xtest",
      "xit",
      "xdescribe",
      "fit",
      "fdescribe",
    ];
    return {
      Property(node) {
        const name = node.computed ? node.key.value : node.key.name;
        if (node.parent.type === "ObjectPattern" && modifiers.includes(name)) {
          context.report({ node, messageId: "incomplete" });
        }
      },
      MemberExpression(node) {
        const name = node.computed ? node.property.value : node.property.name;
        if (modifiers.includes(name)) {
          context.report({ node, messageId: "incomplete" });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value === "vitest") {
          for (const specifier of node.specifiers) {
            if (
              ["xtest", "xit", "xdescribe", "fit", "fdescribe"].includes(specifier.imported?.name)
            ) {
              context.report({ node: specifier, messageId: "incomplete" });
            }
          }
        }
      },
    };
  },
};

/** Permit import.meta.url without allowing aliases to browser environment settings. */
export const browserEnvironment = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      env: "Browser source may use only import.meta.url; no environment or meta aliases.",
    },
  },
  create(context) {
    return {
      MetaProperty(node) {
        if (node.meta.name !== "import") return;
        const parent = node.parent;
        const name = parent.computed ? parent.property?.value : parent.property?.name;
        if (parent.type !== "MemberExpression" || name !== "url") {
          context.report({ node, messageId: "env" });
        }
      },
    };
  },
};

export const purityGlobals = engineGlobals.map((name) => ({
  name,
  message: "Engine inputs must be explicit and deterministic.",
}));
