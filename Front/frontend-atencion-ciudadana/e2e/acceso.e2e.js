import { test, expect } from "@playwright/test";
import { mockApi } from "./support/mockApi";
import { loginFromUi } from "./support/login";
import { CITIZEN, TICKET, session } from "./support/fixtures";

test("sin sesión, las pantallas privadas llevan al ingreso y no piden datos a la API", async ({ page }) => {
  const api = await mockApi(page, []);

  await page.goto("/mis-reclamos");
  await expect(page).toHaveURL(/\/ingresar/);

  await page.goto("/agente/tickets");
  await expect(page).toHaveURL(/\/ingresar/);

  expect(api.calls.filter((call) => /^\/(me\/)?tickets|^\/staff/.test(call.path))).toEqual([]);
  api.expectNoUnmockedRequests();
});

test("un ciudadano no puede entrar al panel del agente ni ve sus datos", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/auth/login", session(CITIZEN)],
    ["GET", "/auth/me", { body: CITIZEN }],
    ["GET", "/catalog/categories", { body: [] }],
  ]);

  await loginFromUi(page, { email: CITIZEN.email, password: "clave-de-prueba" });
  await page.goto("/agente/tickets");

  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
  await expect(page.getByText(TICKET.summary)).toHaveCount(0);
  expect(api.calls.filter((call) => /^\/(staff|tickets)/.test(call.path))).toEqual([]);
  api.expectNoUnmockedRequests();
});

test("credenciales incorrectas muestran el error y no inician sesión", async ({ page }) => {
  const api = await mockApi(page, [
    ["POST", "/auth/login", { status: 401, body: { message: "Credenciales inválidas" } }],
  ]);

  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(CITIZEN.email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-incorrecta");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();

  await expect(page.getByText("Credenciales inválidas")).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);
  expect(await page.evaluate(() => localStorage.getItem("ciudad-uade.auth-token"))).toBeNull();
  api.expectNoUnmockedRequests();
});
