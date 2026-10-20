import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import CancellationReviewPanel from "../CancellationReviewPanel";
import CitizenTicketView from "../CitizenTicketView";
import TicketReasonDialog from "../TicketReasonDialog";
import * as api from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
  fetchStaffCancellationRequests: vi.fn(), fetchCancellationConflicts: vi.fn(), fetchStaffCancellationRequest: vi.fn(),
  approveCancellationRequest: vi.fn(), rejectCancellationRequest: vi.fn(), resolveCancellationConflict: vi.fn(),
  fetchAgentTickets: vi.fn(), fetchStaffTicketDetail: vi.fn(),
}));
const ticket = { id: "main", publicId: "TK-1", currentStatus: "REGISTERED", history: [] };
const request = { id: "r1", ticketId: "main", status: "PENDING", requesterKind: "IDENTIFIED", requestedByCitizenId: "citizen", reasonCode: "OTHER", reason: "Error original", requestedAt: "2026-10-20T12:00:00Z" };
const conflict = { id: 15, ticketId: "main", origin: "INFO_TIMEOUT", status: "PENDING", reasonCode: "INFO_TIMEOUT", occurredAt: request.requestedAt, publicMessage: "Mensaje público", internalMessage: "Sólo personal" };
beforeEach(() => {
  vi.resetAllMocks();
  api.fetchStaffCancellationRequests.mockResolvedValue([request]);
  api.fetchCancellationConflicts.mockResolvedValue([]);
  api.fetchStaffCancellationRequest.mockResolvedValue(request);
  api.fetchAgentTickets.mockResolvedValue({ content: [], last: true, totalPages: 1 });
});
async function staff(props = {}) {
  const onRefresh = vi.fn().mockResolvedValue(); const onBusyChange = vi.fn();
  const view = render(<MemoryRouter><CancellationReviewPanel ticket={ticket} readOnly={false} onRefresh={onRefresh} onBusyChange={onBusyChange} {...props} /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByText("Cargando revisiones…")).not.toBeInTheDocument());
  return { ...view, onRefresh, onBusyChange };
}
async function chooseRequest() { fireEvent.click(screen.getByRole("button", { name: "Ver solicitud r1" })); await screen.findByText("Detalle r1 · Pendiente de revisión"); }
function fill(decision = "APPROVED", scope = "GLOBAL") {
  fireEvent.change(screen.getByLabelText("Decisión administrativa"), { target: { value: decision } });
  fireEvent.change(screen.getByLabelText("Justificación interna obligatoria"), { target: { value: "Justificación administrativa" } });
  if (decision === "APPROVED") {
    fireEvent.change(screen.getByLabelText("Alcance"), { target: { value: scope } });
    fireEvent.click(screen.getByRole("checkbox"));
  }
}
it.each(["GLOBAL", "PRINCIPAL_ONLY"])("aprobar %s confirma alcance, refresca familia y no inventa estados", async (scope) => {
  const { onRefresh } = await staff();
  await chooseRequest();
  expect(screen.getByRole("button", { name: "Confirmar decisión" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Decisión administrativa"), { target: { value: "APPROVED" } });
  expect(screen.getByLabelText("Alcance")).toHaveValue("");
  fill("APPROVED", scope);
  fireEvent.change(screen.getByLabelText("Mensaje público (opcional)"), { target: { value: "La atención continúa" } });
  const before = [ { id: "oldest", publicId: "TK-2", currentStatus: "DUPLICATE", mainTicketId: "main" }, { id: "child", publicId: "TK-3", currentStatus: "DUPLICATE", mainTicketId: "main" } ];
  const after = before.map((item, index) => ({ ...item, currentStatus: scope === "GLOBAL" ? "CANCELLED" : index === 0 ? "IN_REVIEW" : "DUPLICATE", mainTicketId: scope === "GLOBAL" ? "main" : index === 0 ? null : "oldest" }));
  let approved = false;
  api.fetchAgentTickets.mockImplementation(async () => ({ content: approved ? [] : before, last: true }));
  api.fetchStaffTicketDetail.mockImplementation(async (id) => (approved ? after : before).find((item) => item.id === id));
  api.approveCancellationRequest.mockImplementation(async () => { approved = true; return { ...request, status: "APPROVED", cancellationScope: scope }; });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole("list", { name: "Familia actualizada" })).toBeInTheDocument());
  expect(api.approveCancellationRequest).toHaveBeenCalledWith("main", "r1", { cancellationScope: scope, decisionReason: "Justificación administrativa", publicMessage: "La atención continúa" });
  const family = screen.getByRole("list", { name: "Familia actualizada" });
  expect(within(family).getByRole("link", { name: "TK-2" })).toHaveAttribute("href", "/agente/tickets/oldest");
  expect(family).toHaveTextContent(scope === "GLOBAL" ? "CANCELLED" : "IN_REVIEW");
  if (scope === "PRINCIPAL_ONLY") expect(family).toHaveTextContent("Principal: oldest");
  expect(family).not.toHaveTextContent("PROMOTED");
});
it("rechazo motivado no envía scope ni mensaje público", async () => {
  const { onRefresh } = await staff(); await chooseRequest(); fill("REJECTED");
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  expect(api.rejectCancellationRequest).toHaveBeenCalledWith("main", "r1", { decisionReason: "Justificación administrativa" });
  expect(screen.getByText("REGISTERED")).toBeInTheDocument();
});
it.each(["INFO_TIMEOUT", "EXTERNAL_REJECTED"])("resuelve conflicto %s conservando estado mientras espera", async (origin) => {
  api.fetchCancellationConflicts.mockResolvedValue([{ ...conflict, origin }]);
  await staff({ ticket: { ...ticket, currentStatus: origin === "INFO_TIMEOUT" ? "IN_REVIEW" : "ROUTED" } });
  expect(screen.getByText(/Sólo personal/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Revisar conflicto 15" }));
  await screen.findByLabelText("Decisión administrativa"); fill();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await waitFor(() => expect(api.resolveCancellationConflict).toHaveBeenCalledWith("main", 15, { decision: "APPROVED", cancellationScope: "GLOBAL", decisionReason: "Justificación administrativa" }));
});
it("rechaza conflicto sin alcance", async () => {
  api.fetchCancellationConflicts.mockResolvedValue([conflict]); await staff();
  fireEvent.click(screen.getByRole("button", { name: "Revisar conflicto 15" }));
  await screen.findByLabelText("Decisión administrativa"); fill("REJECTED");
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await waitFor(() => expect(api.resolveCancellationConflict).toHaveBeenCalledWith("main", 15, { decision: "REJECTED", decisionReason: "Justificación administrativa" }));
});
it.each([403, 409])("error %s conserva borrador y refresca sin reaprobar automáticamente", async (status) => {
  api.approveCancellationRequest.mockRejectedValue({ status });
  const { onRefresh } = await staff(); await chooseRequest(); fill();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await screen.findByRole("alert");
  expect(onRefresh).toHaveBeenCalled();
  expect(api.approveCancellationRequest).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Justificación interna obligatoria")).toHaveValue("Justificación administrativa");
  fireEvent.change(screen.getByLabelText("Decisión administrativa"), { target: { value: "REJECTED" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await waitFor(() => expect(api.rejectCancellationRequest).toHaveBeenCalledTimes(1));
});
it("ticket propio permite lectura pero bloquea decisiones", async () => {
  api.fetchCancellationConflicts.mockResolvedValue([conflict]); await staff({ readOnly: true }); await chooseRequest();
  expect(screen.queryByLabelText("Decisión administrativa")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Revisar conflicto 15" })).toBeDisabled();
});
it("una decisión concurrente terminal actualiza también el detalle abierto", async () => {
  await staff(); await chooseRequest(); fill();
  api.fetchStaffCancellationRequests.mockResolvedValue([{ ...request, status: "APPROVED", cancellationScope: "GLOBAL" }]);
  api.approveCancellationRequest.mockRejectedValue({ status: 409 });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar decisión" }));
  await screen.findByRole("alert");
  expect(screen.getByText("Detalle r1 · Aprobada")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Confirmar decisión" })).not.toBeInTheDocument();
});
it("historial decidido muestra auditoría sin formulario mutable", async () => {
  const decided = { ...request, requesterKind: "ANONYMOUS", status: "APPROVED", reviewedAt: request.requestedAt, reviewedBy: "staff", cancellationScope: "GLOBAL", decisionReason: "Revisado" };
  api.fetchStaffCancellationRequests.mockResolvedValue([decided]); api.fetchStaffCancellationRequest.mockResolvedValue(decided);
  api.fetchCancellationConflicts.mockResolvedValue([{ ...conflict, status: "REJECTED", cancellationScope: "GLOBAL", decisionReason: "No aplica" }]);
  await staff(); fireEvent.click(screen.getByRole("button", { name: "Ver solicitud r1" }));
  await screen.findByText("Detalle r1 · Aprobada");
  expect(screen.queryByLabelText("Decisión administrativa")).not.toBeInTheDocument();
  expect(screen.getAllByText("Revisada por: staff")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar detalle de revisión" }));
  expect(screen.queryByText("Detalle r1 · Aprobada")).not.toBeInTheDocument();
});
it("falla cerrado en consulta y recupera con actualización", async () => {
  api.fetchCancellationConflicts.mockRejectedValue({ status: 401 });
  await staff(); expect(screen.getByRole("alert")).toHaveTextContent(/autenticación/);
  api.fetchCancellationConflicts.mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button", { name: "Actualizar revisiones y ticket" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});
it("bloquea doble aprobación y dobles clicks", async () => {
  await staff(); await chooseRequest(); fill(); let finish;
  api.approveCancellationRequest.mockReturnValue(new Promise((done) => { finish = done; }));
  const button = screen.getByRole("button", { name: "Confirmar decisión" });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(api.approveCancellationRequest).toHaveBeenCalledTimes(1));
  expect(button).toBeDisabled();
  await act(async () => finish({ ...request, status: "APPROVED" }));
});
it("consulta familia paginada y filtra vínculos reales", async () => {
  api.fetchAgentTickets.mockResolvedValueOnce({ content: [{ id: "other" }], last: false, totalPages: 2 }).mockResolvedValueOnce({ content: [{ id: "child" }], last: true, totalPages: 2 });
  api.fetchStaffTicketDetail.mockImplementation(async (id) => ({ id, publicId: id, currentStatus: "DUPLICATE", mainTicketId: id === "child" ? "main" : "another" }));
  await staff(); fireEvent.click(screen.getByRole("button", { name: "Consultar familia vinculada" }));
  await screen.findByRole("list", { name: "Familia actualizada" });
  expect(screen.getByRole("link", { name: "child" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "other" })).not.toBeInTheDocument();
});
it("solicitud ciudadana conserva borrador, requiere motivo y presenta PENDING", async () => {
  const cancellation = { requiresReview: true, history: [], loading: false, pending: false, busy: false, unavailable: false, create: vi.fn().mockResolvedValue(false), reload: vi.fn(), error: null };
  const { rerender } = render(<MemoryRouter><CitizenTicketView ticket={ticket} cancellation={cancellation} /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Solicitar revisión de cancelación" }));
  expect(screen.getByRole("button", { name: "Enviar solicitud de cancelación" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Código de motivo"), { target: { value: "OTHER" } });
  fireEvent.change(screen.getByLabelText("Motivo de la solicitud (obligatorio)"), { target: { value: "Mi motivo" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud de cancelación" }));
  await waitFor(() => expect(cancellation.create).toHaveBeenCalledWith({ reasonCode: "OTHER", reason: "Mi motivo" }));
  expect(screen.getByLabelText("Motivo de la solicitud (obligatorio)")).toHaveValue("Mi motivo");
  cancellation.create.mockResolvedValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud de cancelación" }));
  await waitFor(() => expect(screen.queryByLabelText("Motivo de la solicitud (obligatorio)")).not.toBeInTheDocument());
  rerender(<MemoryRouter><CitizenTicketView ticket={ticket} cancellation={{ ...cancellation, pending: true, history: [request] }} /></MemoryRouter>);
  expect(screen.getByText("(PENDING)")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Solicitar revisión de cancelación" })).not.toBeInTheDocument();
});
it("tracking read-only nunca presenta solicitudes privadas", () => {
  const cancellation = { history: [request], reload: vi.fn() };
  render(<MemoryRouter><CitizenTicketView ticket={ticket} readOnly cancellation={cancellation} /></MemoryRouter>);
  expect(screen.queryByRole("region", { name: "Solicitudes de cancelación" })).not.toBeInTheDocument();
  expect(screen.queryByText("Error original")).not.toBeInTheDocument();
});
it("diálogo administrativo existente exige alcance explícito, motivo y confirmación", () => {
  const confirm = vi.fn();
  render(<TicketReasonDialog title="Cancelar ticket" cancellationScopeRequired onConfirm={confirm} onCancel={vi.fn()} />);
  fireEvent.change(screen.getByPlaceholderText("Ej.: AREA_NOT_RESPONSIBLE"), { target: { value: "OTHER" } });
  fireEvent.change(screen.getByPlaceholderText("Explicá brevemente el motivo…"), { target: { value: "Aviso público" } });
  expect(screen.getByRole("button", { name: "Confirmar", exact: true })).toBeDisabled();
  expect(screen.getByLabelText("Alcance de cancelación")).toHaveValue("");
  fireEvent.change(screen.getByLabelText("Alcance de cancelación"), { target: { value: "GLOBAL" } });
  fireEvent.change(screen.getByLabelText("Justificación de alcance"), { target: { value: "Todo el incidente es inválido" } });
  expect(screen.getByRole("button", { name: "Confirmar", exact: true })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar", exact: true }));
  expect(confirm).toHaveBeenCalledWith({ reasonCode: "OTHER", publicMessage: "Aviso público", internalMessage: "", cancellationScope: "GLOBAL", decisionReason: "Todo el incidente es inválido" });
});
