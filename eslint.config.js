import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
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
  eslintConfigPrettier,
];
