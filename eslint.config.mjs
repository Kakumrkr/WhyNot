import js from "@eslint/js";
import tseslint from "typescript-eslint";
import {
  boundaries,
  completeTests,
  browserEnvironment,
  purityGlobals,
} from "./eslintBoundaries.mjs";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", ".tools/**"] },
  { linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      whynot: {
        rules: {
          boundaries,
          "complete-tests": completeTests,
          "browser-environment": browserEnvironment,
        },
      },
    },
    rules: {
      "whynot/boundaries": "error",
      "whynot/complete-tests": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Use named exports." },
      ],
    },
  },
  {
    files: ["**/*.config.{ts,mjs}"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["packages/engine/src/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-restricted-globals": ["error", ...purityGlobals],
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Use named exports." },
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: "No randomness in engine.",
        },
        {
          selector: "MemberExpression[object.name='Math'][property.value='random']",
          message: "No randomness in engine.",
        },
        {
          selector: "VariableDeclarator[init.name='Math']",
          message: "Do not alias Math; call deterministic functions directly.",
        },
        {
          selector:
            "MemberExpression[object.name='Math'][computed=true]:not([property.type='Literal'])",
          message: "Use a static deterministic Math member.",
        },
      ],
    },
  },
  {
    files: [
      "apps/web/src/**/*.{ts,tsx,js,mjs}",
      "packages/narrator/src/**/*.{ts,tsx,js,mjs}",
      "packages/contracts/src/**/*.{ts,tsx,js,mjs}",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        { globals: ["process", "require"], checkGlobalObject: true },
      ],
      "whynot/browser-environment": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Use named exports." },
        {
          selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
          message: "Browser source must not read environment settings.",
        },
        {
          selector: "MemberExpression[object.type='MetaProperty'][property.value='env']",
          message: "Browser source must not read environment settings.",
        },
      ],
    },
  },
];
