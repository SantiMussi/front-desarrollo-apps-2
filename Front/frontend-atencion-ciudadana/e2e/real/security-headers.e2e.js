import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { CATALOG, CITIZEN, TICKET, session } from "../support/fixtures.js";
import { loginFromUi } from "../support/login.js";
import { mockApi } from "../support/mockApi.js";

const fixturePath = (name) => resolve(process.env.M2_E2E_BACKEND_DIR || "../../../Backend-DAMII", "src/test/resources/attachments", name);

async function captureCspViolations(page) {
  const violations = [];
  await page.exposeFunction("recordCspViolation", (value) => violations.push(value));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", ({ effectiveDirective, blockedURI }) =>
      window.recordCspViolation({ effectiveDirective, blockedURI }));
  });
  return violations;
}

test("la CSP del portal conserva el script local, Analytics y el mapa embebido", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const violations = await captureCspViolations(page);
  await page.route((url) => url.origin !== origin, (route) => route.abort());
  await page.route("https://www.googletagmanager.com/gtag/js?*", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "fetch('https://www.google-analytics.com/g/collect', { method: 'POST', mode: 'no-cors', body: 'qa' });",
  }));
  await page.route("https://www.google-analytics.com/g/collect", (route) => route.fulfill({ status: 204 }));
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("https://www.openstreetmap.org/**", (route) => route.fulfill({
    contentType: "text/html",
    body: "<p>Mapa de prueba</p>",
  }));

  const analytics = page.waitForResponse("https://www.google-analytics.com/g/collect");
  const stylesheet = page.waitForResponse((response) => new URL(response.url()).hostname === "fonts.googleapis.com");
  const home = await page.goto("/");
  const policy = home.headers()["content-security-policy"];
  expect(policy).toContain("frame-ancestors 'none'");
  expect(home.headers()["content-security-policy-report-only"]).toBeUndefined();
  expect(policy.match(/(?:^|; )script-src ([^;]+)/)[1]).toBe("'self' https://www.googletagmanager.com");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await page.evaluate(() => window.dataLayer.some((entry) => entry[0] === "config"))).toBe(true);
  expect((await analytics).status()).toBe(204);
  expect((await stylesheet).ok()).toBe(true);
  await expect(page.frameLocator('iframe[title="Mapa de Bacheo"]').getByText("Mapa de prueba")).toBeVisible();

  const deepLink = await page.goto("/seguimiento");
  expect(deepLink.headers()["content-security-policy"]).toBe(policy);
  await expect(page.getByRole("button", { name: "Consultar", exact: true })).toBeVisible();
  expect(violations).toEqual([]);
});

test("la CSP permite teselas, geocodificación y marcadores en el formulario", async ({ page }) => {
  const violations = await captureCspViolations(page);
  await mockApi(page, [
    ["GET", "/catalog/categories", { body: [CATALOG.category] }],
    ["GET", `/catalog/categories/${CATALOG.category.id}/subcategories`, { body: [CATALOG.subcategory] }],
    ["GET", `/catalog/subcategories/${CATALOG.subcategory.id}/request-types`, { body: [CATALOG.requestType] }],
    ["GET", `/catalog/request-types/${CATALOG.requestType.id}/form`, { body: CATALOG.form }],
    ["GET", "/catalog/neighborhoods", { body: [] }],
  ]);
  await page.route((url) => ["server.arcgisonline.com", "raw.githubusercontent.com", "cdnjs.cloudflare.com"].includes(url.hostname),
    (route) => route.fulfill({ contentType: "image/png", path: fixturePath("valid.png") }));
  await page.route("https://nominatim.openstreetmap.org/search?*", (route) => route.fulfill({
    headers: { "Access-Control-Allow-Origin": "*" },
    json: [{ lat: "-34.61", lon: "-58.42", display_name: "Av. de prueba 100", address: {} }],
  }));
  await page.goto("/portal-ayuda");
  for (const item of [CATALOG.category, CATALOG.subcategory, CATALOG.requestType]) {
    await page.getByRole("button", { name: new RegExp(item.name) }).click();
  }
  const geocode = page.waitForResponse("https://nominatim.openstreetmap.org/search?*");
  await page.getByLabel("Calle", { exact: true }).fill("Av. de prueba");
  expect((await geocode).ok()).toBe(true);
  await expect(page.getByText("Coordenadas: -34.610000, -58.420000")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  expect(violations).toEqual([]);
});

test("la CSP permite previsualizar imágenes y PDFs adjuntos", async ({ page }) => {
  const violations = await captureCspViolations(page);
  const attachments = [
    { id: "image", fileName: "valid.png", contentType: "image/png", sizeBytes: 92 },
    { id: "pdf", fileName: "valid.pdf", contentType: "application/pdf", sizeBytes: 1557 },
  ];
  await mockApi(page, [
    ["POST", "/auth/login", session(CITIZEN)],
    ["GET", "/auth/me", { body: CITIZEN }],
    ["GET", "/me/tickets", { body: { content: [TICKET], last: true, totalPages: 1 } }],
    ["GET", `/tickets/${TICKET.id}`, { body: { ...TICKET, attachments } }],
    ["GET", `/tickets/${TICKET.id}/messages`, { body: [] }],
    ["GET", `/tickets/${TICKET.id}/cancellation-requests`, { body: [] }],
    ["GET", "/catalog/categories", { body: [] }],
  ]);
  for (const attachment of attachments) {
    await page.route(`**/api/attachments/${attachment.id}/content`, (route) => route.fulfill({
      contentType: attachment.contentType,
      path: fixturePath(attachment.fileName),
    }));
  }
  await loginFromUi(page, { email: CITIZEN.email, password: "clave-de-prueba" });
  await page.goto("/mis-reclamos");
  await page.getByRole("link", { name: /Ver detalles/ }).click();
  await page.getByRole("button", { name: "Ver valid.png" }).click();
  const image = page.getByRole("img", { name: "valid.png" });
  await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cerrar vista previa" }).click();
  await page.getByRole("button", { name: "Ver valid.pdf" }).click();
  const pdf = page.locator('iframe[title="PDF valid.pdf"]');
  await expect(pdf).toBeVisible();
  await expect.poll(async () => (await pdf.contentFrame().locator("body").count()) > 0).toBe(true);
  expect(violations).toEqual([]);
});
