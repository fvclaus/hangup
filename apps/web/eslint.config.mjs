// @ts-check

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import nextPlugin from "@next/eslint-plugin-next";
import path from "path";
import { fileURLToPath } from "url";
import json from "@eslint/json";
import css from "@eslint/css";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "playwright/**",
      "playwright-report/**",
      "test-results/**",
      "*.d.ts",
      // Add any other patterns for generated files, logs, etc.
    ],
  },
  {
    files: [
      "src/**/*.{js,mjs,cjs,ts,jsx,tsx}",
      "tests/**/*.{js,mjs,cjs,ts,jsx,tsx}",
    ],
    ...pluginJs.configs.all,
  },
  tseslint.configs.strictTypeChecked.map((c) => ({
    files: ["src/**/*.{ts,jsx,tsx}", "tests/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    ...c,
  })),
  // {
  // },
  eslintPluginPrettierRecommended,
  nextPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      "max-lines-per-function": "off",
      "sort-imports": "off",
      "no-magic-numbers": "off",
      "sort-vars": "off",
      "one-var": "off",
      "no-warning-comments": "off",
      "capitalized-comments": "off",
      "sort-keys": "off",
      "max-statements": "off",
      "func-style": "off",
      "no-undefined": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "id-length": "off",
      "max-lines": "off",
      "no-ternary": "off",
      "no-underscore-dangle": "off",
      "no-nested-ternary": "off",
      camelcase: "off",
      "no-void": ["error", { allowAsStatement: true }],
      "@typescript-eslint/no-meaningless-void-operator": "off",
    },
  },
  {
    files: ["tsconfig.json", "package.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
    plugins: {
      json,
    },
    ...json.configs.recommended,
  },
  {
    files: ["./vscode/*.json"],
    language: "json/jsonc",
    plugins: {
      json,
    },
    ...json.configs.recommended,
  },
);
