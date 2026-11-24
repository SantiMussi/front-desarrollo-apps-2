import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.js",
  timeout: 180000,
  globalTimeout: 240000,
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});

