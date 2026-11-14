import { test, expect } from "@playwright/test";
import { mockApi } from "./support/mockApi";
import { loginFromUi } from "./support/login";
import { CITIZEN, TICKET, session } from "./support/fixtures";

test("el ciudadano inicia sesión, ve sus reclamos y abre el detalle", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/auth/login", session(CITIZEN)],
    ["GET", "/auth/me", { body: CITIZEN }],
    ["GET", "/me/tickets", { body: { content: [TICKET], last: true, totalPages: 1 } }],
    ["GET", `/tickets/${TICKET.id}`, { body: TICKET }],
    ["GET", `/tickets/${TICKET.id}/messages`, { body: [] }],
    ["GET", `/tickets/${TICKET.id}/cancellation-requests`, { body: [] }],
    ["GET", "/catalog/categories", { body: [] }],
  ]);

  await loginFromUi(page, { email: CITIZEN.email, password: "clave-de-prueba" });
  await page.goto("/mis-reclamos");

  await expect(page.getByText(TICKET.summary)).toBeVisible();
  await page.getByRole("link", { name: /Ver detalles/ }).click();

  await expect(page).toHaveURL(new RegExp(`/mis-reclamos/${TICKET.publicId}`));
  await expect(page.getByRole("heading", { name: TICKET.summary })).toBeVisible();
  api.expectNoUnmockedRequests();
});
