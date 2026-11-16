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
        // Enforce the requested project-wide quality gate over every production module.
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});