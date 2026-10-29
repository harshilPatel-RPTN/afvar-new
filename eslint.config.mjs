import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Team contract: a module is consumed only through its index.ts public API
      // (or kit.ts, its client-safe subset, when index.ts pulls in server-only code).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*", "!@/modules/*/index", "!@/modules/*/server", "!@/modules/*/kit"],
              message:
                "Import a module only through its index.ts public API (@/modules/<name>), its kit.ts client-safe entry, or its server.ts entry for route handlers.",
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
  ]),
]);

export default eslintConfig;
