import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { mockApi } from "./support/mockApi";

const VIEWPORTS = [360, 768, 1280];
const PUBLIC_ROUTES = [
  { path: "/", name: "inicio" },
  { path: "/portal-ayuda", name: "portal-ayuda" },
  { path: "/seguimiento", name: "seguimiento" },
  { path: "/ingresar", name: "ingresar" },
];

test("las pantallas públicas no desbordan horizontalmente en los breakpoints requeridos", async ({ page }, testInfo) => {
  // Recorre 12 combinaciones y guarda una captura completa por cada una.
  test.setTimeout(120_000);

  const api = await mockApi(page, [["GET", "/catalog/categories", { body: [] }]]);

  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path);
      await page.waitForTimeout(2400); // La app muestra un splash inicial de 2,3 s.
      await expect(page.locator("body")).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        contentWidth: document.documentElement.scrollWidth,
      }));
      expect(
        dimensions.contentWidth,
        `${route.path} desborda a ${width}px (${dimensions.contentWidth}px de contenido)`,
      ).toBeLessThanOrEqual(dimensions.viewportWidth);

      const screenshotDir = testInfo.outputPath("responsive");
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: `${screenshotDir}/${route.name}-${width}px.png`,
        fullPage: true,
      });
    }
  }

  api.expectNoUnmockedRequests();
});
