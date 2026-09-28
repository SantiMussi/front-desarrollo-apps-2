import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../apiClient";

const okResponse = (body = { ok: true }, status = 200) => ({
  ok: true,
  status,
  json: vi.fn().mockResolvedValue(body),
  blob: vi.fn().mockResolvedValue(new Blob(["data"])),
});

const failResponse = (status, body, statusText = "Nope") => ({
  ok: false,
  status,
  statusText,
  json: body === undefined ? vi.fn().mockRejectedValue(new Error("no json")) : vi.fn().mockResolvedValue(body),
});

const readBlob = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });

const lastCall = () => {
  const [url, options] = fetch.mock.calls.at(-1);
  return { url, options, body: typeof options?.body === "string" ? JSON.parse(options.body) : options?.body };
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cabeceras de autenticación", () => {
  it("envía JSON sin Authorization cuando no hay token", async () => {
    await api.fetchCategories();
    expect(lastCall().options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("agrega el Bearer y respeta cabeceras extra", async () => {
    api.storeToken("jwt");
    await api.fetchCategories();
    expect(lastCall().options.headers.Authorization).toBe("Bearer jwt");
  });
});

// [función, argumentos, método, URL esperada, cuerpo esperado]
const REQUESTS = [
  ["login", [{ username: "a", password: "b" }], "POST", "/api/auth/login", { username: "a", password: "b" }],
  ["register", [{ email: "a@b.c" }], "POST", "/api/auth/register", { email: "a@b.c" }],
  ["fetchCurrentUser", [], undefined, "/api/auth/me"],
  ["fetchCategories", [], undefined, "/api/catalog/categories"],
  ["fetchSubcategories", [3], undefined, "/api/catalog/categories/3/subcategories"],
  ["fetchRequestTypes", [4], undefined, "/api/catalog/subcategories/4/request-types"],
  ["fetchRequestTypeForm", [5], undefined, "/api/catalog/request-types/5/form"],
  ["fetchAdminCategories", [], undefined, "/api/admin/catalog/categories"],
  ["createCategory", [{ name: "C" }], "POST", "/api/admin/catalog/categories", { name: "C" }],
  ["updateCategory", [1, { name: "C" }], "PUT", "/api/admin/catalog/categories/1", { name: "C" }],
  ["activateCategory", [1], "POST", "/api/admin/catalog/categories/1/activate"],
  ["deactivateCategory", [1], "POST", "/api/admin/catalog/categories/1/deactivate"],
  ["fetchAdminSubcategories", [1], undefined, "/api/admin/catalog/categories/1/subcategories"],
  ["createSubcategory", [{ name: "S" }], "POST", "/api/admin/catalog/subcategories", { name: "S" }],
  ["updateSubcategory", [2, { name: "S" }], "PUT", "/api/admin/catalog/subcategories/2", { name: "S" }],
  ["activateSubcategory", [2], "POST", "/api/admin/catalog/subcategories/2/activate"],
  ["deactivateSubcategory", [2], "POST", "/api/admin/catalog/subcategories/2/deactivate"],
  ["fetchAdminRequestTypes", [2], undefined, "/api/admin/catalog/subcategories/2/request-types"],
  ["createRequestType", [{ code: "R" }], "POST", "/api/admin/catalog/request-types", { code: "R" }],
  ["updateRequestType", [3, { code: "R" }], "PUT", "/api/admin/catalog/request-types/3", { code: "R" }],
  ["activateRequestType", [3], "POST", "/api/admin/catalog/request-types/3/activate"],
  ["deactivateRequestType", [3], "POST", "/api/admin/catalog/request-types/3/deactivate"],
  ["fetchAdminRequestTypeForm", [3], undefined, "/api/admin/catalog/request-types/3/form"],
  ["saveAdminRequestTypeForm", [3, { fields: [] }], "PUT", "/api/admin/catalog/request-types/3/form", { fields: [] }],
  ["fetchMyTicketDetail", ["a/b"], undefined, "/api/tickets/a%2Fb"],
  ["confirmTicketResolution", [9], "POST", "/api/tickets/9/resolution/confirm"],
  ["reopenTicket", [9, { reason: "r" }], "POST", "/api/tickets/9/resolution/reopen", { reason: "r" }],
  ["submitSatisfactionSurvey", [9, { score: 4, comment: "" }], "POST", "/api/tickets/9/satisfaction-survey", { score: 4, comment: null }],
  ["submitSatisfactionSurvey", [9, { score: 4, comment: "ok" }], "POST", "/api/tickets/9/satisfaction-survey", { score: 4, comment: "ok" }],
  ["trackTicket", ["ABC", "pw"], "POST", "/api/tracking/access", { trackingCode: "ABC", anonymousAccessPassword: "pw" }],
  ["trackTicket", ["ABC"], "POST", "/api/tracking/access", { trackingCode: "ABC" }],
  ["confirmAnonymousResolution", ["ABC", "pw"], "POST", "/api/tracking/actions/confirm-resolution", { trackingCode: "ABC", anonymousAccessPassword: "pw" }],
  [
    "reopenAnonymousTicket",
    ["ABC", { ticketPassword: "pw", reason: "r" }],
    "POST",
    "/api/tracking/actions/reopen",
    { trackingCode: "ABC", anonymousAccessPassword: "pw", payload: { reason: "r" } },
  ],
  [
    "cancelAnonymousTicket",
    ["ABC", { ticketPassword: "pw", reasonCode: "OTHER", publicMessage: "" }],
    "POST",
    "/api/tracking/actions/cancel",
    { trackingCode: "ABC", anonymousAccessPassword: "pw", payload: { reasonCode: "OTHER", publicMessage: null, internalMessage: null } },
  ],
  [
    "sendAnonymousMessage",
    ["ABC", { ticketPassword: "pw", text: "hola" }],
    "POST",
    "/api/tracking/actions/messages",
    { trackingCode: "ABC", anonymousAccessPassword: "pw", payload: { visibility: "PUBLIC", text: "hola" } },
  ],
  [
    "answerAnonymousInformation",
    ["ABC", { ticketPassword: "pw", responseMessage: "r" }],
    "POST",
    "/api/tracking/actions/information-response",
    { trackingCode: "ABC", anonymousAccessPassword: "pw", payload: { responseMessage: "r" } },
  ],
  ["rateAnonymousTicketAttention", ["A B", { ticketPassword: "pw", stars: 5 }], "POST", "/api/tracking/A%20B/rating", { ticketPassword: "pw", stars: 5 }],
  ["fetchNeighborhoods", [], undefined, "/api/catalog/neighborhoods"],
  ["fetchStaffTicketDetail", [1], undefined, "/api/staff/tickets/1"],
  ["fetchTicketCitizenView", [1], undefined, "/api/staff/tickets/1/citizen-view"],
  ["fetchStaffLabels", [], undefined, "/api/staff/labels"],
  ["createStaffLabel", [{ code: "C", name: "N", description: "D", extra: 1 }], "POST", "/api/staff/labels", { code: "C", name: "N", description: "D" }],
  ["fetchStaffLabel", [8], undefined, "/api/staff/labels/8"],
  ["updateStaffLabel", [8, { name: "N", description: "D", active: false, extra: 1 }], "PUT", "/api/staff/labels/8", { name: "N", description: "D", active: false }],
  ["deleteStaffLabel", [8], "DELETE", "/api/staff/labels/8"],
  ["assignTicketLabels", [1, [2, 3]], "POST", "/api/staff/tickets/1/labels", { labelIds: [2, 3] }],
  ["removeTicketLabel", [1, 2], "DELETE", "/api/staff/tickets/1/labels/2"],
  ["updateTicketClassification", [1, 7], "PATCH", "/api/tickets/1/classification", { requestTypeId: 7 }],
  ["reviewTicket", [1], "POST", "/api/tickets/1/review"],
  ["requestTicketInformation", [1, { messageForCitizen: "m", internalMessage: "i" }], "POST", "/api/tickets/1/information-request", { messageForCitizen: "m", internalMessage: "i" }],
  ["requestTicketInformation", [1, { messageForCitizen: "m" }], "POST", "/api/tickets/1/information-request", { messageForCitizen: "m" }],
  ["resolveTicket", [1, { type: "T", publicMessage: "p", internalMessage: "i" }], "POST", "/api/tickets/1/resolution", { type: "T", publicMessage: "p", internalMessage: "i" }],
  ["resolveTicket", [1, { type: "T", publicMessage: "p" }], "POST", "/api/tickets/1/resolution", { type: "T", publicMessage: "p" }],
  ["routeTicket", [1], "POST", "/api/tickets/1/route"],
  ["cancelTicket", [1, { reasonCode: "OTHER" }], "POST", "/api/tickets/1/cancel", { reasonCode: "OTHER", publicMessage: null, internalMessage: null }],
  ["cancelTicket", [1, { reasonCode: "OTHER", publicMessage: "p", internalMessage: "i" }], "POST", "/api/tickets/1/cancel", { reasonCode: "OTHER", publicMessage: "p", internalMessage: "i" }],
  ["linkTicketDuplicate", [1, { mainTicketId: 2 }], "POST", "/api/staff/tickets/1/duplicate", { mainTicketId: 2 }],
  ["fetchDuplicateCandidates", [1], undefined, "/api/staff/tickets/1/duplicate-candidates"],
  ["fetchTicketMessages", [1], undefined, "/api/tickets/1/messages"],
  ["createTicketMessage", [1, { visibility: "PUBLIC", text: "t" }], "POST", "/api/tickets/1/messages", { visibility: "PUBLIC", text: "t" }],
  ["updateTicketMessage", [1, 2, { text: "t" }], "PATCH", "/api/tickets/1/messages/2", { text: "t" }],
  ["deleteTicketMessage", [1, 2], "DELETE", "/api/tickets/1/messages/2"],
];

describe("contratos de los endpoints", () => {
  it.each(REQUESTS)("%s -> %s %s", async (name, args, method, url, body) => {
    const result = await api[name](...args);
    expect(result).toEqual({ ok: true });
    const call = lastCall();
    expect(call.url).toBe(url);
    expect(call.options.method).toBe(method);
    if (body !== undefined) expect(call.body).toEqual(body);
    else expect(call.options.body).toBeUndefined();
  });

  it("los endpoints con IDs numéricos sin encode conservan la ruta (resolveTicket)", async () => {
    await api.resolveTicket("a/b", { type: "T", publicMessage: "p" });
    expect(lastCall().url).toBe("/api/tickets/a/b/resolution");
  });
});

describe("listados con filtros", () => {
  it("fetchMyTickets omite parámetros vacíos", async () => {
    await api.fetchMyTickets();
    expect(lastCall().url).toBe("/api/me/tickets");
    await api.fetchMyTickets({ page: 0, size: 10, status: "", q: null, x: undefined });
    expect(lastCall().url).toBe("/api/me/tickets?page=0&size=10");
  });

  it("fetchAgentTickets soporta arreglos y omite vacíos", async () => {
    await api.fetchAgentTickets();
    expect(lastCall().url).toBe("/api/tickets");
    await api.fetchAgentTickets({ status: ["A", "", "B"], page: 1, q: "" });
    expect(lastCall().url).toBe("/api/tickets?status=A&status=B&page=1");
  });

  it("fetchTicketsByLabel arma la consulta por etiqueta", async () => {
    await api.fetchTicketsByLabel("l/1");
    expect(lastCall().url).toBe("/api/staff/labels/l%2F1/tickets");
    await api.fetchTicketsByLabel(2, { page: 3, sort: "id" });
    expect(lastCall().url).toBe("/api/staff/labels/2/tickets?page=3&sort=id");
  });
});

describe("respuestas de error de request()", () => {
  it.each([
    [{ message: "m", error: "e", detail: "d" }, "m"],
    [{ error: "e", detail: "d" }, "e"],
    [{ detail: "d" }, "d"],
    [{}, "Error 400: Nope"],
    [undefined, "Error 400: Nope"],
  ])("extrae el mensaje %j", async (body, message) => {
    fetch.mockResolvedValue(failResponse(400, body));
    await expect(api.fetchCategories()).rejects.toMatchObject({ message, status: 400 });
  });

  it("expone el código del backend o null", async () => {
    fetch.mockResolvedValueOnce(failResponse(409, { message: "x", code: "DUP" }));
    await expect(api.fetchCategories()).rejects.toMatchObject({ code: "DUP" });
    fetch.mockResolvedValueOnce(failResponse(409, { message: "x" }));
    await expect(api.fetchCategories()).rejects.toMatchObject({ code: null });
  });

  it("devuelve null en las respuestas 204", async () => {
    fetch.mockResolvedValue(okResponse(undefined, 204));
    await expect(api.deleteStaffLabel(1)).resolves.toBeNull();
  });
});

describe("createTicket", () => {
  it("envía JSON con el token", async () => {
    api.storeToken("jwt");
    fetch.mockResolvedValue(okResponse({ trackingCode: "T" }));
    await expect(api.createTicket({ a: 1 })).resolves.toEqual({ trackingCode: "T" });
    const { url, options } = lastCall();
    expect(url).toBe("/api/tickets");
    expect(options.headers).toEqual({ Authorization: "Bearer jwt", "Content-Type": "application/json" });
    expect(options.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("no envía el token con skipAuth y usa multipart con adjuntos", async () => {
    api.storeToken("jwt");
    const file = new File(["x"], "proof.png", { type: "image/png" });
    await api.createTicket({ a: 1 }, [{ file }], { skipAuth: true });
    const { options } = lastCall();
    expect(options.headers).toEqual({});
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("evidence")).toBeInstanceOf(File);
    expect(options.body.get("data")).toBeInstanceOf(Blob);
  });

  it("acepta una lista de adjuntos vacía o nula", async () => {
    await api.createTicket({ a: 1 }, null);
    expect(lastCall().options.headers["Content-Type"]).toBe("application/json");
  });

  it("traduce errores con lista de campos", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValueOnce(
      failResponse(422, { message: "Inválido", code: "V", errors: [{ field: "summary", defaultMessage: "vacío" }, { field: "x", message: "mal" }] })
    );
    await expect(api.createTicket({})).rejects.toMatchObject({ message: "Inválido - summary: vacío, x: mal", status: 422, code: "V" });
  });

  it("traduce errores con fieldErrors y sin cuerpo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValueOnce(failResponse(400, { error: "Malo", fieldErrors: { a: "b" } }));
    await expect(api.createTicket({})).rejects.toMatchObject({ message: 'Malo - {"a":"b"}' });
    fetch.mockResolvedValueOnce(failResponse(500, undefined, "Rota"));
    await expect(api.createTicket({})).rejects.toMatchObject({ message: "Error 500: Rota" });
    fetch.mockResolvedValueOnce(failResponse(400, { detail: "Detalle" }));
    await expect(api.createTicket({})).rejects.toMatchObject({ message: "Detalle" });
  });
});

describe("multipart y descargas", () => {
  const file = new File(["x"], "f.pdf", { type: "application/pdf" });

  it("answerTicketInformation usa JSON sin archivos y multipart con archivos", async () => {
    await api.answerTicketInformation(4, { responseMessage: "hola" });
    expect(lastCall()).toMatchObject({ url: "/api/tickets/4/information-response", body: { responseMessage: "hola" } });
    api.storeToken("jwt");
    await api.answerTicketInformation(4, { responseMessage: "", attachments: [file] });
    const { url, options } = lastCall();
    expect(url).toBe("/api/tickets/4/information-response");
    expect(options.headers).toEqual({ Authorization: "Bearer jwt" });
    expect(options.body.get("attachments")).toBeInstanceOf(File);
    expect(JSON.parse(await readBlob(options.body.get("data")))).toEqual({ responseMessage: null });
  });

  it("answerAnonymousInformation usa multipart sin Authorization", async () => {
    api.storeToken("jwt");
    await api.answerAnonymousInformation("ABC", { ticketPassword: "pw", responseMessage: "", attachments: [file] });
    const { url, options } = lastCall();
    expect(url).toBe("/api/tracking/actions/information-response");
    expect(options.headers).toEqual({});
    expect(JSON.parse(await readBlob(options.body.get("data")))).toEqual({
      trackingCode: "ABC",
      anonymousAccessPassword: "pw",
      payload: { responseMessage: null },
    });
  });

  it("uploadTicketAttachment y uploadAnonymousAttachment envían el archivo", async () => {
    api.storeToken("jwt");
    await api.uploadTicketAttachment("t/1", file);
    let call = lastCall();
    expect(call.url).toBe("/api/tickets/t%2F1/attachments");
    expect(call.options.headers).toEqual({ Authorization: "Bearer jwt" });
    expect(JSON.parse(await readBlob(call.options.body.get("data")))).toEqual({ visibility: "PUBLIC" });
    await api.uploadAnonymousAttachment("ABC", "pw", file);
    call = lastCall();
    expect(call.url).toBe("/api/tracking/actions/attachments");
    expect(call.options.headers).toEqual({});
    expect(JSON.parse(await readBlob(call.options.body.get("data"))).payload).toEqual({ visibility: "PUBLIC" });
  });

  it("postMultipart traduce los errores del backend", async () => {
    fetch.mockResolvedValueOnce(failResponse(415, { message: "Tipo no permitido", code: "MEDIA" }));
    await expect(api.uploadTicketAttachment(1, file)).rejects.toMatchObject({ message: "Tipo no permitido", status: 415, code: "MEDIA" });
    fetch.mockResolvedValueOnce(failResponse(413, { error: "Grande" }));
    await expect(api.uploadTicketAttachment(1, file)).rejects.toMatchObject({ message: "Grande", code: null });
    fetch.mockResolvedValueOnce(failResponse(500, { detail: "Detalle" }));
    await expect(api.uploadTicketAttachment(1, file)).rejects.toMatchObject({ message: "Detalle" });
    fetch.mockResolvedValueOnce(failResponse(503, undefined, "Caído"));
    await expect(api.uploadTicketAttachment(1, file)).rejects.toMatchObject({ message: "Error 503: Caído" });
  });

  it("downloadTicketAttachment devuelve el blob y traduce errores", async () => {
    api.storeToken("jwt");
    const blob = await api.downloadTicketAttachment("a/1");
    expect(blob).toBeInstanceOf(Blob);
    const { url, options } = lastCall();
    expect(url).toBe("/api/attachments/a%2F1/content");
    expect(options.headers).toEqual({ Authorization: "Bearer jwt" });
    fetch.mockResolvedValueOnce(failResponse(404, {}, "No existe"));
    await expect(api.downloadTicketAttachment(1)).rejects.toMatchObject({ message: "Error 404: No existe", status: 404 });
    localStorage.clear();
    await api.downloadTicketAttachment(1);
    expect(lastCall().options.headers).toEqual({});
  });

  it("downloadAnonymousAttachment hace POST con credenciales y traduce errores", async () => {
    const blob = await api.downloadAnonymousAttachment("ABC", "pw", "a/1");
    expect(blob).toBeInstanceOf(Blob);
    const { url, options, body } = lastCall();
    expect(url).toBe("/api/tracking/actions/attachments/a%2F1/content");
    expect(options.method).toBe("POST");
    expect(body).toEqual({ trackingCode: "ABC", anonymousAccessPassword: "pw" });
    fetch.mockResolvedValueOnce(failResponse(401, {}, "No autorizado"));
    await expect(api.downloadAnonymousAttachment("ABC", "bad", 1)).rejects.toMatchObject({ status: 401 });
  });
});

describe("simulador de estados", () => {
  const simulated = async (fn, ...args) => {
    await fn(...args);
    return lastCall();
  };

  it("arma el evento con los datos del módulo", async () => {
    const { url, body } = await simulated(api.simulateStatusUpdate, 5, {
      moduleId: "obras",
      updateType: "STARTED",
      publicMessage: "p",
      internalMessage: "i",
      details: { a: 1 },
    });
    expect(url).toBe("/api/tickets/5/simulate-status-update");
    expect(body).toMatchObject({
      specVersion: "1.0",
      eventType: "updateTicketStatus",
      producer: { moduleId: "obras", service: "obras-simulator" },
      subject: "tickets/5",
      data: {
        ticketId: 5,
        updateType: "STARTED",
        publicMessage: "p",
        internalMessage: "i",
        details: { a: 1 },
        updatedBy: { type: "EXTERNAL_USER", id: "obras-simulator" },
      },
    });
    expect(body.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.data.updateOccurredAt).toBe(body.occurredAt);
  });

  it("usa null para los campos opcionales ausentes", async () => {
    const { body } = await simulated(api.simulateStatusUpdate, 5, { moduleId: "m", updateType: "X" });
    expect(body.data).toMatchObject({ publicMessage: null, internalMessage: null, details: null });
  });

  it.each([
    ["simulateAreaResolution", [1, { moduleId: "m", type: "ACTION_COMPLETED", publicMessage: "p" }], "RESOLVED", { resolution: { type: "ACTION_COMPLETED" } }],
    ["returnTicketToAgent", [1, "m", { reasonCode: "R", publicMessage: "p" }], "RETURNED", { returnInfo: { reasonCode: "R" } }],
    ["rejectTicket", [1, "m", { reasonCode: "R", publicMessage: "p" }], "REJECTED", { cancellation: { reasonCode: "R" } }],
    ["startTicketWork", [1, "m"], "STARTED", null],
  ])("%s envía updateType %s", async (name, args, updateType, details) => {
    const { body } = await simulated(api[name], ...args);
    expect(body.data.updateType).toBe(updateType);
    expect(body.data.details).toEqual(details);
  });

  it("genera el UUID con getRandomValues cuando randomUUID no existe", async () => {
    vi.stubGlobal("crypto", { getRandomValues: (bytes) => bytes.fill(0xab) });
    const { body } = await simulated(api.simulateStatusUpdate, 1, { moduleId: "m", updateType: "X" });
    expect(body.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("genera un UUID aun sin crypto", async () => {
    vi.stubGlobal("crypto", undefined);
    const { body } = await simulated(api.simulateStatusUpdate, 1, { moduleId: "m", updateType: "X" });
    expect(body.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("usa randomUUID cuando está disponible", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
    const { body } = await simulated(api.simulateStatusUpdate, 1, { moduleId: "m", updateType: "X" });
    expect(body.eventId).toBe("11111111-1111-4111-8111-111111111111");
  });
});
