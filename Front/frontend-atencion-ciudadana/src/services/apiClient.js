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
    error.code = errorBody?.code || null;
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

// GET /api/tickets/mine/{publicId} — detalle del reclamo para el vecino.
// Todavía NO existe. Se espera un objeto con (al menos):
// { publicId, currentStatus, summary, description, createdAt, statusChangedAt,
//   resolutionConfirmationDueAt, requestType {name}, category {name},
//   subcategory {name}, location {addressLine, neighborhood, ...},
//   attachments: [{ id, name, url? }],
//   messages: [{ id, authorType: "CITIZEN"|"AGENT", text, createdAt }],
//   history: [{ id, actionType, newStatus, message, occurredAt }],
//   resolution?: { type, publicMessage, resolvedAt } }
export async function fetchMyTicketDetail(publicId) {
  return request(`/tickets/mine/${encodeURIComponent(publicId)}`);
}

// POST /api/tickets/mine/{publicId}/resolution-confirmation — el vecino confirma
// la solución. El ticket avanza al estado final (CLOSED). NO existe todavía.
export async function confirmTicketResolution(publicId) {
  return request(`/tickets/mine/${encodeURIComponent(publicId)}/resolution-confirmation`, {
    method: "POST",
  });
}

// POST /api/tickets/mine/{publicId}/reopen — el vecino indica que el problema
// continúa. El ticket vuelve a un estado de tratamiento (IN_PROGRESS).
// body: { reason }. NO existe todavía.
export async function reopenTicket(publicId, { reason } = {}) {
  return request(`/tickets/mine/${encodeURIComponent(publicId)}/reopen`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

// POST /api/tickets/mine/{publicId}/rating — calificación de la atención (1-5).
// Opcional / "nice to have" del diseño. NO existe todavía.
export async function rateTicketAttention(publicId, stars) {
  return request(`/tickets/mine/${encodeURIComponent(publicId)}/rating`, {
    method: "POST",
    body: JSON.stringify({ stars }),
  });
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

// POST /api/tickets/{ticketId}/resolution — resolución manual por un agente/admin.
// Solo para tickets gestionados por M2 (responsibleAreaId === "M2") en estado
// IN_PROGRESS. body: { type: ResolutionType, publicMessage, internalMessage? }.
// 201 → { resolutionId, ticketId, status: "RESOLVED", type, publicMessage,
//         internalMessage, resolvedAt }. Errores: 400, 401, 403 (FORBIDDEN),
// 404 (NOT_FOUND), 409 (TICKET_RESOLUTION_CONFLICT), 415.
export async function resolveTicket(ticketId, { type, publicMessage, internalMessage }) {
  return request(`/tickets/${ticketId}/resolution`, {
    method: "POST",
    body: JSON.stringify({
      type,
      publicMessage,
      ...(internalMessage ? { internalMessage } : {}),
    }),
  });
}
