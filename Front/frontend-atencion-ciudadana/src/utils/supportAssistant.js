import { EMERGENCY_KEYWORDS, SUPPORT_FAQ } from "../data/supportFaq";
import { findRequestTypeMatches, normalizeText } from "./requestTypeSearch";

const MAX_SUGGESTIONS = 3;
const MIN_FAQ_SCORE = 1;

export function isEmergency(text) {
  const normalized = normalizeText(text);
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function findFaq(text) {
  const normalized = normalizeText(text);
  let best = null;
  for (const faq of SUPPORT_FAQ) {
    // Una frase completa pesa más que una palabra suelta.
    const score = faq.keywords.reduce(
      (sum, keyword) => (normalized.includes(keyword) ? sum + (keyword.includes(" ") ? 2 : 1) : sum),
      0,
    );
    if (score >= MIN_FAQ_SCORE && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
}

export const claimPath = ({ category, subcategory, requestType }) =>
  `/portal-ayuda?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(subcategory.id)}&requestType=${encodeURIComponent(requestType.code)}`;

export function suggestRequestTypes(categories, text) {
  return findRequestTypeMatches(categories, text)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Resuelve una pregunta sin servidor ni IA: primero emergencias, después preguntas frecuentes
 * y, si no hay coincidencia, tipos de reclamo del catálogo (si ya está cargado).
 */
export function answerQuestion(text, categories = []) {
  const clean = String(text ?? "").trim();
  if (!clean) return { type: "empty" };
  const emergency = isEmergency(clean);
  const faq = findFaq(clean);
  if (faq) return { type: "faq", faq, emergency };
  const suggestions = suggestRequestTypes(categories, clean);
  if (suggestions.length) return { type: "requestTypes", suggestions, emergency };
  return { type: "none", emergency };
}
