import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReclassificationPanel from "../ReclassificationPanel";
import ReclassificationResponseForm from "../ReclassificationResponseForm";
import CitizenTicketView from "../CitizenTicketView";
import { canProposeReclassification, reclassificationErrorMessage } from "../../../utils/reclassification";
import * as api from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
  abandonReclassificationProposal: vi.fn(), confirmReclassificationProposal: vi.fn(),
  fetchReclassificationProposal: vi.fn(), proposeTicketReclassification: vi.fn(), fetchNeighborhoods: vi.fn(),
  downloadTicketAttachment: vi.fn(),
}));
const requirements = (extra = {}) => ({ fields: [], missingFields: [], availableAnswers: {}, locationRequired: false, neighborhoodRequired: false, evidenceRequired: false, identificationRequired: false, ...extra });
const ticket = { id: "ticket", currentStatus: "IN_REVIEW", requestTypeCode: "OLD", requestTypeName: "Original" };
const proposal = (extra = {}) => ({ id: 1, requestTypeId: 2, formTemplateId: 5, status: "READY", origin: "INITIAL_REVIEW", requirements: requirements(), ...extra });
const panel = (extra = {}) => {
  const props = { ticket, requestTypes: [{ id: 1, code: "OLD", name: "Original" }, { id: 2, code: "NEW", name: "Nuevo" }], readOnly: false, proposals: [], loading: false, onRefresh: vi.fn(), onBusyChange: vi.fn(), ...extra };
  return { ...render(<ReclassificationPanel {...props} />), props };
};
const responseForm = (extra = {}) => {
  const props = { requirements: requirements(), onAnswer: vi.fn().mockResolvedValue(true), ...extra };
  return { ...render(<ReclassificationResponseForm {...props} />), props };
};
const send = () => fireEvent.click(screen.getByRole("button", { name: "Enviar respuesta" }));
beforeEach(() => vi.resetAllMocks());

describe("autorización visible y errores", () => {
  it("respeta primera revisión, pedidos pendientes y devoluciones consumidas", () => {
    expect(canProposeReclassification(ticket)).toBe(true);
    expect(canProposeReclassification({ ...ticket, currentStatus: "ROUTED" })).toBe(false);
    expect(canProposeReclassification({ ...ticket, pendingInformationRequest: {} })).toBe(false);
    const returned = { actionType: "RETURNED_BY_AREA", reasonCode: "REQUEST_TYPE_MISMATCH", newStatus: "IN_REVIEW" };
    const finalized = { ...ticket, classificationFinalizedAt: "2026-01-01" };
    expect(canProposeReclassification(finalized)).toBe(false);
    expect(canProposeReclassification({ ...finalized, ticketActivities: [returned] })).toBe(true);
    for (const later of [{ actionType: "ROUTED" }, { newStatus: "IN_PROGRESS" }, { ...returned, reasonCode: "OTHER" }, { ...returned, newStatus: "REGISTERED" }]) {
      expect(canProposeReclassification({ ...finalized, ticketActivities: [returned, later] })).toBe(false);
    }
  });
  it("traduce validación, evidencia, conflictos y vencimiento", () => {
    expect(reclassificationErrorMessage({ status: 422 })).toMatch(/evidencia/);
    expect(reclassificationErrorMessage({ code: "EVIDENCE_REQUIRED" })).toMatch(/evidencia/);
    expect(reclassificationErrorMessage({ status: 409 })).toMatch(/Conflicto/);
    expect(reclassificationErrorMessage({ status: 410 })).toMatch(/venció/);
    expect(reclassificationErrorMessage({})).toMatch(/No pudimos/);
  });
});

describe("propuestas staff", () => {
  it("propone con mensaje y conserva el tipo efectivo hasta la confirmación", async () => {
    api.proposeTicketReclassification.mockResolvedValue(proposal({ status: "WAITING_INFORMATION" }));
    const { props } = panel();
    expect(screen.queryByRole("option", { name: "Original" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nuevo tipo propuesto"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/Mensaje para el ciudadano/), { target: { value: "  Aclarar datos  " } });
    fireEvent.click(screen.getByText("Proponer reclasificación"));
    await waitFor(() => expect(props.onRefresh).toHaveBeenCalledOnce());
    expect(api.proposeTicketReclassification).toHaveBeenCalledWith("ticket", { requestTypeId: 2, messageForCitizen: "Aclarar datos" });
    expect(ticket.requestTypeCode).toBe("OLD");
  });
  it("sólo confirma READY, revisa requisitos y permite abandono con motivo", async () => {
    api.abandonReclassificationProposal.mockResolvedValue(proposal({ status: "ABANDONED" }));
    const { props } = panel({ proposals: [proposal({ status: "WAITING_INFORMATION", origin: "REQUEST_TYPE_MISMATCH", requirements: requirements({ missingFields: ["x", "unlisted"], fields: [{ code: "x", label: "Cantidad" }], locationRequired: true, neighborhoodRequired: true, evidenceRequired: true, identificationRequired: true, availableAnswers: { x: 0, bool: false, unknown: null, yes: true } }) })] });
    expect(screen.getByText(/Excepción por devolución/)).toBeInTheDocument();
    expect(screen.getByText("Pendientes: Cantidad, unlisted")).toBeInTheDocument();
    expect(screen.getByLabelText("Respuestas disponibles")).toHaveTextContent("0");
    expect(screen.getByText(/Falta evidencia/)).toBeInTheDocument();
    expect(screen.getByText("Confirmar reclasificación")).toBeDisabled();
    expect(screen.getByText("Abandonar propuesta")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo de abandono"), { target: { value: "  Error en destino  " } });
    fireEvent.click(screen.getByText("Abandonar propuesta"));
    await waitFor(() => expect(props.onRefresh).toHaveBeenCalledOnce());
    expect(api.abandonReclassificationProposal).toHaveBeenCalledWith("ticket", 1, "Error en destino");
  });
  it("confirma READY una sola vez mientras está en curso", async () => {
    let resolve;
    api.confirmReclassificationProposal.mockReturnValue(new Promise((done) => { resolve = done; }));
    const { props } = panel({ proposals: [proposal()] });
    fireEvent.click(screen.getByText("Confirmar reclasificación"));
    fireEvent.click(screen.getByText("Confirmar reclasificación"));
    expect(api.confirmReclassificationProposal).toHaveBeenCalledOnce();
    expect(props.onBusyChange).toHaveBeenCalledWith(true);
    await act(async () => resolve(proposal({ status: "CONFIRMED" })));
    expect(props.onRefresh).toHaveBeenCalledOnce();
  });
  it.each([400, 422, 409, 410])("conserva motivo ante error %s y refresca conflictos/vencimiento", async (status) => {
    api.abandonReclassificationProposal.mockRejectedValue(Object.assign(new Error("Falta un dato"), { status }));
    const { props } = panel({ proposals: [proposal()] });
    fireEvent.change(screen.getByLabelText("Motivo de abandono"), { target: { value: "Motivo guardado" } });
    fireEvent.click(screen.getByText("Abandonar propuesta"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByLabelText("Motivo de abandono")).toHaveValue("Motivo guardado");
    expect(props.onRefresh).toHaveBeenCalledTimes([409, 410].includes(status) ? 1 : 0);
  });
  it("consulta el historial y detalle sin permitir mutaciones propias", async () => {
    api.fetchReclassificationProposal.mockResolvedValue(proposal({ status: "ABANDONED", formTemplateId: null, requirements: null }));
    const { props, rerender } = panel({ readOnly: true, proposals: [proposal({ status: "ABANDONED", abandonmentReason: "Motivo histórico" })] });
    expect(screen.queryByText("Proponer reclasificación")).not.toBeInTheDocument();
    expect(screen.getByText("Motivo: Motivo histórico")).toBeInTheDocument();
    fireEvent.click(screen.getByText("#1 · Abandonada"));
    await waitFor(() => expect(screen.getByText(/Detalle #1/)).toBeInTheDocument());
    expect(api.fetchReclassificationProposal).toHaveBeenCalledWith("ticket", 1);
    rerender(<ReclassificationPanel {...props} ticket={{ ...ticket }} />);
    expect(screen.queryByText(/Detalle #1/)).not.toBeInTheDocument();
  });
  it("muestra errores de carga y permite reintentar", () => {
    const { props } = panel({ error: new Error("red") });
    expect(screen.getByText("Proponer reclasificación")).toBeDisabled();
    fireEvent.click(screen.getByText("Reintentar"));
    expect(props.onRefresh).toHaveBeenCalledOnce();
  });
  it("permite revisar ubicación y descargar evidencia provisional antes de confirmar", async () => {
    api.downloadTicketAttachment.mockResolvedValue(new Blob(["evidence"]));
    URL.createObjectURL = vi.fn(() => "blob:provisional");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    panel({ proposals: [proposal({ proposedData: { location: { addressLine: "Calle 1", latitude: 0, longitude: 0, neighborhoodId: "barrio" }, evidenceIds: ["evidence-id"] } })] });
    expect(screen.getByText(/Ubicación provisional/)).toHaveTextContent("Calle 1 · 0, 0 · Barrio barrio");
    fireEvent.click(screen.getByLabelText("Descargar Evidencia provisional 1"));
    await waitFor(() => expect(api.downloadTicketAttachment).toHaveBeenCalledWith("evidence-id"));
    click.mockRestore();
  });
});

describe("formulario ciudadano versionado", () => {
  const fields = [
    { code: "boolean", label: "Riesgo", type: "BOOLEAN", required: true, displayOrder: 1 },
    { code: "number", label: "Cantidad", type: "NUMBER", required: true, config: { min: 0, max: 5 } },
    { code: "unknown", label: "Detalle", type: "TEXT", required: true, allowUnknown: true },
    { code: "select", label: "Opción", type: "SELECT", config: { options: [{ value: "a", label: "Primera" }] } },
    { code: "date", label: "Fecha", type: "DATE" },
    { code: "text", label: "Texto", type: "TEXTAREA" },
  ];
  it("envía false, 0, null explícito, opciones, fecha y texto con la versión del pedido", async () => {
    const { props } = responseForm({ requirements: requirements({ fields, missingFields: ["boolean", "number", "unknown"] }) });
    fireEvent.change(screen.getByLabelText("Riesgo (obligatorio)"), { target: { value: "false" } });
    fireEvent.change(screen.getByLabelText("Cantidad (obligatorio)"), { target: { value: "0" } });
    fireEvent.click(screen.getByLabelText("No sé / No responde: Detalle"));
    fireEvent.change(screen.getByLabelText("Opción (opcional)"), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("Fecha (opcional)"), { target: { value: "2026-10-20" } });
    fireEvent.change(screen.getByLabelText("Texto (opcional)"), { target: { value: "Aclaración" } });
    send();
    await waitFor(() => expect(props.onAnswer).toHaveBeenCalledWith(null, [], { formData: { boolean: false, number: 0, unknown: null, select: "a", date: "2026-10-20", text: "Aclaración" } }));
    expect(api.fetchNeighborhoods).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Dirección")).not.toBeInTheDocument();
  });
  it("mantiene respuestas disponibles, permite corrección y pide required omitidos", async () => {
    const { props } = responseForm({ requirements: requirements({ fields, availableAnswers: { boolean: false, number: 0, unknown: null } }), onAnswer: vi.fn().mockResolvedValue(false), error: "Faltan datos" });
    expect(screen.getByLabelText("Cantidad (obligatorio)")).toHaveValue(0);
    fireEvent.click(screen.getByLabelText("No sé / No responde: Detalle"));
    send();
    expect(screen.getByRole("alert")).toHaveTextContent("Falta completar: Detalle");
    fireEvent.change(screen.getByLabelText("Detalle (obligatorio)"), { target: { value: "Texto" } });
    fireEvent.change(screen.getByLabelText("Tu respuesta (opcional)"), { target: { value: "Mi texto" } });
    send();
    await waitFor(() => expect(props.onAnswer).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("Tu respuesta (opcional)")).toHaveValue("Mi texto");
    expect(screen.getByRole("alert")).toHaveTextContent("Faltan datos");
  });
  it("exige evidencia y ubicación sólo cuando el pedido lo indica", async () => {
    const file = new File(["evidencia"], "foto.png", { type: "image/png" });
    const { props } = responseForm({ requirements: requirements({ evidenceRequired: true, locationRequired: true }) });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("Falta adjuntar evidencia");
    fireEvent.change(screen.getByLabelText("Adjuntar evidencia (obligatoria)"), { target: { files: [file] } });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("Falta completar la ubicación");
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "Calle 123" } });
    send();
    await waitFor(() => expect(props.onAnswer).toHaveBeenCalledWith(null, [file], { formData: {}, location: { addressLine: "Calle 123" } }));
    expect(screen.queryByText("foto.png")).not.toBeInTheDocument();
  });
  it("no pierde archivos ante error y permite quitarlos", async () => {
    const file = new File(["evidencia"], "foto.png", { type: "image/png" });
    const { props } = responseForm({ onAnswer: vi.fn().mockResolvedValue(false) });
    fireEvent.change(screen.getByLabelText("Adjuntar evidencia (opcional)"), { target: { files: [file] } });
    send(); await waitFor(() => expect(props.onAnswer).toHaveBeenCalledOnce());
    expect(screen.getByText("foto.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Quitar foto.png"));
    expect(screen.queryByText("foto.png")).not.toBeInTheDocument();
  });
  it("solicita barrio, reintenta el catálogo y envía coordenadas 0", async () => {
    api.fetchNeighborhoods.mockRejectedValueOnce(new Error("red")).mockResolvedValue([{ id: "barrio", name: "Centro" }]);
    const { props } = responseForm({ requirements: requirements({ neighborhoodRequired: true, locationRequired: true }) });
    await waitFor(() => expect(screen.getByText("Reintentar barrios")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Reintentar barrios"));
    await waitFor(() => expect(screen.getByText("Centro")).toBeInTheDocument());
    send(); expect(screen.getByRole("alert")).toHaveTextContent("ubicación");
    fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "0" } });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("barrio");
    fireEvent.change(screen.getByLabelText("Barrio"), { target: { value: "barrio" } });
    send(); await waitFor(() => expect(props.onAnswer).toHaveBeenCalledWith(null, [], { formData: {}, location: { latitude: 0, longitude: 0, neighborhoodId: "barrio" } }));
  });
  it("valida pares de coordenadas y conserva el borrador", () => {
    responseForm({ requirements: requirements({ locationRequired: true }) });
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "Calle 1" } });
    fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "0" } });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("juntas");
    fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "999" } });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("inválidas");
  });
  it("valida rangos de la versión fijada y evita valores null no permitidos", () => {
    responseForm({ requirements: requirements({ fields: [{ code: "n", label: "Número", type: "NUMBER", config: { min: 0, max: 3 } }], availableAnswers: { n: null } }) });
    send(); expect(screen.getByRole("alert")).toHaveTextContent("no admite");
  });
  it("bloquea respuestas vencidas y envíos simultáneos", async () => {
    const { props, rerender } = responseForm({ dueAt: "2000-01-01" });
    expect(screen.getByRole("alert")).toHaveTextContent("venció");
    send(); expect(props.onAnswer).not.toHaveBeenCalled();
    let resolve;
    const onAnswer = vi.fn().mockReturnValue(new Promise((done) => { resolve = done; }));
    rerender(<ReclassificationResponseForm {...props} dueAt="2099-01-01" onAnswer={onAnswer} />);
    send(); fireEvent.submit(screen.getByRole("form"));
    expect(onAnswer).toHaveBeenCalledOnce();
    await act(async () => resolve(true));
  });
});

describe("vista ciudadana y privacidad", () => {
  const structuredTicket = { ...ticket, summary: "Ticket", publicId: "TK-1", history: [], currentStatus: "PENDING_INFORMATION", pendingInformationRequest: { purpose: "RECLASSIFICATION", requestedAt: "2026-10-20", reclassification: requirements({ fields: [{ code: "private", label: "Pregunta privada", type: "TEXT", required: true }] }) } };
  it("integra el formulario del pedido en la vista acreditada", () => {
    render(<CitizenTicketView ticket={structuredTicket} actions={{ answerInformation: vi.fn() }} />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText("Pregunta privada (obligatorio)")).toBeInTheDocument();
  });
  it("no muestra datos estructurados ni formulario en read-only", () => {
    render(<CitizenTicketView ticket={structuredTicket} readOnly />, { wrapper: MemoryRouter });
    expect(screen.queryByText(/Pregunta privada/)).not.toBeInTheDocument();
  });
  it("no reemplaza un pedido estructurado incompleto con GENERAL", () => {
    render(<CitizenTicketView ticket={{ ...structuredTicket, pendingInformationRequest: { purpose: "RECLASSIFICATION" } }} />, { wrapper: MemoryRouter });
    expect(screen.getByRole("alert")).toHaveTextContent("requisitos");
    expect(screen.queryByText("Enviar respuesta")).not.toBeInTheDocument();
  });
  it.each(["IN_REVIEW", "CANCELLED"])("mantiene visible el error tras refrescar a %s", (currentStatus) => {
    render(<CitizenTicketView ticket={{ ...structuredTicket, currentStatus, pendingInformationRequest: null }} actionError="El plazo para responder venció." />, { wrapper: MemoryRouter });
    expect(screen.getByRole("alert")).toHaveTextContent("venció");
  });
});
