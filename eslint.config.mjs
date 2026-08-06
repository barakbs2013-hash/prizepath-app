import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Several server components intentionally read loosely-typed
      // Supabase join results (no generated DB types in this MVP) —
      // breadth over strict typing here was a deliberate tradeoff.
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
