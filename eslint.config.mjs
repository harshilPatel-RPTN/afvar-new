import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Team contract: a module is consumed only through its index.ts public API
// (or kit.ts, its client-safe subset, when index.ts pulls in server-only code).
const MODULE_BOUNDARY = [
  {
    group: ["@/modules/*/*", "!@/modules/*/index", "!@/modules/*/server", "!@/modules/*/kit"],
    message:
      "Import a module only through its index.ts public API (@/modules/<name>), its kit.ts client-safe entry, or its server.ts entry for route handlers.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": ["error", { patterns: MODULE_BOUNDARY }],
    },
  },
  // The gold AI core is the home page's protagonist. Platform pages are connected
  // to the home, not copies of it: each shows its own centrepiece, built from the
  // shared material kit (AiSpark, GoldDust, GlassPlate, GlowLine).
  {
    files: ["src/modules/platform/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: MODULE_BOUNDARY,
          paths: [
            {
              name: "@/modules/afvarOs",
              importNames: ["AiCore", "CORE_SIZE"],
              message: "The gold AI core belongs to the home page only. Build this page's own centrepiece from the shared kit (AiSpark, GoldDust, GlassPlate, GlowLine).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // Retired code kept for reference (the owner's rule: move, never delete).
    "backup/**",
  ]),
]);

export default eslintConfig;
