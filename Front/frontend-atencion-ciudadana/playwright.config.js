import { defineConfig, devices } from "@playwright/test";

// E2E en navegador real contra la app compilada. La API está mockeada en cada
// prueba (ver e2e/support/mockApi.js): validan los flujos del front de punta a
// punta sin depender del back ni de datos de una base.
const PORT = 4173;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  forbidOnly: CI,
  retries: 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  },
  projects: [
    // En CI usa el Chrome ya instalado en el runner; no hay que descargar navegadores.
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
