// M1 access tokens live only in memory. The browser owns the HttpOnly refresh cookie.
export const IDENTITY_PROVIDER = import.meta.env.VITE_IDENTITY_PROVIDER || "MOCK";
if (!["MOCK", "M1"].includes(IDENTITY_PROVIDER)) throw new Error("Proveedor de identidad inválido.");
export const isM1Auth = IDENTITY_PROVIDER === "M1";
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
if (isM1Auth && API_BASE !== "/api") throw new Error("M1 requiere la API de M2 en /api y el mismo origen.");

const TOKEN_KEY = "ciudad-uade.auth-token";
const USER_KEY = "ciudad-uade.auth-user";
export const SESSION_EVENT = "m2:session";
let token = null;
let identity = null;
let expiresAt = 0;
let generation = 0;
let sessionKey = null;
let refreshInFlight = null;
let loginInFlight = null;
let logoutInFlight = null;
let signedOut = false;
let retryAt = 0;
let accessRevision = 0;

function notify() { window.dispatchEvent(new Event(SESSION_EVENT)); }
export function getStoredToken() { return isM1Auth ? token : localStorage.getItem(TOKEN_KEY); }
export function getSessionIdentity() { return identity; }
export function getSessionKey() { return isM1Auth ? sessionKey : getStoredToken(); }
export function storeToken(value) {
  if (isM1Auth) {
    token = value;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else localStorage.setItem(TOKEN_KEY, value);
}
export function removeStoredToken() {
  token = null; identity = null; expiresAt = 0; sessionKey = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
function invalidate() {
  generation += 1;
  signedOut = true;
  removeStoredToken();
  notify();
}
function sessionChanged() {
  return Object.assign(new Error("La sesión cambió. Volvé a intentar."), { status: 409, code: "SESSION_CHANGED" });
}

export async function responseError(response) {
  const body = await response.json().catch(() => null);
  return Object.assign(new Error(body?.message || body?.error || body?.detail || `Error ${response.status}: ${response.statusText}`),
    { status: response.status, code: body?.code || null });
}

async function sessionRequest(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let response;
  try {
    try {
      response = await fetch(`${API_BASE}/auth/${path}`, {
        method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
        headers: { "Content-Type": "application/json", "X-M2-CSRF": "1" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw Object.assign(new Error("No pudimos conectar con el servicio de acceso. Intentá nuevamente."), { status: 503, code: "IDENTITY_UNAVAILABLE" });
    }
    if (!response.ok) throw await responseError(response);
    if (response.status === 204) return null;
    try { return await response.json(); }
    catch {
      throw Object.assign(new Error("No pudimos validar la respuesta del servicio de acceso."), { status: 502, code: "IDENTITY_RESPONSE_INVALID" });
    }
  } finally {
    clearTimeout(timeout);
  }
}

function acceptSession(data, { refreshing = false } = {}) {
  const expiry = Date.parse(data?.expiresAt);
  if (!data?.token || !data?.identity?.actorId || !Number.isFinite(expiry) || expiry <= Date.now()) {
    throw Object.assign(new Error("No pudimos validar la sesión recibida."), { status: 502, code: "IDENTITY_RESPONSE_INVALID" });
  }
  if (refreshing && identity && (identity.actorId !== data.identity.actorId || identity.actorType !== data.identity.actorType
      || identity.citizenId !== data.identity.citizenId)) {
    invalidate();
    throw sessionChanged();
  }
  if (!sessionKey) sessionKey = `m1-session-${generation}`;
  identity = data.identity;
  expiresAt = expiry;
  retryAt = 0;
  accessRevision += 1;
  storeToken(data.token);
  notify();
  return data;
}

export function refreshSession({ force = false } = {}) {
  if (!isM1Auth || signedOut) return Promise.resolve(null);
  if (loginInFlight) return loginInFlight;
  if (refreshInFlight) return refreshInFlight;
  if (!force && Date.now() < retryAt) {
    return Promise.reject(Object.assign(new Error("El servicio de acceso no está disponible. Intentá nuevamente en un momento."),
      { status: 503, code: "IDENTITY_UNAVAILABLE" }));
  }
  const current = generation;
  const operation = (async () => {
    try {
      const data = await sessionRequest("refresh");
      if (current !== generation || signedOut) throw sessionChanged();
      return acceptSession(data, { refreshing: true });
    } catch (error) {
      if (current !== generation) throw sessionChanged();
      if (error.status === 401 || (error.status === 403 && error.code === "FORBIDDEN")) invalidate();
      else retryAt = Date.now() + 30000;
      throw error;
    }
  })();
  refreshInFlight = operation;
  operation.finally(() => { if (refreshInFlight === operation) refreshInFlight = null; }).catch(() => {});
  return operation;
}

export async function restoreSession() {
  if (!isM1Auth) return null;
  // Drop legacy mock storage when explicitly switching providers.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  return refreshSession({ force: true });
}

export async function loginSession(credentials) {
  if (!isM1Auth) throw new Error("Login M1 no habilitado.");
  if (logoutInFlight) await logoutInFlight.catch(() => {});
  const current = ++generation;
  signedOut = false;
  removeStoredToken();
  notify();
  const pending = [refreshInFlight, loginInFlight].filter(Boolean);
  const operation = (async () => {
    // Finish previous cookie mutations before issuing a new login.
    await Promise.allSettled(pending);
    if (current !== generation) throw sessionChanged();
    const data = await sessionRequest("login", credentials);
    if (current !== generation || signedOut) throw sessionChanged();
    return acceptSession(data);
  })();
  loginInFlight = operation;
  try { return await operation; }
  finally { if (loginInFlight === operation) loginInFlight = null; }
}

export function logoutSession() {
  if (logoutInFlight) return logoutInFlight;
  const pending = [refreshInFlight, loginInFlight].filter(Boolean);
  invalidate();
  if (!isM1Auth) return Promise.resolve();
  // Clear the cookie after any response that could still replace it.
  const operation = Promise.allSettled(pending).then(() => sessionRequest("logout"));
  logoutInFlight = operation;
  operation.finally(() => { if (logoutInFlight === operation) logoutInFlight = null; }).catch(() => {});
  return operation;
}

export async function fetchWithSession(url, options = {}, { anonymous = false } = {}) {
  if (!isM1Auth) return fetch(url, options);
  const current = generation;
  const authenticated = !anonymous && Boolean(getStoredToken());
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (authenticated && expiresAt <= Date.now()) await refreshSession();
  if (current !== generation) throw sessionChanged();
  const send = () => {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const headers = { ...options.headers };
    delete headers.Authorization;
    if (authenticated && getStoredToken()) headers.Authorization = `Bearer ${getStoredToken()}`;
    return fetch(url, { ...options, headers, credentials: "same-origin" }).catch((error) => {
      if (error.name === "AbortError") throw error;
      throw new Error("No pudimos conectar. Intentá nuevamente.");
    });
  };
  const usedRevision = accessRevision;
  const response = await send();
  if (current !== generation) throw sessionChanged();
  if (response.status !== 401 || !authenticated) return response;
  // A concurrent request may already have renewed this same session.
  if (usedRevision === accessRevision) await refreshSession();
  if (current !== generation) throw sessionChanged();
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(method) || options.body != null) {
    throw Object.assign(new Error("Renovamos tu sesión. Volvé a enviar la operación."), { status: 409, code: "SESSION_RETRY_REQUIRED" });
  }
  const retried = await send();
  if (current !== generation) throw sessionChanged();
  if (retried.status === 401) invalidate();
  return retried;
}
