const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody?.message ||
      `Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
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

// TODO: Conectar al endpoint real cuando el backend esté disponible
// POST /api/tickets
export async function createTicket(payload) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
