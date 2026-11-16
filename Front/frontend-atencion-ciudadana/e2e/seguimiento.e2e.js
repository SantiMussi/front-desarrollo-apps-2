import { test, expect } from "@playwright/test";
import { mockApi } from "./support/mockApi";
import { TICKET } from "./support/fixtures";

const TRACKING_CODE = "aB3dE5fG7hJ9";

test("cualquier persona consulta el estado de su reclamo con el código de seguimiento", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/tracking/access", { body: { ...TICKET, currentStatus: "IN_PROGRESS" } }],
    ["GET", "/catalog/categories", { body: [] }],
  ]);

  await page.goto("/seguimiento");
  await page.getByPlaceholder(/Ej\.: a1B2c3D4e5F6/).fill(TRACKING_CODE);
  await page.getByRole("button", { name: "Consultar" }).click();

  await expect(page.getByText(TICKET.publicId)).toBeVisible();
  await expect(page.getByText(TICKET.summary)).toBeVisible();
  await expect(page.getByText("En gestión").first()).toBeVisible();

  const [consulta] = api.callsTo("POST", "/tracking/access");
  expect(JSON.parse(consulta.body)).toEqual({ trackingCode: TRACKING_CODE });
  api.expectNoUnmockedRequests();
});

test("un código inexistente muestra un error y no datos de ningún reclamo", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/tracking/access", { status: 404, body: { message: "No encontramos ese ticket." } }],
    ["GET", "/catalog/categories", { body: [] }],
  ]);

  await page.goto("/seguimiento");
  await page.getByPlaceholder(/Ej\.: a1B2c3D4e5F6/).fill("codigo-inexistente");
  await page.getByRole("button", { name: "Consultar" }).click();

  await expect(page.getByText(/No encontramos/)).toBeVisible();
  await expect(page.getByText(TICKET.summary)).toHaveCount(0);
  api.expectNoUnmockedRequests();
});
