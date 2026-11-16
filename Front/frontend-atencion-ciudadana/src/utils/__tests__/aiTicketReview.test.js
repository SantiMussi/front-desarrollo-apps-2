import { describe, expect, it } from "vitest";
import { buildReview, findRequestTypePath } from "../aiTicketReview";

const categories = [
  {
    id: "1",
    title: "Alumbrado",
    subcategories: [{ id: "10", name: "Luminarias", requestTypes: [{ id: 101, code: "101", name: "Luminaria apagada", description: "" }] }],
  },
  {
    id: "2",
    title: "Calles y veredas",
    subcategories: [{ id: "20", name: "Calzada", requestTypes: [{ id: 201, code: "201", name: "Bache en la calzada", description: "" }] }],
  },
];

describe("findRequestTypePath", () => {
  it("ubica el tipo en el árbol aunque el id llegue como texto", () => {
    const path = findRequestTypePath(categories, "201");
    expect(path.requestType.name).toBe("Bache en la calzada");
    expect(path.category.id).toBe("2");
    expect(path.subcategory.id).toBe("20");
  });

  it("devuelve null para un id fuera del catálogo o vacío", () => {
    expect(findRequestTypePath(categories, 999)).toBeNull();
    expect(findRequestTypePath(categories, null)).toBeNull();
    expect(findRequestTypePath(undefined, 101)).toBeNull();
  });
});

describe("buildReview con respuesta de la IA", () => {
  const response = (extra) => ({ source: "AI", quality: "OK", mismatch: true, suggestedRequestTypeId: 101, reason: "Habla de una luz.", ...extra });

  it("propone cambiar de tipo cuando el servidor marca discrepancia y el tipo existe", () => {
    const review = buildReview({ response: response(), categories, summary: "", description: "x", currentRequestTypeId: 201 });
    expect(review).toMatchObject({ mode: "ai", mismatch: true, reason: "Habla de una luz." });
    expect(review.suggestion.requestType.id).toBe(101);
  });

  it("ignora una sugerencia que no existe en el catálogo que ve la pantalla", () => {
    const review = buildReview({ response: response({ suggestedRequestTypeId: 999 }), categories, summary: "", description: "x", currentRequestTypeId: 201 });
    expect(review.mismatch).toBe(false);
    expect(review.suggestion).toBeNull();
  });

  it("no marca discrepancia si el servidor no la marcó", () => {
    const review = buildReview({ response: response({ mismatch: false }), categories, summary: "", description: "x", currentRequestTypeId: 201 });
    expect(review.mismatch).toBe(false);
  });

  it("conserva la calidad que informó el servidor", () => {
    const review = buildReview({ response: response({ quality: "TOO_VAGUE", suggestedRequestTypeId: null, mismatch: false }), categories, summary: "", description: "x", currentRequestTypeId: 201 });
    expect(review.quality).toBe("TOO_VAGUE");
  });
});

describe("buildReview sin IA", () => {
  it("usa la búsqueda por palabras clave cuando el servidor informa UNAVAILABLE", () => {
    const review = buildReview({
      response: { source: "UNAVAILABLE" }, categories, summary: "", description: "hay un pozo enorme en la calle", currentRequestTypeId: 101,
    });
    expect(review.mode).toBe("rules");
    expect(review.mismatch).toBe(true);
    expect(review.suggestion.requestType.id).toBe(201);
  });

  it("también cae a las reglas si el pedido falló (sin respuesta)", () => {
    const review = buildReview({ response: null, categories, summary: "", description: "la luz no prende y hay oscuridad", currentRequestTypeId: 201 });
    expect(review.mode).toBe("rules");
    expect(review.suggestion.requestType.id).toBe(101);
  });

  it("no marca discrepancia si la mejor coincidencia ya es el tipo elegido", () => {
    const review = buildReview({ response: null, categories, summary: "", description: "hay un pozo enorme en la calle", currentRequestTypeId: 201 });
    expect(review.mismatch).toBe(false);
  });

  it("sin coincidencias no sugiere nada", () => {
    const review = buildReview({ response: null, categories, summary: "", description: "xyzzy qwerty", currentRequestTypeId: 201 });
    expect(review.suggestion).toBeNull();
    expect(review.mismatch).toBe(false);
  });
});
