import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/authContext";
import LocationProbe from "./LocationProbe";

export function makeAuth(overrides = {}) {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({}),
    logout: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

export const CITIZEN = { id: "c-1", role: "CITIZEN", displayName: "Vecina Uno", email: "vecina@example.test" };
export const AGENT = { id: "a-1", role: "AGENT", displayName: "Agente Uno", email: "agente@example.test" };
export const ADMIN = { id: "ad-1", role: "ADMIN", displayName: "Admin Uno", email: "admin@example.test" };

export function authFor(user, extra = {}) {
  return makeAuth({ user, isAuthenticated: Boolean(user), ...extra });
}

/**
 * Renders `ui` inside a router and an AuthContext.
 * - `route`: initial URL. `path`: route pattern the element is mounted under (defaults to a catch-all).
 * - `auth`: value overrides for the AuthContext (see makeAuth / authFor).
 */
export function renderWithProviders(ui, { route = "/", path = "*", auth = makeAuth(), extraRoutes = null } = {}) {
  return {
    auth,
    ...render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            {extraRoutes}
          </Routes>
          <LocationProbe />
        </MemoryRouter>
      </AuthContext.Provider>
    ),
  };
}
