import { describe, expect, it } from "vitest";
import { buildReviewItems } from "../ticketReview";
import { UNKNOWN_VALUE } from "../ticketFormValidation";

const base = {
  requestType: { name: "Luminaria apagada" },
  formData: {
    summary: "  Luz apagada  ",
    description: "  No enciende hace tres noches  ",
    address: "Av. Santa Fe",
    streetNumber: "1234",
    neighborhoodId: "n1",
    latitude: null,
    longitude: null,
    contactChannel: "",
    ticketPassword: "",
    specificData: {},
  },
  specificFields: [],
  neighborhoods: [{ id: "n1", name: "Palermo" }],
  attachments: [],
};

const byId = (items, id) => items.find((item) => item.id === id);

describe("buildReviewItems", () => {
  it("arma las filas básicas con textos recortados y destino de corrección", () => {
    const items = buildReviewItems(base);
    expect(items.map((item) => item.id)).toEqual(["type", "summary", "description", "location", "attachments"]);
    expect(byId(items, "type")).toMatchObject({ lines: ["Luminaria apagada"] });
    expect(byId(items, "type").target).toBeUndefined();
    expect(byId(items, "summary")).toMatchObject({ lines: ["Luz apagada"], target: '[name="summary"]' });
    expect(byId(items, "description").lines).toEqual(["No enciende hace tres noches"]);
  });

  it("describe la ubicación con dirección, barrio y punto del mapa", () => {
    const withMap = { ...base, formData: { ...base.formData, latitude: -34.6, longitude: -58.4 } };
    expect(byId(buildReviewItems(withMap), "location").lines).toEqual(["Av. Santa Fe 1234", "Barrio Palermo", "Punto marcado en el mapa"]);
    const empty = { ...base, formData: { ...base.formData, address: "", streetNumber: "", neighborhoodId: "" } };
    expect(byId(buildReviewItems(empty), "location").lines).toEqual(["Sin ubicación indicada"]);
    expect(byId(buildReviewItems({ ...base, neighborhoods: [] }), "location").lines).toEqual(["Av. Santa Fe 1234"]);
  });

  it("formatea las respuestas específicas según su tipo", () => {
    const fields = [
      { key: "peligro", label: "¿Es peligroso?", backendType: "BOOLEAN" },
      { key: "tipo", label: "Tipo", backendType: "SELECT", options: [{ value: "A", label: "Poste" }] },
      { key: "desde", label: "Desde", backendType: "DATE" },
      { key: "cantidad", label: "Cantidad", backendType: "NUMBER" },
      { key: "nota", label: "Nota", backendType: "TEXT" },
      { key: "ref", label: "Referencia", backendType: "TEXT", allowUnknown: true },
      { key: "otro", label: "Otro", backendType: "SELECT", options: [] },
    ];
    const specificData = { peligro: "true", tipo: "A", desde: "2026-10-05", cantidad: 0, ref: UNKNOWN_VALUE, otro: "X" };
    const items = buildReviewItems({ ...base, specificFields: fields, formData: { ...base.formData, specificData } });
    expect(byId(items, "specific_peligro").lines).toEqual(["Sí"]);
    expect(byId(items, "specific_tipo").lines).toEqual(["Poste"]);
    expect(byId(items, "specific_desde").lines).toEqual(["05/10/2026"]);
    expect(byId(items, "specific_cantidad").lines).toEqual(["0"]);
    expect(byId(items, "specific_nota").lines).toEqual(["Sin responder"]);
    expect(byId(items, "specific_ref").lines).toEqual(["No sé / Prefiero no responder"]);
    expect(byId(items, "specific_otro").lines).toEqual(["X"]);
    expect(byId(items, "specific_nota").target).toBe('[name="specific_nota"]');
    const no = buildReviewItems({ ...base, specificFields: [fields[0]], formData: { ...base.formData, specificData: { peligro: false } } });
    expect(byId(no, "specific_peligro").lines).toEqual(["No"]);
  });

  it("lista los adjuntos por nombre", () => {
    const items = buildReviewItems({ ...base, attachments: [{ name: "foto.jpg" }, { name: "plano.pdf" }] });
    expect(byId(items, "attachments").lines).toEqual(["foto.jpg", "plano.pdf"]);
    expect(byId(items, "attachments").target).toBe("#ticket-attachments");
  });

  it("en un reclamo anónimo muestra el contacto pero nunca la contraseña", () => {
    const anon = buildReviewItems({ ...base, anonymous: true, formData: { ...base.formData, contactChannel: "ana@correo.com", ticketPassword: "secreto123" } });
    expect(byId(anon, "contact").lines).toEqual(["ana@correo.com"]);
    expect(byId(anon, "password").lines).toEqual(["Elegida por vos (no se muestra)"]);
    expect(JSON.stringify(anon)).not.toContain("secreto123");
    const auto = buildReviewItems({ ...base, anonymous: true });
    expect(byId(auto, "contact").lines).toEqual(["No dejaste un contacto"]);
    expect(byId(auto, "password").lines).toEqual(["Te la generamos al enviar"]);
    expect(byId(buildReviewItems(base), "contact")).toBeUndefined();
  });
});
