import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCurrentUser, getStoredToken, login as loginRequest, removeStoredToken, storeToken } from "../services/apiClient";
import { getSessionIdentity, isM1Auth, logoutSession, restoreSession, SESSION_EVENT } from "../services/authSession";
import { AuthContext } from "./authContext";

const USER_KEY = "ciudad-uade.auth-user";
function readStoredUser() {
  if (isM1Auth || !getStoredToken()) return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => isM1Auth ? getSessionIdentity() : readStoredUser());
  const [isLoading, setIsLoading] = useState(() => isM1Auth || Boolean(getStoredToken()));
  const [sessionError, setSessionError] = useState(null);
  const retryOperation = useRef(null);
  const revision = useRef(0);

  const saveUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (isM1Auth || !nextUser) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return null;
    const current = revision.current;
    try {
      const response = await fetchCurrentUser();
      const currentUser = response?.data ?? response;
      if (current === revision.current) saveUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.status === 401 && current === revision.current) {
        removeStoredToken();
        saveUser(null);
      }
      throw error;
    }
  }, [saveUser]);

  const restore = useCallback(async () => {
    setIsLoading(true);
    setSessionError(null);
    try {
      if (isM1Auth) {
        const session = await restoreSession();
        if (session && session.token === getStoredToken()) saveUser(session.identity);
      } else await refreshUser();
    } catch (error) {
      if (error.status !== 401 && !(error.status === 403 && error.code === "FORBIDDEN") && error.code !== "SESSION_CHANGED") {
        retryOperation.current = "restore";
        setSessionError("No pudimos comprobar tu sesión. Podés reintentar sin volver a ingresar tus datos.");
      }
    } finally { setIsLoading(false); }
  }, [refreshUser, saveUser]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      revision.current += 1;
      if (isM1Auth) {
        saveUser(getSessionIdentity());
        if (!getStoredToken()) setSessionError(null);
      } else if (!getStoredToken()) saveUser(null);
    };
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    if (isM1Auth || getStoredToken()) {
      // StrictMode remounts share the service's single refresh operation.
      void Promise.resolve().then(() => { if (active) return restore(); });
    }
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [restore, saveUser]);

  const authenticate = useCallback(async (credentials) => {
    const current = ++revision.current;
    const response = await loginRequest(credentials);
    const data = response?.data ?? response;
    const nextToken = data?.token ?? data?.accessToken ?? data?.access_token;
    if (!nextToken) throw new Error("El servidor no devolvió un token de acceso.");
    if (!isM1Auth && current !== revision.current) return null;
    if (isM1Auth && nextToken !== getStoredToken()) return null;
    storeToken(nextToken);
    const nextUser = data?.identity ?? data?.user ?? data?.usuario ?? data?.account ?? null;
    setSessionError(null);
    if (nextUser) saveUser(nextUser);
    else return refreshUser();
    return nextUser;
  }, [refreshUser, saveUser]);

  const logout = useCallback(async () => {
    revision.current += 1;
    saveUser(null);
    setSessionError(null);
    try {
      await logoutSession();
      window.location.assign("/portal-ayuda");
      return true;
    } catch {
      retryOperation.current = "logout";
      setSessionError("El acceso local se cerró, pero no pudimos completar el cierre en el servidor. Reintentá para eliminar la sesión del navegador.");
      return false;
    }
  }, [saveUser]);

  const retrySession = useCallback(() => retryOperation.current === "logout" ? logout() : restore(), [logout, restore]);
  const value = useMemo(() => ({ user, isLoading, sessionError, retrySession,
    isAuthenticated: Boolean(user && getStoredToken()), login: authenticate, logout, refreshUser }),
  [user, isLoading, sessionError, retrySession, authenticate, logout, refreshUser]);
  return <AuthContext.Provider value={value}>
    {sessionError && <div role="alert" className="border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      {sessionError} <button type="button" onClick={retrySession} className="font-semibold underline">Reintentar</button>
    </div>}
    {children}
  </AuthContext.Provider>;
}
