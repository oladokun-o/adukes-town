import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import sveltePlugin from "eslint-plugin-svelte";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

// Uses @typescript-eslint/parser + eslint-plugin directly rather than the
// `typescript-eslint` meta-package, which hard-errors on TS 7.x
// (https://github.com/typescript-eslint/typescript-eslint/issues/10940).
// The parser itself only soft-warns on unsupported TS versions.
export default [
  { ignores: ["dist", "dev-dist"] },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  ...sveltePlugin.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      // Lets the parser understand `<script lang="ts">` blocks.
      parserOptions: { parser: tsParser },
      globals: globals.browser,
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      // The base no-unused-vars (from js.configs.recommended, applied
      // globally) doesn't understand TS-only positions like parameter names
      // inside a function type — misfires inside `<script lang="ts">`.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars":
        tsPlugin.configs.recommended.rules["@typescript-eslint/no-unused-vars"],
    },
  },
  ...sveltePlugin.configs["flat/prettier"],
  eslintConfigPrettier,
];
