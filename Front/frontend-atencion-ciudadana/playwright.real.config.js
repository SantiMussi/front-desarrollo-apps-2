import { defineConfig } from "@playwright/test";
import mockConfig from "./playwright.config.js";

const baseURL = process.env.M2_E2E_URL;
if (!/^http:\/\/localhost:\d+$/.test(baseURL ?? "") || !process.env.M2_E2E_FIXTURE_PASSWORD) {
  throw new Error("Iniciá el entorno descartable con npm run test:e2e:real.");
}

export default defineConfig({
  ...mockConfig,
  testDir: "./e2e/real",
  testIgnore: [],
  outputDir: "test-results/real",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/real", open: "never" }]],
  use: { ...mockConfig.use, baseURL, serviceWorkers: "block" },
});
