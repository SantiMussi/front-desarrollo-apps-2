import { test, expect } from "@playwright/test";
import { mockApi } from "./support/mockApi";
import { loginFromUi } from "./support/login";
import { CATALOG, CITIZEN, session } from "./support/fixtures";

const TRACKING_CODE = "Zk82mPq4Tn7R";

const catalogRoutes = [
  ["GET", "/catalog/categories", { body: [CATALOG.category] }],
  ["GET", `/catalog/categories/${CATALOG.category.id}/subcategories`, { body: [CATALOG.subcategory] }],
  ["GET", `/catalog/subcategories/${CATALOG.subcategory.id}/request-types`, { body: [CATALOG.requestType] }],
  ["GET", `/catalog/request-types/${CATALOG.requestType.id}/form`, { body: CATALOG.form }],
  ["GET", "/catalog/neighborhoods", { body: [] }],
];

test("el ciudadano crea un reclamo: elige el trámite, completa el formulario, lo revisa y recibe el código", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/auth/login", session(CITIZEN)],
    ["GET", "/auth/me", { body: CITIZEN }],
    ...catalogRoutes,
    ["POST", "/tickets", { status: 201, body: { trackingCode: TRACKING_CODE } }],
  ]);

  await loginFromUi(page, { email: CITIZEN.email, password: "clave-de-prueba" });
  await page.goto("/portal-ayuda");

  await page.getByRole("button", { name: new RegExp(CATALOG.category.name) }).click();
  await page.getByRole("button", { name: new RegExp(CATALOG.subcategory.name) }).click();
  await page.getByRole("button", { name: new RegExp(CATALOG.requestType.name) }).click();

  await page.getByLabel(/Título \/ Resumen/).fill("Luminaria apagada frente al 742");
  await page.getByLabel(/Descripción detallada/).fill("Hace una semana que la luz de la calle no enciende.");
  await page.getByLabel(/Número de luminaria/).fill("L-1234");
  await page.getByRole("button", { name: "Revisar y enviar" }).click();

  // Resumen previo: el ciudadano ve lo que va a enviar y recién ahí confirma.
  await expect(page.getByText("L-1234")).toBeVisible();
  expect(api.callsTo("POST", "/tickets")).toHaveLength(0);
  await page.getByRole("button", { name: "Confirmar y enviar" }).click();

  await expect(page.getByText(TRACKING_CODE)).toBeVisible();
  const [envio] = api.callsTo("POST", "/tickets");
  expect(JSON.parse(envio.body)).toMatchObject({
    summary: "Luminaria apagada frente al 742",
    description: "Hace una semana que la luz de la calle no enciende.",
  });
  expect(envio.body).toContain("L-1234");
  api.expectNoUnmockedRequests();
});
