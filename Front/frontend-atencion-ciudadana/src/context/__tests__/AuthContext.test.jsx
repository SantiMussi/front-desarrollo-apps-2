import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../AuthContext.jsx";
import { useAuth } from "../useAuth";
import * as api from "../../services/apiClient";
import * as session from "../../services/authSession";
vi.mock("../../services/authSession", () => ({ isM1Auth: false, SESSION_EVENT: "m2:session", getSessionIdentity: vi.fn(), logoutSession: vi.fn(), restoreSession: vi.fn() }));

vi.mock("../../services/apiClient", () => ({
  fetchCurrentUser: vi.fn(),
  getStoredToken: vi.fn(),
  login: vi.fn(),
  removeStoredToken: vi.fn(),
  storeToken: vi.fn(),
}));

const USER_KEY = "ciudad-uade.auth-user";
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
const setup = () => renderHook(() => useAuth(), { wrapper });

let token;
const assign = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  token = null;
  api.getStoredToken.mockImplementation(() => token);
  api.storeToken.mockImplementation((value) => {
    token = value;
  });
  api.removeStoredToken.mockImplementation(() => {
    token = null;
  });
  session.logoutSession.mockImplementation(async () => { api.removeStoredToken(); });
  vi.stubGlobal("location", { ...window.location, assign });
});

afterEach(() => vi.unstubAllGlobals());

describe("useAuth", () => {
  it("falla fuera del proveedor", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/dentro de AuthProvider/);
  });
});

describe("AuthProvider", () => {
  it("arranca sin sesión y sin cargar cuando no hay token", () => {
    const { result } = setup();
    expect(result.current).toMatchObject({ user: null, isLoading: false, isAuthenticated: false });
  });

  it("recupera el usuario guardado y lo refresca desde el servidor si hay token", async () => {
    token = "jwt";
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1, role: "CITIZEN" }));
    api.fetchCurrentUser.mockResolvedValue({ data: { id: 1, role: "AGENT" } });
    const { result } = setup();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toEqual({ id: 1, role: "CITIZEN" });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual({ id: 1, role: "AGENT" });
    expect(result.current.isAuthenticated).toBe(true);
    expect(JSON.parse(localStorage.getItem(USER_KEY))).toEqual({ id: 1, role: "AGENT" });
  });

  it("ignora un usuario guardado corrupto", () => {
    localStorage.setItem(USER_KEY, "{no-json");
    const { result } = setup();
    expect(result.current.user).toBeNull();
  });

  it("acepta una respuesta de /me sin envoltorio data", async () => {
    token = "jwt";
    api.fetchCurrentUser.mockResolvedValue({ id: 5 });
    const { result } = setup();
    await waitFor(() => expect(result.current.user).toEqual({ id: 5 }));
  });

  it.each([401])("cierra la sesión cuando /me responde %s", async (status) => {
    token = "jwt";
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
    api.fetchCurrentUser.mockRejectedValue(Object.assign(new Error("no"), { status }));
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.removeStoredToken).toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("conserva la sesión ante otros errores de red", async () => {
    token = "jwt";
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
    api.fetchCurrentUser.mockRejectedValue(Object.assign(new Error("boom"), { status: 500 }));
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual({ id: 1 });
    expect(assign).not.toHaveBeenCalled();
  });

  it("refreshUser devuelve null sin token y propaga errores con token", async () => {
    const { result } = setup();
    await expect(result.current.refreshUser()).resolves.toBeNull();
    token = "jwt";
    api.fetchCurrentUser.mockRejectedValue(Object.assign(new Error("x"), { status: 500 }));
    await expect(result.current.refreshUser()).rejects.toThrow("x");
  });

  it("no actualiza el estado si se desmonta durante la carga", async () => {
    token = "jwt";
    let resolve;
    api.fetchCurrentUser.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = setup();
    unmount();
    await act(async () => resolve({ id: 1 }));
  });

  describe("login", () => {
    it.each([
      ["token e identity", { token: "t1", identity: { id: 1, role: "CITIZEN" } }, { id: 1, role: "CITIZEN" }],
      ["accessToken y user envueltos en data", { data: { accessToken: "t2", user: { id: 2 } } }, { id: 2 }],
      ["access_token y usuario", { access_token: "t3", usuario: { id: 3 } }, { id: 3 }],
      ["token y account", { token: "t4", account: { id: 4 } }, { id: 4 }],
    ])("guarda token y usuario con %s", async (_name, response, user) => {
      api.login.mockResolvedValue(response);
      const { result } = setup();
      let returned;
      await act(async () => {
        returned = await result.current.login({ username: "a", password: "b" });
      });
      expect(api.login).toHaveBeenCalledWith({ username: "a", password: "b" });
      expect(returned).toEqual(user);
      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("pide el usuario al servidor si el login no lo incluye", async () => {
      api.login.mockResolvedValue({ token: "t" });
      api.fetchCurrentUser.mockResolvedValue({ id: 9 });
      const { result } = setup();
      await act(async () => {
        await result.current.login({});
      });
      expect(api.fetchCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual({ id: 9 });
    });

    it("falla si el servidor no devuelve un token", async () => {
      api.login.mockResolvedValue({ identity: { id: 1 } });
      const { result } = setup();
      await expect(result.current.login({})).rejects.toThrow(/no devolvió un token/);
      api.login.mockResolvedValue(undefined);
      await expect(result.current.login({})).rejects.toThrow(/no devolvió un token/);
    });
  });

  it("un 403 no cierra la sesión", async () => {
    token = "jwt";
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
    api.fetchCurrentUser.mockRejectedValue(Object.assign(new Error("permission"), { status: 403 }));
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(api.removeStoredToken).not.toHaveBeenCalled();
  });

  it("logout limpia token y usuario y redirige al portal", async () => {
    api.login.mockResolvedValue({ token: "t", identity: { id: 1 } });
    const { result } = setup();
    await act(async () => {
      await result.current.login({});
    });
    await act(async () => result.current.logout());
    expect(api.removeStoredToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(assign).toHaveBeenCalledWith("/portal-ayuda");
  });

  it("isAuthenticated exige usuario y token", async () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
    const { result } = setup();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
