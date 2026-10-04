import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  globalIgnores(["src/generated/**", ".next/**", "node_modules/**", "data/**"]),
  nextCoreWebVitals,
  nextTypescript,
  {
    // The test preload hook must be CommonJS: it patches Module._resolveFilename
    // before tsx loads anything else.
    files: ["tests/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);
