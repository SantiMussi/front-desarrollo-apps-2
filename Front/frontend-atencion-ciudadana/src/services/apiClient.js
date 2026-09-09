const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "ciudad-uade.auth-token";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const storeToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeStoredToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const token = getStoredToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || errorBody?.detail || `Error ${response.status}: ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}


// auth endpoints
export async function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function register(user) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}


// GET /api/catalog/categories
export async function fetchCategories() {
  return request("/catalog/categories");
}

export async function fetchSubcategories(categoryId) {
  return request(`/catalog/categories/${categoryId}/subcategories`);
}

export async function fetchRequestTypes(subcategoryId) {
  return request(`/catalog/subcategories/${subcategoryId}/request-types`);
}

export async function fetchRequestTypeForm(requestTypeId) {
  return request(`/catalog/request-types/${requestTypeId}/form`);
}

// GET /api/tickets/mine — reclamos del ciudadano autenticado.
// Todavía NO existe en el back. Se espera una lista con, al menos:
// { publicId, currentStatus, summary, description, createdAt, statusChangedAt,
//   requestType {name}, category {name}, subcategory {name} }
// Mientras responda 404, `useMyTickets` cae a datos de ejemplo.
export async function fetchMyTickets() {
  return request("/tickets/mine");
}

// POST /api/tracking/access — consulta pública por código de seguimiento.
// No requiere auth. Devuelve solo datos públicos del ticket (TrackingTicketResponse):
// { publicId, currentStatus, summary, createdAt, statusChangedAt,
//   firstResponseDueAt, resolutionDueAt, requestType, category, subcategory }
// 404 si el código no existe; 400 si viene vacío.
export async function trackTicket(trackingCode) {
  return request("/tracking/access", {
    method: "POST",
    body: JSON.stringify({ trackingCode }),
  });
}

// GET /api/catalog/neighborhoods
// Se espera una lista de barrios con su UUID real de la tabla `neighborhood`:
//   [{ id: "uuid", name: "Palermo" }, ...]
// Todavía NO existe en el back. Mientras responda 404, `useNeighborhoods` cae
// al listado local (src/data/mockCategories.js → NEIGHBORHOODS).
export async function fetchNeighborhoods() {
  return request("/catalog/neighborhoods");
}

// POST /api/tickets
export async function createTicket(payload, attachments = []) {
  const url = `${BASE_URL}/tickets`;
  const token = getStoredToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body;
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    attachments.forEach(att => {
      formData.append("evidence", att.file);
    });
    body = formData;
    // Don't set Content-Type for FormData; fetch sets it automatically with the correct boundary
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.error("Backend error response:", errorBody);
    
    let message = errorBody?.message || errorBody?.error || errorBody?.detail || `Error ${response.status}: ${response.statusText}`;
    // If the backend returns a list of field validation errors (like Spring often does):
    if (errorBody?.errors && Array.isArray(errorBody.errors)) {
       message += " - " + errorBody.errors.map(e => `${e.field}: ${e.defaultMessage || e.message}`).join(", ");
    } else if (errorBody?.fieldErrors) {
       message += " - " + JSON.stringify(errorBody.fieldErrors);
    }
    
    const error = new Error(message);
    error.status = response.status;
    error.code = errorBody?.code;
    throw error;
  }

  return response.json();
}
