import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // De design-handoff is referentiemateriaal en wordt nooit meegebouwd — zie
    // CLAUDE.md. `reference/` is met opzet plat HTML en CSS, en `prototype/` is
    // een gegenereerde runtime. Ze langs de linter halen levert alleen meldingen
    // op over code die niemand gaat aanpassen.
    "design/**",
  ]),
]);

export default eslintConfig;
