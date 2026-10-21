import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StaffTicketFacts from "../StaffTicketFacts";
import { hasTicketLocation } from "../../../utils/ticketLocation";

describe("confirmed historical staff facts", () => {
  it("renders historical labels, codes and typed false/zero/null/omitted answers", () => {
    render(<StaffTicketFacts ticket={{ formData: { flag: false, count: 0, unknown: null, choice: "old", date: "2020-01-02", note: "Texto\nmultilínea", legacy: "Sin metadatos" },
      formTemplate: { id: 8, version: 1, fields: [
        { code: "flag", label: "Bandera histórica", type: "BOOLEAN" }, { code: "count", label: "Cantidad", type: "NUMBER" },
        { code: "unknown", label: "Desconocido", type: "TEXT" }, { code: "omitted", label: "Opcional", type: "TEXT" },
        { code: "choice", label: "Opción", type: "SELECT", options: [{ value: "old", label: "Opción histórica" }] },
        { code: "date", label: "Fecha", type: "DATE" }, { code: "note", label: "Contexto", type: "TEXTAREA" },
      ] }, proposedData: { leaked: "Propuesta privada" } }} />);
    for (const text of ["Bandera histórica", "No", "0", "No sé / No responde", "Sin respuesta", "Opción histórica", "2020-01-02", "Sin metadatos"])
      expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText(/Versión 1/)).toBeInTheDocument();
    expect(screen.queryByText("Propuesta privada")).not.toBeInTheDocument();
  });
  it("shows missing data honestly", () => {
    render(<StaffTicketFacts ticket={{ formData: null, location: null, currentProgress: null }} />);
    expect(screen.getByText("Sin respuestas registradas.")).toBeInTheDocument();
    expect(screen.getByText("Sin ubicación informada.")).toBeInTheDocument();
    expect(screen.getByText("Sin progreso informado.")).toBeInTheDocument();
  });
  it.each([0, 37, 100])("uses the stored progress %s", (currentProgress) => {
    render(<StaffTicketFacts ticket={{ currentProgress }} />);
    expect(screen.getByText(`${currentProgress}%`)).toBeInTheDocument();
  });
  it.each([
    [{ addressLine: "Dirección manual" }, "Dirección manual"],
    [{ street: "Calle", streetNumber: "10" }, "Calle 10"],
    [{ neighborhoodId: "n1", neighborhoodName: "Centro" }, "Centro"],
    [{ neighborhoodId: "n1" }, "n1"],
    [{ latitude: 0, longitude: 0 }, "0, 0"],
  ])("renders partial location %o without requiring a map", (location, value) => {
    expect(hasTicketLocation({ location })).toBe(true);
    render(<StaffTicketFacts ticket={{ location }} />);
    expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.queryByText("Sin ubicación informada.")).not.toBeInTheDocument();
  });
  it("the authoritative location flag is used for list indicators", () => {
    expect(hasTicketLocation({ hasLocation: true })).toBe(true);
    expect(hasTicketLocation({ hasLocation: false, neighborhoodName: "Old cached value" })).toBe(false);
    expect(hasTicketLocation({ location: { reference: "Referencia sin ubicación" } })).toBe(false);
    expect(hasTicketLocation({ location: { addressLine: "   " } })).toBe(false);
  });
  it("supports legacy answers with no template and primitive SELECT options", () => {
    render(<StaffTicketFacts ticket={{ formData: { yes: true, choice: "raw", missing: "other", object: { text: "legacy" } },
      formTemplate: { id: 9, version: 2, fields: [
        { code: "choice", label: "Choice", type: "SELECT", options: ["raw"] },
        { code: "missing", label: "Unknown option", type: "SELECT" },
      ] }, location: { reference: "Portón" } }} />);
    expect(screen.getByText("Sí")).toBeInTheDocument();expect(screen.getByText("raw")).toBeInTheDocument();
    expect(screen.getByText("other")).toBeInTheDocument();expect(screen.getByText(/Referencia: Portón/)).toBeInTheDocument();
    expect(screen.getByText('{"text":"legacy"}')).toBeInTheDocument();
  });
});

