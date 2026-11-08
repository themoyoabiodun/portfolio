import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  // Standalone Toolcraft apps carry their own lint and verification.
  globalIgnores([".next/**", "node_modules/**", "tools/**"]),
]);
