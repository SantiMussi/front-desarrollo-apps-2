import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchCurrentUser,
  getStoredToken,
  login as loginRequest,
  register as registerRequest,
  removeStoredToken,
  storeToken,
} from "../services/apiClient";

const AuthContext = createContext(null);
const USER_KEY = "ciudad-uade.auth-user";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function normalizeResponse(response) {
  const data = response?.data ?? response;
  return {
    token: data?.token ?? data?.accessToken ?? data?.access_token,
    user: data?.user ?? data?.usuario ?? data?.account ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()));

  const saveUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const logout = useCallback(() => {
    removeStoredToken();
    saveUser(null);
  }, [saveUser]);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return null;
    try {
      const response = await fetchCurrentUser();
      const currentUser = response?.data ?? response;
      saveUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.status === 401 || error.status === 403) logout();
      throw error;
    }
  }, [logout, saveUser]);

  useEffect(() => {
    if (!getStoredToken()) return;
    // Revalidate the persisted session once when the provider mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().catch(() => {}).finally(() => setIsLoading(false));
  }, [refreshUser]);

  const authenticate = useCallback(async (credentials) => {
    const result = normalizeResponse(await loginRequest(credentials));
    if (!result.token) throw new Error("El servidor no devolvió un token de acceso.");
    storeToken(result.token);
    if (result.user) saveUser(result.user);
    else await refreshUser();
    return result.user;
  }, [refreshUser, saveUser]);

  const register = useCallback(async (details) => {
    const response = await registerRequest(details);
    const result = normalizeResponse(response);
    if (result.token) {
      storeToken(result.token);
      if (result.user) saveUser(result.user);
      else await refreshUser();
    }
    return response;
  }, [refreshUser, saveUser]);

  const value = useMemo(() => ({ user, isLoading, isAuthenticated: Boolean(user && getStoredToken()), login: authenticate, register, logout, refreshUser }), [user, isLoading, authenticate, register, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This small module intentionally colocates the provider and its hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}