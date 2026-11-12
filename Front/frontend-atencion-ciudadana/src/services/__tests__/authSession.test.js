import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const employee = { actorId: "d04cbd7f-1952-47ae-81b9-977654f70102", actorType: "EMPLEADO", citizenId: null, role: "AGENT", areaId: "M2", displayName: "Empleado" };
const session = (token = "synthetic-access", identity = employee) => ({ token, tokenType: "Bearer", expiresAt: new Date(Date.now() + 900000).toISOString(), identity });
const ok = (data, status = 200) => ({ ok: true, status, json: async () => data, blob: async () => new Blob(["file"]) });
const fail = (status, code) => ({ ok: false, status, json: async () => ({ code, message: "Error simulado" }) });
const deferred = () => { let resolve; const promise = new Promise((yes) => { resolve = yes; }); return { promise, resolve }; };
let auth;
let api;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_IDENTITY_PROVIDER", "M1");
  vi.stubEnv("VITE_API_BASE_URL", "/api");
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(session())));
  auth = await import("../authSession");
  api = await import("../apiClient");
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

async function login() { await api.login({ username: "employee@example.test", password: "synthetic" }); fetch.mockClear(); }

describe("selección y almacenamiento", () => {
  it("inicia sesión con M2, conserva empleado sin citizenId y usa sólo memoria", async () => {
    localStorage.setItem("ciudad-uade.auth-token", "old-mock");
    localStorage.setItem("ciudad-uade.auth-user", "old-user");
    await api.login({ username: "employee@example.test", password: "synthetic" });
    expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-M2-CSRF": "1" },
      body: JSON.stringify({ username: "employee@example.test", password: "synthetic" }) }));
    expect(auth.getStoredToken()).toBe("synthetic-access");
    expect(auth.getSessionIdentity()).toEqual(employee);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("restaura sin access persistido mediante la cookie que administra el navegador", async () => {
    await auth.restoreSession();
    expect(fetch).toHaveBeenCalledWith("/api/auth/refresh", expect.objectContaining({ credentials: "same-origin" }));
    expect(fetch.mock.calls[0][1]).not.toHaveProperty("body");
    expect(auth.getStoredToken()).toBe("synthetic-access");
  });

  it.each([401, 403, 503])("login %s no produce fallback ni token local", async (status) => {
    fetch.mockResolvedValue(fail(status, "FORBIDDEN"));
    await expect(api.login({ username: "test", password: "synthetic" })).rejects.toMatchObject({ status });
    expect(auth.getStoredToken()).toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("sanitiza errores de red de login", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.login({})).rejects.toThrow("No pudimos conectar con el servicio de acceso");
  });

  it("limita el tiempo de una sesión sin respuesta y permite cerrar localmente", async () => {
    await login();
    vi.useFakeTimers();
    fetch.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const pending = auth.refreshSession();
    const checked = expect(pending).rejects.toMatchObject({ status: 503, code: "IDENTITY_UNAVAILABLE" });
    await vi.advanceTimersByTimeAsync(45000);
    await checked;
    expect(auth.getStoredToken()).toBe("synthetic-access");
    fetch.mockResolvedValueOnce(ok(null, 204));
    await auth.logoutSession();
    expect(auth.getStoredToken()).toBeNull();
  });

  it("un JSON inválido de sesión se informa sin exponer errores del parser", async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new SyntaxError("private parser detail"); } });
    await expect(api.login({})).rejects.toMatchObject({ status: 502, code: "IDENTITY_RESPONSE_INVALID" });
  });

  it("rechaza respuestas sin expiración válida o sin identidad", async () => {
    fetch.mockResolvedValue(ok({ token: "bad", expiresAt: "invalid", identity: employee }));
    await expect(api.login({})).rejects.toMatchObject({ status: 502 });
    expect(auth.getStoredToken()).toBeNull();
  });

  it.each(["UNKNOWN", "m1"])('rechaza proveedor "%s" sin fallback', async (provider) => {
    vi.resetModules(); vi.stubEnv("VITE_IDENTITY_PROVIDER", provider);
    await expect(import("../authSession")).rejects.toThrow("Proveedor de identidad inválido");
  });

  it("M1 rechaza una API de otro origen", async () => {
    vi.resetModules(); vi.stubEnv("VITE_API_BASE_URL", "https://external.example.test/api");
    await expect(import("../authSession")).rejects.toThrow("mismo origen");
  });

  it("MOCK conserva almacenamiento y no exige refresh ni logout remotos", async () => {
    vi.resetModules(); vi.stubEnv("VITE_IDENTITY_PROVIDER", "MOCK");
    const mock = await import("../authSession");
    mock.storeToken("mock-token");
    expect(mock.getStoredToken()).toBe("mock-token");
    await expect(mock.refreshSession()).resolves.toBeNull();
    await expect(mock.restoreSession()).resolves.toBeNull();
    await mock.logoutSession();
    expect(mock.getStoredToken()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("renovación y operaciones", () => {
  it("renueva antes de enviar una escritura cuando venció el access", async () => {
    await login();
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 901000);
    fetch.mockResolvedValueOnce(ok(session("renewed"))).mockResolvedValueOnce(ok({ id: 1 }));
    await api.createTicketMessage("ticket", { visibility: "PUBLIC", text: "test" });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/api/auth/refresh", "/api/tickets/ticket/messages"]);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer renewed");
  });

  it("comparte un refresh entre solicitudes concurrentes y mantiene la misma identidad de vista", async () => {
    await login();
    const key = auth.getSessionKey();
    const refresh = deferred();
    fetch.mockImplementation((url, options) => url === "/api/auth/refresh" ? refresh.promise
      : Promise.resolve(options.headers.Authorization === "Bearer synthetic-access" ? fail(401) : ok({ content: [] })));
    const first = api.fetchMyTickets(); const second = api.fetchMyTickets();
    await vi.waitFor(() => expect(fetch.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1));
    refresh.resolve(ok(session("renewed")));
    await Promise.all([first, second]);
    expect(fetch.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
    expect(auth.getSessionKey()).toBe(key);
    expect(auth.getStoredToken()).toBe("renewed");
  });

  it("un 401 tardío comparte el token ya renovado", async () => {
    await login();
    const late = deferred();
    fetch.mockResolvedValueOnce(fail(401)).mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(ok(session("renewed"))).mockResolvedValue(ok({ role: "AGENT" }));
    const first = api.fetchCurrentUser(); const second = api.fetchCurrentUser();
    await first;
    late.resolve(fail(401));
    await second;
    expect(fetch.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
  });

  it("no duplica refresh aunque M1 emita el mismo JWT dentro del mismo segundo", async () => {
    await login(); const late = deferred();
    fetch.mockResolvedValueOnce(fail(401)).mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(ok(session())).mockResolvedValue(ok({ role: "AGENT" }));
    const first = api.fetchCurrentUser(); const second = api.fetchCurrentUser();
    await first; late.resolve(fail(401)); await second;
    expect(fetch.mock.calls.filter(([url]) => url === "/api/auth/refresh")).toHaveLength(1);
  });

  it("un segundo 401 invalida sin bucles", async () => {
    await login();
    fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(ok(session("renewed"))).mockResolvedValueOnce(fail(401));
    await expect(api.fetchCurrentUser()).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(auth.getStoredToken()).toBeNull();
  });

  it.each([401, 403])("refresh definitivo %s elimina la sesión", async (status) => {
    await login();
    fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(fail(status, status === 403 ? "FORBIDDEN" : "INVALID_TOKEN"));
    await expect(api.fetchCurrentUser()).rejects.toMatchObject({ status });
    expect(auth.getStoredToken()).toBeNull();
  });

  it.each([403, 503])("refresh temporal/CSRF %s preserva sesión y limita nuevos intentos", async (status) => {
    await login();
    fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(fail(status, status === 403 ? "CSRF_REJECTED" : "IDENTITY_UNAVAILABLE"));
    await expect(api.fetchCurrentUser()).rejects.toMatchObject({ status });
    expect(auth.getStoredToken()).toBe("synthetic-access");
    await expect(auth.refreshSession()).rejects.toMatchObject({ status: 503 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("un 403 funcional o fallo de red no renueva ni cierra sesión", async () => {
    await login();
    fetch.mockResolvedValueOnce(fail(403)).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.fetchCurrentUser()).rejects.toMatchObject({ status: 403 });
    await expect(api.fetchCurrentUser()).rejects.toThrow("No pudimos conectar.");
    expect(auth.getStoredToken()).toBe("synthetic-access");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(["json", "multipart"])("no reproduce escrituras %s después de 401", async (kind) => {
    await login();
    fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(ok(session("renewed")));
    const operation = kind === "json" ? api.createTicketMessage("ticket", { text: "test", visibility: "PUBLIC" })
      : api.uploadTicketAttachment("ticket", new File(["data"], "test.txt"));
    await expect(operation).rejects.toMatchObject({ status: 409, code: "SESSION_RETRY_REQUIRED" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(auth.getStoredToken()).toBe("renewed");
  });

  it("renueva descargas GET y conserva respuesta blob", async () => {
    await login();
    fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(ok(session("renewed"))).mockResolvedValueOnce(ok(null));
    await expect(api.downloadTicketAttachment("file")).resolves.toBeInstanceOf(Blob);
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe("Bearer renewed");
  });

  it("no renueva ni envía bearer en acreditación y creación anónimas", async () => {
    await login();
    fetch.mockResolvedValue(fail(401));
    await expect(api.trackTicket("code", "synthetic")).rejects.toMatchObject({ status: 401 });
    await expect(api.createTicket({}, [], { skipAuth: true })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, options] of fetch.mock.calls) expect(options.headers.Authorization).toBeUndefined();
    expect(auth.getStoredToken()).toBe("synthetic-access");
  });

  it("respeta abort durante un refresh compartido sin enviar el reintento", async () => {
    await login();
    const controller = new AbortController(); const refresh = deferred();
    fetch.mockResolvedValueOnce(fail(401)).mockReturnValueOnce(refresh.promise);
    const operation = api.fetchOwnTrackingCode("ticket", { signal: controller.signal });
    const checked = expect(operation).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    controller.abort(); refresh.resolve(ok(session("renewed")));
    await checked;
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rechaza un cambio de actor en refresh", async () => {
    await login();
    fetch.mockResolvedValue(ok(session("different", { ...employee, actorId: "other-actor" })));
    await expect(auth.refreshSession()).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    expect(auth.getStoredToken()).toBeNull();
  });
});

describe("cierre de sesión y carreras", () => {
  it("logout vacía memoria y pide borrar cookie sin enviar tokens en el body", async () => {
    await login(); fetch.mockResolvedValue(ok(null, 204));
    await auth.logoutSession();
    expect(auth.getStoredToken()).toBeNull();
    expect(auth.getSessionIdentity()).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ credentials: "same-origin", headers: { "Content-Type": "application/json", "X-M2-CSRF": "1" } }));
    expect(fetch.mock.calls[0][1]).not.toHaveProperty("body");
    await expect(auth.restoreSession()).resolves.toBeNull();
  });

  it("logout espera un refresh en vuelo, descarta su respuesta y borra cookie al final", async () => {
    await login(); const refresh = deferred();
    fetch.mockReturnValueOnce(refresh.promise).mockResolvedValueOnce(ok(null, 204));
    const pending = auth.refreshSession();
    const checked = expect(pending).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    const logout = auth.logoutSession();
    expect(auth.getStoredToken()).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    refresh.resolve(ok(session("too-late")));
    await checked; await logout;
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/api/auth/refresh", "/api/auth/logout"]);
    expect(auth.getStoredToken()).toBeNull();
  });

  it("logout espera login en vuelo y evita resucitar la sesión", async () => {
    const response = deferred();
    fetch.mockReturnValueOnce(response.promise).mockResolvedValueOnce(ok(null, 204));
    const pending = api.login({});
    const checked = expect(pending).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const logout = auth.logoutSession();
    response.resolve(ok(session()));
    await checked; await logout;
    expect(auth.getStoredToken()).toBeNull();
    expect(fetch.mock.calls.at(-1)[0]).toBe("/api/auth/logout");
  });

  it("logout con error limpia acceso local, informa fallo y permite reintentar", async () => {
    await login(); fetch.mockRejectedValueOnce(new TypeError("network"));
    await expect(auth.logoutSession()).rejects.toThrow("No pudimos conectar");
    expect(auth.getStoredToken()).toBeNull();
    fetch.mockResolvedValueOnce(ok(null, 204));
    await auth.logoutSession();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
