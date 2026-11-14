import { expect } from "@playwright/test";

/** Inicia sesión desde la pantalla real de ingreso. Requiere que `/auth/login` esté mockeado. */
export async function loginFromUi(page, { email, password }) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/ingresar/);
}
