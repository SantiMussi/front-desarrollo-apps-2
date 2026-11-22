import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { loginFromUi } from "../support/login";

const citizenEmail = "citizen@example.test";
const agentEmail = "agent@example.test";
const adminEmail = "module.admin@example.test";
const password = process.env.M2_E2E_FIXTURE_PASSWORD;
const description = "Descripción sintética para la prueba académica de atención ciudadana.";
const reference = "EVIDENCIA-E2E";
let fixture;

async function json(response, status) {
  expect(response.status(), response.url()).toBe(status);
  return response.json();
}

async function authorize(request, username) {
  const session = await json(await request.post("/api/auth/login", { data: { username, password } }), 200);
  return { Authorization: "Bearer " + session.token };
}

function sameOriginOnly(context, baseURL) {
  // Bloquea fuentes, mapas y telemetría externos. Las rutas del stack siguen por HTTP normal.
  const origin = new URL(baseURL).origin;
  return context.route((url) => url.origin !== origin, (route) => route.abort());
}

function responseFor(page, method, path) {
  return page.waitForResponse((response) => response.request().method() === method
    && new URL(response.url()).pathname === path);
}

async function signIn(page, email) {
  const [response] = await Promise.all([
    responseFor(page, "POST", "/api/auth/login"),
    loginFromUi(page, { email, password }),
  ]);
  expect(response.status()).toBe(200);
}

function ticketSummary(label) {
  return "E2E " + label + " " + randomUUID();
}

async function seedTicket(request, summary) {
  return json(await request.post("/api/tickets", {
    headers: fixture.citizen,
    data: {
      requestTypeId: fixture.type.id, summary, description,
      formData: { referencia: reference },
    },
  }), 201);
}

async function persistedTicket(request, id) {
  return json(await request.get("/api/tickets/" + id, { headers: fixture.citizen }), 200);
}

test.beforeAll(async ({ request }) => {
  const admin = await authorize(request, adminEmail);
  const marker = randomUUID().slice(0, 8);
  const category = await json(await request.post("/api/admin/catalog/categories", {
    headers: admin, data: { name: "QA E2E " + marker, description },
  }), 201);
  const subcategory = await json(await request.post("/api/admin/catalog/subcategories", {
    headers: admin, data: { categoryId: category.id, name: "Servicios QA " + marker },
  }), 201);
  const type = await json(await request.post("/api/admin/catalog/request-types", {
    headers: admin,
    data: {
      subcategoryId: subcategory.id, name: "Solicitud QA " + marker, code: "E2E_" + marker,
      description, ticketType: "COMPLAINT", responsibleAreaId: "M2", baseRisk: "LOW",
      minimumPriority: "LOW", affectedPopulationFactor: 0, allowsAnonymous: false, requiresLocation: false,
    },
  }), 201);
  await json(await request.put("/api/admin/catalog/request-types/" + type.id + "/form", {
    headers: admin,
    data: { fields: [{
      code: "referencia", label: "Referencia QA", type: "TEXT", required: true,
      allowUnknown: false, displayOrder: 1, config: {},
    }] },
  }), 200);

  fixture = {
    category, subcategory, type,
    citizen: await authorize(request, citizenEmail),
    agent: await authorize(request, agentEmail),
  };
});

test.beforeEach(async ({ context, baseURL }) => {
  await sameOriginOnly(context, baseURL);
});

test("el ciudadano crea un reclamo y una lectura independiente confirma que quedó registrado", async ({ page, request }) => {
  const summary = ticketSummary("alta");
  await signIn(page, citizenEmail);
  await page.goto("/portal-ayuda");
  await page.getByRole("button", { name: new RegExp(fixture.category.name) }).click();
  await page.getByRole("button", { name: new RegExp(fixture.subcategory.name) }).click();
  await page.getByRole("button", { name: new RegExp(fixture.type.name) }).click();
  await page.getByLabel(/Título \/ Resumen/).fill(summary);
  await page.getByLabel(/Descripción detallada/).fill(description);
  await page.getByLabel(/Referencia QA/).fill(reference);
  await page.getByRole("button", { name: "Revisar y enviar" }).click();
  await expect(page.getByText(reference, { exact: true })).toBeVisible();

  const [response] = await Promise.all([
    responseFor(page, "POST", "/api/tickets"),
    page.getByRole("button", { name: "Confirmar y enviar" }).click(),
  ]);
  const created = await json(response, 201);
  expect(created).toMatchObject({ status: "REGISTERED", trackingCode: expect.any(String) });
  await expect(page.getByText(created.trackingCode, { exact: true })).toBeVisible();
  expect(await persistedTicket(request, created.ticketId)).toMatchObject({
    publicId: created.publicId, summary, description, currentStatus: "REGISTERED",
    requestTypeName: fixture.type.name,
  });
});

test("el seguimiento público rechaza un código inexistente y muestra el reclamo persistido con el código válido", async ({ page, request }) => {
  const summary = ticketSummary("seguimiento");
  const seeded = await seedTicket(request, summary);
  await page.goto("/seguimiento");
  const input = page.getByPlaceholder(/Ej\.: a1B2c3D4e5F6/);
  const consult = page.getByRole("button", { name: "Consultar", exact: true });

  await input.fill(randomUUID().replaceAll("-", ""));
  const [missing] = await Promise.all([responseFor(page, "POST", "/api/tracking/access"), consult.click()]);
  expect(missing.status()).toBe(404);
  await expect(page.getByText(/No encontramos ninguna solicitud/)).toBeVisible();
  await expect(page.getByText(seeded.publicId, { exact: true })).toHaveCount(0);

  await input.fill(seeded.trackingCode);
  const [response] = await Promise.all([responseFor(page, "POST", "/api/tracking/access"), consult.click()]);
  expect(await json(response, 200)).toMatchObject({ publicId: seeded.publicId, summary, status: "REGISTERED" });
  await expect(page.getByText(seeded.publicId, { exact: true })).toBeVisible();
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  await expect(page.getByText("Registrado", { exact: true }).first()).toBeVisible();
});

test("el ciudadano ingresa, abre su reclamo desde el listado y no puede acceder a la bandeja de agentes", async ({ page, request }) => {
  const summary = ticketSummary("mis reclamos");
  const seeded = await seedTicket(request, summary);
  await signIn(page, citizenEmail);
  const [list] = await Promise.all([responseFor(page, "GET", "/api/me/tickets"), page.goto("/mis-reclamos")]);
  expect((await json(list, 200)).content).toEqual(expect.arrayContaining([
    expect.objectContaining({ publicId: seeded.publicId, summary }),
  ]));
  await expect(page.getByText(summary, { exact: true })).toBeVisible();

  const details = page.getByRole("link", { name: "Ver detalles" })
    .and(page.locator('a[href="/mis-reclamos/' + seeded.publicId + '"]'));
  await details.click();
  await expect(page.getByRole("heading", { name: summary })).toBeVisible();
  await expect(page.getByText(description, { exact: true })).toBeVisible();

  await page.goto("/agente/tickets");
  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
  expect((await request.get("/api/tickets", { headers: fixture.citizen })).status()).toBe(403);
});

test("el agente toma un reclamo nuevo desde la bandeja y queda en revisión para el ciudadano", async ({ page, request }) => {
  const summary = ticketSummary("revisión");
  const seeded = await seedTicket(request, summary);
  await signIn(page, agentEmail);
  await page.goto("/agente/tickets");
  await page.getByPlaceholder("Buscar...").fill(summary);
  await page.getByText(summary, { exact: true }).click();
  await expect(page).toHaveURL(new RegExp("/agente/tickets/" + seeded.ticketId + "$"));
  await page.getByRole("button", { name: "Registrado", exact: true }).click();

  const [review] = await Promise.all([
    responseFor(page, "POST", "/api/tickets/" + seeded.ticketId + "/review"),
    page.getByRole("menuitem", { name: "Empezar análisis" }).click(),
  ]);
  expect(await json(review, 200)).toMatchObject({ currentStatus: "IN_REVIEW" });
  await expect(page.getByRole("button", { name: "En revisión", exact: true })).toBeVisible();
  expect(await persistedTicket(request, seeded.ticketId)).toMatchObject({
    currentStatus: "IN_REVIEW", assignedAgentId: expect.any(String),
  });
});

test("el agente resuelve un reclamo de M2 y el ciudadano confirma la solución y el cierre", async ({ page, browser, baseURL, request }) => {
  const summary = ticketSummary("resolución");
  const seeded = await seedTicket(request, summary);
  const path = "/api/tickets/" + seeded.ticketId;
  await json(await request.post(path + "/review", { headers: fixture.agent }), 200);
  expect(await json(await request.post(path + "/route", { headers: fixture.agent }), 200))
    .toMatchObject({ currentStatus: "IN_PROGRESS", responsibleAreaId: "M2" });

  await signIn(page, agentEmail);
  await page.goto("/agente/tickets/" + seeded.ticketId);
  await page.getByRole("button", { name: "En gestión", exact: true }).click();
  await page.getByRole("menuitem", { name: "Completar solicitud" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Seleccionar…", { exact: true }).click();
  await dialog.getByRole("option", { name: "Acción completada" }).click();
  const publicMessage = "La gestión solicitada se completó en la prueba de QA.";
  await dialog.getByPlaceholder(/Explicá brevemente/).fill(publicMessage);
  const [resolution] = await Promise.all([
    responseFor(page, "POST", path + "/resolution"),
    dialog.getByRole("button", { name: "Confirmar resolución" }).click(),
  ]);
  expect(await json(resolution, 201)).toMatchObject({ status: "RESOLVED", publicMessage });
  await expect(page.getByRole("button", { name: "Resuelto", exact: true })).toBeVisible();
  expect(await persistedTicket(request, seeded.ticketId)).toMatchObject({ currentStatus: "RESOLVED" });

  const citizen = await browser.newContext({ baseURL, serviceWorkers: "block" });
  try {
    await sameOriginOnly(citizen, baseURL);
    const citizenPage = await citizen.newPage();
    await signIn(citizenPage, citizenEmail);
    await citizenPage.goto("/mis-reclamos/" + seeded.publicId);
    const [confirmed] = await Promise.all([
      responseFor(citizenPage, "POST", path + "/resolution/confirm"),
      citizenPage.getByRole("button", { name: "Confirmar solución" }).click(),
    ]);
    expect(await json(confirmed, 200)).toMatchObject({ status: "CLOSED" });
    await expect(citizenPage.getByText("Cerrado", { exact: true }).first()).toBeVisible();
    expect(await persistedTicket(request, seeded.ticketId)).toMatchObject({ currentStatus: "CLOSED" });
  } finally {
    await citizen.close();
  }
});
