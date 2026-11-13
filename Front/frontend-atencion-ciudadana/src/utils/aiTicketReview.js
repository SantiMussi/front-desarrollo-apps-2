import { suggestRequestTypes } from "./supportAssistant";

export const MIN_REVIEW_CHARS = 20;

// Ids del catálogo: el servidor usa números y el front los guarda como texto en algunos niveles.
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

/** Ubica un tipo de trámite en el árbol del catálogo; devuelve categoría, subcategoría y tipo. */
export function findRequestTypePath(categories, requestTypeId) {
  for (const category of categories ?? []) {
    for (const subcategory of category.subcategories ?? []) {
      const requestType = (subcategory.requestTypes ?? []).find((type) => sameId(type.id, requestTypeId));
      if (requestType) return { category, subcategory, requestType };
    }
  }
  return null;
}

/**
 * Convierte la respuesta del servidor en lo que muestra la pantalla. Si la IA no estuvo disponible
 * (o el pedido falló) se recurre a la búsqueda por palabras clave que ya usa el asistente.
 *
 * @returns {{ mode: "ai"|"rules", quality: string|null, mismatch: boolean, suggestion: object|null, reason: string|null }}
 */
export function buildReview({ response, categories, summary, description, currentRequestTypeId }) {
  if (response?.source === "AI") {
    const path = response.suggestedRequestTypeId == null
      ? null
      : findRequestTypePath(categories, response.suggestedRequestTypeId);
    return {
      mode: "ai",
      quality: response.quality ?? "OK",
      mismatch: Boolean(response.mismatch) && path !== null,
      suggestion: path,
      reason: response.reason ?? null,
    };
  }
  const text = [summary, description].filter(Boolean).join(" ");
  const [best] = suggestRequestTypes(categories ?? [], text);
  const differs = best && !sameId(best.requestType.id, currentRequestTypeId);
  return { mode: "rules", quality: null, mismatch: Boolean(differs), suggestion: best ?? null, reason: null };
}

export const claimTypeLabel = (path) => `${path.requestType.name} (${path.category.title ?? path.category.name})`;
