import { test, expect } from "@playwright/test";
import { mockApi } from "./support/mockApi";
import { loginFromUi } from "./support/login";
import { AGENT, TICKET, session } from "./support/fixtures";

const agentRoutes = [
  ["POST", "/auth/login", session(AGENT)],
  ["GET", "/auth/me", { body: AGENT }],
  ["GET", "/tickets", { body: { content: [TICKET], totalElements: 1, totalPages: 1, number: 0 } }],
  ["GET", `/staff/tickets/${TICKET.id}`, { body: TICKET }],
  // 403 = el ticket no es del agente (no lo creó él), así que el panel de gestión queda habilitado.
  ["GET", `/tickets/${TICKET.id}`, { status: 403, body: { message: "No es tu ticket" } }],
  ["GET", `/tickets/${TICKET.id}/messages`, { body: [] }],
  ["GET", `/staff/tickets/${TICKET.id}/cancellation-requests`, { body: [] }],
  ["GET", `/staff/tickets/${TICKET.id}/cancellation-conflicts`, { body: [] }],
  ["GET", `/staff/tickets/${TICKET.id}/reclassification-proposals`, { body: [] }],
  ["GET", "/staff/labels", { body: [] }],
  ["GET", "/catalog/categories", { body: [] }],
  ["GET", "/catalog/neighborhoods", { body: [] }],
];

test("el agente inicia sesión, ve la bandeja y abre un ticket", async ({ page }) => {
  const api = await mockApi(page, agentRoutes);

  await loginFromUi(page, { email: AGENT.email, password: "clave-de-prueba" });
  await page.goto("/agente/tickets");

  await expect(page.getByText(TICKET.summary)).toBeVisible();
  await page.getByText(TICKET.summary).click();

  await expect(page).toHaveURL(new RegExp(`/agente/tickets/${TICKET.id}`));
  await expect(page.getByText(TICKET.description)).toBeVisible();
  api.expectNoUnmockedRequests();
});

test("el agente responde al ciudadano desde el ticket con un mensaje público", async ({ page }) => {
  const sent = { id: 1, visibility: "PUBLIC", text: "Enviamos una cuadrilla mañana.", authorType: "AGENT", authorId: AGENT.id, createdAt: "2026-11-04T10:00:00Z" };
  const api = await mockApi(page, [
    ...agentRoutes,
    ["POST", `/tickets/${TICKET.id}/messages`, { status: 201, body: sent }],
  ]);

  await loginFromUi(page, { email: AGENT.email, password: "clave-de-prueba" });
  await page.goto(`/agente/tickets/${TICKET.id}`);

  await page.getByPlaceholder("Escribe un comentario o respuesta...").fill(sent.text);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();

  await expect(page.getByText(sent.text)).toBeVisible();
  const [envio] = api.callsTo("POST", `/tickets/${TICKET.id}/messages`);
  expect(JSON.parse(envio.body)).toEqual({ visibility: "PUBLIC", text: sent.text });
  api.expectNoUnmockedRequests();
});
