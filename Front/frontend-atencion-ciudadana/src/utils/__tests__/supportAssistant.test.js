import { describe, expect, it } from "vitest";
import { answerQuestion, claimPath, findFaq, isEmergency, suggestRequestTypes } from "../supportAssistant";
import { SUPPORT_FAQ } from "../../data/supportFaq";
import { expandSearchTerms, findRequestTypeMatches, normalizeText } from "../requestTypeSearch";

const catalog = [
  {
    id: "1",
    title: "Alumbrado",
    subcategories: [
      {
        id: "10",
        name: "Luminarias",
        requestTypes: [
          { id: 101, code: "101", name: "Luminaria apagada", description: "No enciende" },
          { id: 102, code: "102", name: "Poste inclinado", description: "Riesgo de caída" },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Calles",
    subcategories: [{ id: "20", name: "Pavimento", requestTypes: [{ id: 201, code: "201", name: "Bache en calzada", description: "Pozo" }] }],
  },
];

describe("requestTypeSearch", () => {
  it("normaliza tildes y mayúsculas", () => {
    expect(normalizeText("ÁRBOL Caído")).toBe("arbol caido");
    expect(normalizeText(null)).toBe("");
  });

  it("expande con sinónimos del grupo", () => {
    const terms = expandSearchTerms("se apagó la luz");
    expect(terms).toContain("alumbrado");
    expect(terms).toContain("luminaria");
  });

  it("encuentra tipos de reclamo por sinónimo, con puntaje", () => {
    const results = findRequestTypeMatches(catalog, "pozo en la calle");
    expect(results.map((r) => r.requestType.id)).toContain(201);
    expect(results.every((r) => r.score > 0)).toBe(true);
    expect(findRequestTypeMatches(catalog, "zzzz")).toEqual([]);
  });
});

describe("supportAssistant", () => {
  it("detecta emergencias", () => {
    expect(isEmergency("Hay un INCENDIO en la esquina")).toBe(true);
    expect(isEmergency("se apagó la luz")).toBe(false);
  });

  it("responde preguntas frecuentes por frase o palabra", () => {
    expect(findFaq("¿cómo hago para cancelar?")?.id).toBe("cancel");
    expect(findFaq("perdí mi código")?.id).toBe("lost-code");
    expect(findFaq("quiero hablar con una persona")?.id).toBe("contact");
    expect(findFaq("xyz")).toBeNull();
  });

  it("sin pregunta frecuente sugiere tipos de reclamo del catálogo", () => {
    const result = answerQuestion("luz apagada", catalog);
    expect(result.type).toBe("requestTypes");
    expect(result.suggestions[0].requestType.name).toBe("Luminaria apagada");
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("devuelve none o empty cuando no hay nada", () => {
    expect(answerQuestion("qwerty", catalog).type).toBe("none");
    expect(answerQuestion("   ").type).toBe("empty");
    expect(answerQuestion("se apagó la luz", []).type).toBe("none");
  });

  it("marca la emergencia aunque haya respuesta", () => {
    expect(answerQuestion("hay un incendio, quiero hacer un reclamo", catalog)).toMatchObject({ type: "faq", emergency: true });
  });

  it("cada pregunta frecuente se resuelve a sí misma al escribirla", () => {
    SUPPORT_FAQ.forEach((faq) => expect(findFaq(faq.question)?.id).toBe(faq.id));
  });

  it("arma el enlace al formulario con los ids del catálogo", () => {
    const [first] = suggestRequestTypes(catalog, "luz");
    expect(claimPath(first)).toBe("/portal-ayuda?category=1&subcategory=10&requestType=101");
  });
});
