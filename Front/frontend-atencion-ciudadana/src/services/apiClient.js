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

// Catalog Admin (rol ADMIN) — a diferencia de /catalog/*, incluyen activas e inactivas
export async function fetchAdminCategories() {
  return request("/admin/catalog/categories");
}

export async function createCategory(payload) {
  return request("/admin/catalog/categories", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCategory(categoryId, payload) {
  return request(`/admin/catalog/categories/${categoryId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function activateCategory(categoryId) {
  return request(`/admin/catalog/categories/${categoryId}/activate`, { method: "POST" });
}

export async function deactivateCategory(categoryId) {
  return request(`/admin/catalog/categories/${categoryId}/deactivate`, { method: "POST" });
}

export async function fetchAdminSubcategories(categoryId) {
  return request(`/admin/catalog/categories/${categoryId}/subcategories`);
}

export async function createSubcategory(payload) {
  return request("/admin/catalog/subcategories", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateSubcategory(subcategoryId, payload) {
  return request(`/admin/catalog/subcategories/${subcategoryId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function activateSubcategory(subcategoryId) {
  return request(`/admin/catalog/subcategories/${subcategoryId}/activate`, { method: "POST" });
}

export async function deactivateSubcategory(subcategoryId) {
  return request(`/admin/catalog/subcategories/${subcategoryId}/deactivate`, { method: "POST" });
}

export async function fetchAdminRequestTypes(subcategoryId) {
  return request(`/admin/catalog/subcategories/${subcategoryId}/request-types`);
}

export async function createRequestType(payload) {
  return request("/admin/catalog/request-types", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateRequestType(requestTypeId, payload) {
  return request(`/admin/catalog/request-types/${requestTypeId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function activateRequestType(requestTypeId) {
  return request(`/admin/catalog/request-types/${requestTypeId}/activate`, { method: "POST" });
}

export async function deactivateRequestType(requestTypeId) {
  return request(`/admin/catalog/request-types/${requestTypeId}/deactivate`, { method: "POST" });
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

export async function answerTicketInformation(ticketId, { responseMessage, attachments = [] }) {
  if (attachments.length > 0) {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify({ responseMessage: responseMessage || null })], { type: "application/json" })
    );
    attachments.forEach((file) => formData.append("attachments", file));
    return postMultipart(
      `${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/information-response`,
      formData,
      getStoredToken()
    );
  }
  return request(`/tickets/${encodeURIComponent(ticketId)}/information-response`, {
    method: "POST",
    body: JSON.stringify({ responseMessage }),
  });
}

export async function submitSatisfactionSurvey(ticketId, { score, comment }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/satisfaction-survey`, {
    method: "POST",
    body: JSON.stringify({ score, comment: comment || null }),
  });
}

export async function trackTicket(trackingCode, ticketPassword) {
  return request("/tracking/access", {
    method: "POST",
    body: JSON.stringify(
      ticketPassword ? { trackingCode, anonymousAccessPassword: ticketPassword } : { trackingCode }
    ),
  });
}

export async function confirmAnonymousResolution(trackingCode, ticketPassword) {
  return request("/tracking/actions/confirm-resolution", {
    method: "POST",
    body: JSON.stringify({ trackingCode, anonymousAccessPassword: ticketPassword }),
  });
}

export async function reopenAnonymousTicket(trackingCode, { ticketPassword, reason }) {
  return request("/tracking/actions/reopen", {
    method: "POST",
    body: JSON.stringify({ trackingCode, anonymousAccessPassword: ticketPassword, payload: { reason } }),
  });
}

export async function answerAnonymousInformation(trackingCode, { ticketPassword, responseMessage, attachments = [] }) {
  if (attachments.length > 0) {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob(
        [
          JSON.stringify({
            trackingCode,
            anonymousAccessPassword: ticketPassword,
            payload: { responseMessage: responseMessage || null },
          }),
        ],
        { type: "application/json" }
      )
    );
    attachments.forEach((file) => formData.append("attachments", file));
    return postMultipart(`${BASE_URL}/tracking/actions/information-response`, formData, null);
  }
  return request("/tracking/actions/information-response", {
    method: "POST",
    body: JSON.stringify({ trackingCode, anonymousAccessPassword: ticketPassword, payload: { responseMessage } }),
  });
}

// No existe un endpoint de encuesta de satisfacción para tickets anónimos.
export async function rateAnonymousTicketAttention(trackingCode, { ticketPassword, stars }) {
  return request(`/tracking/${encodeURIComponent(trackingCode)}/rating`, {
    method: "POST",
    body: JSON.stringify({ ticketPassword, stars }),
  });
}

export async function fetchNeighborhoods() {
  return request("/catalog/neighborhoods");
}

// POST /api/tickets
export async function createTicket(payload, attachments = [], { skipAuth = false } = {}) {
  const url = `${BASE_URL}/tickets`;
  const token = skipAuth ? null : getStoredToken();
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

export async function simulateStatusUpdate(ticketId, { moduleId, updateType, publicMessage, internalMessage, details }) {
  const now = new Date().toISOString();
  return request(`/tickets/${encodeURIComponent(ticketId)}/simulate-status-update`, {
    method: "POST",
    body: JSON.stringify({
      specVersion: "1.0",
      eventId: crypto.randomUUID(),
      eventType: "updateTicketStatus",
      occurredAt: now,
      producer: { moduleId, service: `${moduleId}-simulator` },
      subject: `tickets/${ticketId}`,
      data: {
        ticketId,
        updateType,
        publicMessage: publicMessage || null,
        internalMessage: internalMessage || null,
        details: details || null,
        updatedBy: { type: "EXTERNAL_USER", id: `${moduleId}-simulator` },
        updateOccurredAt: now,
      },
    }),
  });
}

export async function simulateAreaResolution(ticketId, { moduleId, type, publicMessage, internalMessage }) {
  return simulateStatusUpdate(ticketId, {
    moduleId,
    updateType: "RESOLVED",
    publicMessage,
    internalMessage,
    details: { resolution: { type } },
  });
}

export async function returnTicketToAgent(ticketId, moduleId, { reasonCode, publicMessage, internalMessage }) {
  return simulateStatusUpdate(ticketId, {
    moduleId,
    updateType: "RETURNED",
    publicMessage,
    internalMessage,
    details: { returnInfo: { reasonCode } },
  });
}

export async function rejectTicket(ticketId, moduleId, { reasonCode, publicMessage, internalMessage }) {
  return simulateStatusUpdate(ticketId, {
    moduleId,
    updateType: "REJECTED",
    publicMessage,
    internalMessage,
    details: { cancellation: { reasonCode } },
  });
}

export async function startTicketWork(ticketId, moduleId) {
  return simulateStatusUpdate(ticketId, { moduleId, updateType: "STARTED" });
}

export async function routeTicket(ticketId) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/route`, { method: "POST" });
}

export async function cancelTicket(ticketId, { reasonCode, publicMessage, internalMessage }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reasonCode, publicMessage: publicMessage || null, internalMessage: internalMessage || null }),
  });
}

export async function linkTicketDuplicate(ticketId, { mainTicketId }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ mainTicketId }),
  });
}

async function postMultipart(url, formData, token) {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || errorBody?.detail || `Error ${response.status}: ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = errorBody?.code || null;
    throw error;
  }

  return response.json();
}

async function getBlob(url, token) {
  const response = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (!response.ok) {
    const error = new Error(`Error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

async function postForBlob(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(`Error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

// El listado de adjuntos viene embebido en el detalle del ticket (campo
// `attachments`), no existe un endpoint dedicado para listarlos.
export async function uploadTicketAttachment(ticketId, file) {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify({ visibility: "PUBLIC" })], { type: "application/json" }));
  formData.append("attachments", file);
  return postMultipart(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/attachments`, formData, getStoredToken());
}

export async function downloadTicketAttachment(attachmentId) {
  return getBlob(`${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}/content`, getStoredToken());
}

export async function uploadAnonymousAttachment(trackingCode, ticketPassword, file) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          trackingCode,
          anonymousAccessPassword: ticketPassword,
          payload: { visibility: "PUBLIC" },
        }),
      ],
      { type: "application/json" }
    )
  );
  formData.append("attachments", file);
  return postMultipart(`${BASE_URL}/tracking/actions/attachments`, formData, null);
}

export async function downloadAnonymousAttachment(trackingCode, ticketPassword, attachmentId) {
  return postForBlob(`${BASE_URL}/tracking/actions/attachments/${encodeURIComponent(attachmentId)}/content`, {
    trackingCode,
    anonymousAccessPassword: ticketPassword,
  });
}
