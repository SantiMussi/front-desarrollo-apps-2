import { EMERGENCY_KEYWORDS, SUPPORT_FAQ } from "../data/supportFaq";
import { findRequestTypeMatches, normalizeText } from "./requestTypeSearch";

const MAX_SUGGESTIONS = 3;
const STRONG_FAQ_SCORE = 2;
const MIN_SUGGESTION_SCORE = 2;
const STEM_LENGTH = 6;
const FUZZY_MIN_LENGTH = 5;

// Palabras que no aportan para reconocer una pregunta ("no", "sin" y "mas" sí cambian el sentido).
const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "a", "en", "que", "por", "para",
  "con", "mi", "me", "se", "es", "lo", "al", "del", "como", "le", "su", "sus", "te", "tu", "ya", "muy",
]);

// Plural simple: «fotos» y «foto» cuentan igual.
const singular = (token) => (token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token);

export const tokenize = (text) =>
  normalizeText(text)
    .split(/[^a-z0-9ñ]+/)
    .filter((token) => token && !STOPWORDS.has(token))
    .map(singular);

const stem = (token) => token.slice(0, STEM_LENGTH);

function withinOneEdit(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.slice(i) === long.slice(i + 1);
}

// Tolera plurales/conjugaciones (mismo comienzo) y un error de tipeo en palabras largas.
function tokensMatch(queryToken, keywordToken) {
  if (queryToken === keywordToken) return true;
  if (keywordToken.length >= STEM_LENGTH && queryToken.length >= STEM_LENGTH && stem(queryToken) === stem(keywordToken)) return true;
  return keywordToken.length >= FUZZY_MIN_LENGTH && queryToken.length >= FUZZY_MIN_LENGTH && withinOneEdit(queryToken, keywordToken);
}

function phraseScore(queryTokens, phrase) {
  const phraseTokens = tokenize(phrase);
  if (!phraseTokens.length) return 0;
  return phraseTokens.every((pt) => queryTokens.some((qt) => tokensMatch(qt, pt))) ? phraseTokens.length : 0;
}

export function isEmergency(text) {
  const normalized = normalizeText(text);
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

// Puntúa cada pregunta frecuente por su mejor frase (pesa tanto como palabras tenga); el resto sólo desempata.
export function scoreFaqs(text) {
  const queryTokens = tokenize(text);
  return SUPPORT_FAQ
    .map((faq) => {
      const scores = faq.keywords.map((phrase) => phraseScore(queryTokens, phrase)).filter(Boolean);
      return { faq, score: scores.length ? Math.max(...scores) + 0.01 * (scores.length - 1) : 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function findFaq(text) {
  return scoreFaqs(text)[0]?.faq ?? null;
}

const TICKET_CODE = /\b[a-z]{2}-\d{4}-\d{4,}\b/i;
export const findTicketCode = (text) => String(text ?? "").match(TICKET_CODE)?.[0] ?? null;

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const LONG_NUMBER = /\b\d[\d\s.-]{6,}\d\b/g;
// «contraseña del reclamo» es una pregunta; sólo se tapa cuando se da el valor («mi clave es 1234»).
const SECRET = /\b(?:contrasena|contraseña|clave|password|pin)\s*(?:es|:|=)\s*\S+/gi;
const AFTER_CODE_PREFIX = /[a-z]{2}-$/i;

// Tapa emails, números largos (DNI, teléfono, tarjetas) y contraseñas antes de mostrar o procesar el mensaje.
export function redactPersonalData(text) {
  let redacted = false;
  const mask = () => {
    redacted = true;
    return "[dato oculto]";
  };
  const safe = String(text ?? "")
    .replace(EMAIL, mask)
    .replace(SECRET, mask)
    .replace(LONG_NUMBER, (match, offset, whole) => (AFTER_CODE_PREFIX.test(whole.slice(Math.max(0, offset - 3), offset)) ? match : mask()));
  return { text: safe, redacted };
}

export const claimPath = ({ category, subcategory, requestType }) =>
  `/portal-ayuda?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(subcategory.id)}&requestType=${encodeURIComponent(requestType.code)}`;

export function suggestRequestTypes(categories, text) {
  return findRequestTypeMatches(categories, text)
    .filter((match) => match.score >= MIN_SUGGESTION_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);
}

/**
 * Resuelve una pregunta sin servidor ni IA. Orden: charla básica y preguntas frecuentes claras,
 * reclamos puntuales (se deriva a una persona), temas del catálogo y, por último, pistas débiles.
 */
export function answerQuestion(text, categories = []) {
  const clean = String(text ?? "").trim();
  if (!clean) return { type: "empty" };
  const emergency = isEmergency(clean);
  const [best] = scoreFaqs(clean);

  if (best && (best.faq.smalltalk || Math.floor(best.score) >= STRONG_FAQ_SCORE)) return { type: "faq", faq: best.faq, emergency };

  const ticketCode = findTicketCode(clean);
  if (ticketCode) return { type: "ticketCode", ticketCode, emergency };

  const suggestions = suggestRequestTypes(categories, clean);
  if (suggestions.length) return { type: "requestTypes", suggestions, emergency };
  if (best) return { type: "faq", faq: best.faq, emergency };
  return { type: "none", emergency };
}
