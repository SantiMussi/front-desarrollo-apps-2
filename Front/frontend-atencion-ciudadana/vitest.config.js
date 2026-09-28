import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Keep the coverage inventory honest.  A hand-maintained allow-list used to
      // report only 12 modules and silently ignored the other production files.
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/**/__tests__/**", "src/test/**"],
      thresholds: {
        // Baseline for the complete 100-file inventory.  Raise these values as
        // focused behavioural suites are added; unlike the previous 85% gate,
        // this can no longer pass by omitting 88 files from the denominator.
        statements: 7,
        branches: 3,
        functions: 4,
        lines: 8,
      },
    },
  },
});