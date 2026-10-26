import { describe, expect, it } from "vitest";
import {
  answerQuestion,
  claimPath,
  findFaq,
  findTicketCode,
  isEmergency,
  redactPersonalData,
  suggestRequestTypes,
  tokenize,
} from "../supportAssistant";
import { SUPPORT_FAQ, SUPPORT_TOPICS, TICKET_SCOPE_ANSWER, faqById, faqsForTopic } from "../../data/supportFaq";
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

describe("reconocimiento de preguntas", () => {
  it("ignora palabras vacías y tildes", () => {
    expect(tokenize("¿Cómo SIGO mi reclamo?")).toEqual(["sigo", "reclamo"]);
  });

  it("tolera errores de tipeo, plurales y otro orden de palabras", () => {
    expect(findFaq("como sigo mi reclamoo")?.id).toBe("track");
    expect(findFaq("mi reclamo como seguir")?.id).toBe("track");
    expect(findFaq("kiero cancelar el reclamo")?.id).toBe("cancel");
    expect(findFaq("no puedo adjuntar mis fotos")?.id).toBe("photos");
  });

  it.each([
    ["¿qué puedo reclamar en este sitio?", "what-report"],
    ["no sé qué elegir, no encuentro mi tema", "topic-not-found"],
    ["¿dónde pongo la dirección?", "location"],
    ["no me deja enviar el formulario", "form-errors"],
    ["perdí el código de mi reclamo", "lost-code"],
    ["¿qué significa derivado?", "statuses"],
    ["cuánto tarda en resolverse", "times"],
    ["quiero escribirle al agente", "messages"],
    ["me olvidé de contar algo, quiero agregar información", "add-info"],
    ["cancelación pendiente de revisión", "cancel-request"],
    ["dicen que está resuelto pero no es así", "reopen"],
    ["quiero confirmar la solución", "confirm-resolution"],
    ["quiero modificar mi reclamo", "edit-ticket"],
    ["¿cómo califico la atención?", "survey"],
    ["¿es seguro dar mis datos personales?", "privacy"],
    ["¿puedo hacer un reclamo anónimo?", "anonymous"],
    ["¿dónde veo todos mis reclamos?", "my-claims"],
    ["quiero eliminar mis datos", "delete-data"],
    ["quiero hablar con una persona", "human"],
    ["nadie me contesta", "complaint-delay"],
    ["la página no anda", "technical"],
    ["no veo bien la letra", "accessibility"],
    ["¿cuál es el horario de atención?", "hours"],
    ["quiero pagar la patente", "other-procedures"],
    ["¿sos un robot?", "who-are-you"],
    ["hola", "greeting"],
    ["muchas gracias", "thanks"],
    ["chau", "bye"],
    ["no me sirve", "not-helpful"],
  ])("«%s» → %s", (text, id) => {
    expect(findFaq(text)?.id).toBe(id);
  });

  it("cada pregunta frecuente se resuelve a sí misma al escribirla", () => {
    SUPPORT_FAQ.filter((faq) => faq.question).forEach((faq) => expect(findFaq(faq.question)?.id).toBe(faq.id));
  });

  it("no habla de cuentas, registro ni inicio de sesión", () => {
    const texts = [...SUPPORT_FAQ.flatMap((faq) => [faq.question ?? "", faq.answer, faq.action?.label ?? "", faq.action?.to ?? ""]), TICKET_SCOPE_ANSWER.text];
    texts.forEach((text) => expect(text).not.toMatch(/\bcuenta\b|iniciar sesi|inici[aá]s sesi|ingresar|registrarme|\/ingresar|\/registro/i));
  });

  it("los datos están bien armados", () => {
    const ids = new Set(SUPPORT_FAQ.map((faq) => faq.id));
    expect(ids.size).toBe(SUPPORT_FAQ.length);
    SUPPORT_FAQ.forEach((faq) => {
      expect(faq.answer.length).toBeGreaterThan(10);
      expect(faq.keywords.length).toBeGreaterThan(0);
      (faq.related ?? []).forEach((related) => expect(faqById(related), `${faq.id} → ${related}`).toBeTruthy());
      if (faq.action) expect(faq.action.to).toMatch(/^\//);
    });
    SUPPORT_TOPICS.forEach((topic) => expect(faqsForTopic(topic.id).length).toBeGreaterThan(0));
  });
});

describe("supportAssistant", () => {
  it("detecta emergencias", () => {
    expect(isEmergency("Hay un INCENDIO en la esquina")).toBe(true);
    expect(isEmergency("se apagó la luz")).toBe(false);
  });

  it("una pregunta frecuente clara gana sobre el catálogo", () => {
    expect(answerQuestion("cómo sigo mi reclamo", catalog)).toMatchObject({ type: "faq", faq: { id: "track" } });
  });

  it("sin pregunta frecuente sugiere tipos de reclamo del catálogo", () => {
    const result = answerQuestion("luz apagada", catalog);
    expect(result.type).toBe("requestTypes");
    expect(result.suggestions[0].requestType.name).toBe("Luminaria apagada");
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("sin catálogo, una pista débil igual devuelve la respuesta más cercana", () => {
    expect(answerQuestion("necesito ayuda", [])).toMatchObject({ type: "faq", faq: { id: "what-can-you-do" } });
  });

  it("devuelve none o empty cuando no hay nada", () => {
    expect(answerQuestion("qwerty", catalog).type).toBe("none");
    expect(answerQuestion("   ").type).toBe("empty");
    expect(answerQuestion("se apagó la luz", []).type).toBe("none");
  });

  it("deriva a una persona cuando mencionan un reclamo puntual", () => {
    expect(answerQuestion("qué pasó con TK-2026-000123 ???", catalog)).toMatchObject({ type: "ticketCode", ticketCode: "TK-2026-000123" });
    expect(findTicketCode("sin código")).toBeNull();
  });

  it("marca la emergencia aunque haya respuesta", () => {
    expect(answerQuestion("hay un incendio, quiero hacer un reclamo", catalog)).toMatchObject({ type: "faq", emergency: true });
    expect(answerQuestion("hay un incendio", catalog).emergency).toBe(true);
  });

  it("arma el enlace al formulario con los ids del catálogo", () => {
    const [first] = suggestRequestTypes(catalog, "luz apagada");
    expect(claimPath(first)).toBe("/portal-ayuda?category=1&subcategory=10&requestType=101");
  });
});

describe("redactPersonalData", () => {
  it("tapa emails, números largos y contraseñas dichas en voz alta", () => {
    expect(redactPersonalData("mi mail es ana@correo.com")).toEqual({ text: "mi mail es [dato oculto]", redacted: true });
    expect(redactPersonalData("mi dni es 30.123.456").redacted).toBe(true);
    expect(redactPersonalData("llamame al 11 5555-1234").redacted).toBe(true);
    expect(redactPersonalData("mi clave es hunter2")).toEqual({ text: "mi [dato oculto]", redacted: true });
  });

  it("no toca preguntas normales ni códigos de reclamo", () => {
    expect(redactPersonalData("perdí la contraseña del reclamo")).toEqual({ text: "perdí la contraseña del reclamo", redacted: false });
    expect(redactPersonalData("reclamo TK-2026-000123")).toEqual({ text: "reclamo TK-2026-000123", redacted: false });
    expect(redactPersonalData(null)).toEqual({ text: "", redacted: false });
  });
});
