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

export async function fetchMyTickets(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, value);
  });
  const qs = query.toString();
  return request(`/me/tickets${qs ? `?${qs}` : ""}`);
}

export async function fetchMyTicketDetail(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`);
}

export async function confirmTicketResolution(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/resolution/confirm`, {
    method: "POST",
  });
}

export async function reopenTicket(ticketId, { reason }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/resolution/reopen`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function answerTicketInformation(ticketId, { responseMessage }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/information-response`, {
    method: "POST",
    body: JSON.stringify({ responseMessage }),
  });
}

export async function rateTicketAttention(publicId, stars) {
  return request(`/tickets/mine/${encodeURIComponent(publicId)}/rating`, {
    method: "POST",
    body: JSON.stringify({ stars }),
  });
}

export async function trackTicket(trackingCode) {
  return request("/tracking/access", {
    method: "POST",
    body: JSON.stringify({ trackingCode }),
  });
}

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

export async function fetchAgentTickets(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, value);
  });
  const qs = query.toString();
  return request(`/tickets${qs ? `?${qs}` : ""}`);
}

export async function fetchStaffTicketDetail(ticketId) {
  return request(`/staff/tickets/${encodeURIComponent(ticketId)}`);
}

export async function fetchTicketCitizenView(ticketId) {
  return request(`/staff/tickets/${encodeURIComponent(ticketId)}/citizen-view`);
}

export async function updateTicketClassification(ticketId, requestTypeId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/classification`, {
    method: "PATCH",
    body: JSON.stringify({ requestTypeId }),
  });
}

export async function reviewTicket(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/review`, {
    method: "POST",
  });
}

export async function requestTicketInformation(ticketId, { messageForCitizen, internalMessage }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/information-request`, {
    method: "POST",
    body: JSON.stringify({
      messageForCitizen,
      ...(internalMessage ? { internalMessage } : {}),
    }),
  });
}

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
