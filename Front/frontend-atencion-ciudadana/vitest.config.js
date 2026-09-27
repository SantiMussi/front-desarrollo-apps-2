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
      include: [
        "src/constants/**/*.js",
        "src/hooks/useAllAgentTickets.js",
        "src/hooks/useAgentTickets.js",
        "src/utils/catalogErrors.js",
        "src/utils/duplicateLink.js",
        "src/utils/ticketIndicators.js",
        "src/utils/ticketLocation.js",
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});