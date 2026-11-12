import { StrictMode } from "react";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthProvider } from "../AuthContext.jsx";
import { useAuth } from "../useAuth";
import { useSessionToken } from "../../hooks/useSessionToken";
import { getStoredToken, loginSession, removeStoredToken } from "../../services/authSession";

vi.mock("../../services/authSession", async (original) => {
  vi.stubEnv("VITE_IDENTITY_PROVIDER", "M1");
  vi.stubEnv("VITE_API_BASE_URL", "/api");
  return original();
});

const employee = { actorId: "d04cbd7f-1952-47ae-81b9-977654f70102", actorType: "EMPLEADO", citizenId: null, role: "AGENT", areaId: "M2", displayName: "Empleado" };
const data = (token = "synthetic-access", identity = employee) => ({ token, tokenType: "Bearer", expiresAt: new Date(Date.now() + 900000).toISOString(), identity });
const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status, code) => ({ ok: false, status, json: async () => ({ code, message: "Error simulado" }) });
const assign = vi.fn();
const wrapper = ({ children }) => <StrictMode><AuthProvider>{children}</AuthProvider></StrictMode>;
const setup = () => renderHook(() => ({ auth: useAuth(), viewSession: useSessionToken() }), { wrapper });

beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks();
  vi.stubGlobal("location", { ...window.location, assign });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(data())));
  await loginSession({ username: "employee@example.test", password: "synthetic" });
  // Equivalent to a reload: no access token/profile persisted, cookie remains browser-owned.
  removeStoredToken(); fetch.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

it("restaura una única vez bajo StrictMode y conserva actor empleado sin citizenId", async () => {
  const { result } = setup();
  expect(result.current.auth.isLoading).toBe(true);
  expect(result.current.auth.isAuthenticated).toBe(false);
  await waitFor(() => expect(result.current.auth.isLoading).toBe(false));
  expect(result.current.auth.user).toEqual(employee);
  expect(result.current.auth.isAuthenticated).toBe(true);
  expect(fetch).toHaveBeenCalledOnce();
  expect(localStorage.length).toBe(0);
});

it("renueva en uso, actualiza permisos locales y mantiene la identidad de la vista", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true));
  const key = result.current.viewSession;
  fetch.mockClear();
  const updated = { ...employee, role: "AREA_RESPONSIBLE", areaId: "M6" };
  fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(ok(data("renewed", updated))).mockResolvedValueOnce(ok(updated));
  await act(async () => result.current.auth.refreshUser());
  expect(result.current.auth.user).toEqual(updated);
  expect(result.current.viewSession).toBe(key);
  expect(result.current.auth.isAuthenticated).toBe(true);
  expect(assign).not.toHaveBeenCalled();
});

it.each([403, 503])("un error %s en /me no elimina la sesión", async (status) => {
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true));
  fetch.mockResolvedValueOnce(fail(status));
  await act(async () => { await expect(result.current.auth.refreshUser()).rejects.toMatchObject({ status }); });
  expect(result.current.auth.isAuthenticated).toBe(true);
  expect(getStoredToken()).toBe("synthetic-access");
  expect(assign).not.toHaveBeenCalled();
});

it("una restauración temporalmente fallida permite reintentar sin inventar sesión", async () => {
  fetch.mockResolvedValueOnce(fail(503, "IDENTITY_UNAVAILABLE"));
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isLoading).toBe(false));
  expect(result.current.auth.isAuthenticated).toBe(false);
  expect(result.current.auth.sessionError).toContain("reintentar");
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  fetch.mockResolvedValueOnce(ok(data()));
  await act(async () => result.current.auth.retrySession());
  expect(result.current.auth.isAuthenticated).toBe(true);
  expect(result.current.auth.sessionError).toBeNull();
});

it("refresh inválido limpia la sesión y deja que las rutas protegidas vuelvan al login", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true));
  fetch.mockResolvedValueOnce(fail(401)).mockResolvedValueOnce(fail(401, "INVALID_TOKEN"));
  await act(async () => { await expect(result.current.auth.refreshUser()).rejects.toMatchObject({ status: 401 }); });
  expect(result.current.auth.isAuthenticated).toBe(false);
  expect(result.current.auth.user).toBeNull();
  expect(result.current.viewSession).toBeNull();
});

it("logout con fallo no promete haber borrado la cookie y permite reintentar", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true));
  fetch.mockResolvedValueOnce(fail(503));
  await act(async () => { await expect(result.current.auth.logout()).resolves.toBe(false); });
  expect(result.current.auth.user).toBeNull();
  expect(getStoredToken()).toBeNull();
  expect(result.current.auth.sessionError).toContain("cierre en el servidor");
  expect(assign).not.toHaveBeenCalled();
  fetch.mockResolvedValueOnce(ok(null, 204));
  await act(async () => { await expect(result.current.auth.retrySession()).resolves.toBe(true); });
  expect(assign).toHaveBeenCalledWith("/portal-ayuda");
});

it("login fallido conserva el formulario sin autenticar; uno válido admite empleado", async () => {
  fetch.mockResolvedValueOnce(fail(401, "INVALID_TOKEN"));
  const { result } = setup();
  await waitFor(() => expect(result.current.auth.isLoading).toBe(false));
  fetch.mockResolvedValueOnce(fail(401, "INVALID_CREDENTIALS"));
  await act(async () => { await expect(result.current.auth.login({ username: "employee@example.test", password: "synthetic" })).rejects.toMatchObject({ status: 401 }); });
  expect(result.current.auth.isAuthenticated).toBe(false);
  fetch.mockResolvedValueOnce(ok(data()));
  await act(async () => result.current.auth.login({ username: "employee@example.test", password: "synthetic" }));
  expect(result.current.auth.user).toEqual(employee);
  expect(result.current.auth.isAuthenticated).toBe(true);
});
