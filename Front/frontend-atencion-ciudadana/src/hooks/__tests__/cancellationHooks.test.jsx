import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useMyTicketDetail } from "../useMyTicketDetail";
import { useAnonymousTicketAccess } from "../useAnonymousTicketAccess";
import * as api from "../../services/apiClient";
import { cancellationErrorMessage, cancellationReviewRequired } from "../../utils/cancellation";

vi.mock("../../services/apiClient", () => ({
  fetchMyTickets: vi.fn(), fetchMyTicketDetail: vi.fn(), trackTicket: vi.fn(),
  fetchCancellationRequests: vi.fn(), fetchAnonymousCancellationRequests: vi.fn(),
  cancelTicket: vi.fn(), cancelAnonymousTicket: vi.fn(),
  createCancellationRequest: vi.fn(), createAnonymousCancellationRequest: vi.fn(),
}));
const ticket = { id: "ticket", publicId: "TK-1", currentStatus: "REGISTERED" };
const request = { id: "request", ticketId: ticket.id, status: "PENDING", reasonCode: "WITHDRAWN_BY_CITIZEN", reason: "Retiro" };
const http = (status, extra = {}) => Object.assign(new Error("No publicar secretos"), { status, ...extra });
const reviewError = () => http(409, { code: "TICKET_STATE_CONFLICT", message: "El principal tiene duplicados activos: requiere una solicitud de cancelación y revisión administrativa" });
beforeEach(() => {
  vi.resetAllMocks();
  api.fetchMyTickets.mockResolvedValue({ content: [ticket] });
  api.fetchMyTicketDetail.mockResolvedValue(ticket);
  // TrackingTicketResponse deliberately has no internal UUID.
  api.trackTicket.mockResolvedValue({ ...ticket, id: undefined });
  api.fetchCancellationRequests.mockResolvedValue([]); api.fetchAnonymousCancellationRequests.mockResolvedValue([]);
  api.createCancellationRequest.mockResolvedValue(request); api.createAnonymousCancellationRequest.mockResolvedValue(request);
});
async function setup(anonymous) {
  const hook = renderHook(() => anonymous ? useAnonymousTicketAccess("tracking") : useMyTicketDetail("TK-1"));
  if (anonymous) await act(async () => hook.result.current.accredit("secret"));
  await waitFor(() => expect(hook.result.current.ticket).toBeTruthy());
  await waitFor(() => expect(hook.result.current.cancellation.loading).toBe(false));
  return hook;
}
it.each([false, true])("cancelación directa usa estado confirmado sin transición optimista (%s)", async (anonymous) => {
  const { result } = await setup(anonymous);
  let finish;
  const cancel = anonymous ? api.cancelAnonymousTicket : api.cancelTicket;
  cancel.mockReturnValue(new Promise((done) => { finish = done; }));
  let operation;
  act(() => { operation = result.current.actions.requestCancel("Retiro"); });
  expect(result.current.ticket.currentStatus).toBe("REGISTERED");
  await act(async () => { expect(await result.current.actions.requestCancel("doble")).toBe(false); });
  const cancelled = { ...ticket, currentStatus: "CANCELLED" };
  api.fetchMyTicketDetail.mockResolvedValue(cancelled); api.trackTicket.mockResolvedValue({ ...cancelled, id: undefined });
  await act(async () => { finish(cancelled); expect(await operation).toBe(true); });
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(result.current.ticket.currentStatus).toBe("CANCELLED");
  expect(result.current.ticket.history).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.stringMatching(/^local-/) })]));
});
it.each([false, true])("409 específico ofrece solicitud PENDING e historial sin cancelar (%s)", async (anonymous) => {
  const { result } = await setup(anonymous);
  (anonymous ? api.cancelAnonymousTicket : api.cancelTicket).mockRejectedValue(reviewError());
  await act(async () => expect(await result.current.actions.requestCancel()).toBe(false));
  expect(result.current.cancellation.requiresReview).toBe(true);
  const history = anonymous ? api.fetchAnonymousCancellationRequests : api.fetchCancellationRequests;
  history.mockResolvedValue([request]);
  await act(async () => expect(await result.current.cancellation.create({ reasonCode: "OTHER", reason: "Retiro" })).toBe(true));
  expect(result.current.ticket.currentStatus).toBe("REGISTERED");
  expect(result.current.cancellation.pending).toBe(true);
  await act(async () => expect(await result.current.cancellation.create({ reason: "otra" })).toBe(false));
  expect(anonymous ? api.createAnonymousCancellationRequest : api.createCancellationRequest).toHaveBeenCalledTimes(1);
  if (anonymous) expect(api.createAnonymousCancellationRequest).toHaveBeenCalledWith("tracking", "secret", { reasonCode: "OTHER", reason: "Retiro" });
  history.mockResolvedValue([{ ...request, status: "APPROVED", cancellationScope: "GLOBAL" }]);
  api.fetchMyTicketDetail.mockResolvedValue({ ...ticket, currentStatus: "CANCELLED" });
  api.trackTicket.mockResolvedValue({ ...ticket, id: undefined, status: "CANCELLED", currentStatus: "CANCELLED" });
  await act(async () => result.current.cancellation.reload());
  expect(result.current.cancellation.history[0].status).toBe("APPROVED");
  expect(result.current.ticket.currentStatus).toBe("CANCELLED");
});
it.each([400, 401, 403, 404, 409, 410, 500])("errores %s conservan estado y no revelan secretos", async (status) => {
  const { result } = await setup(true);
  api.cancelAnonymousTicket.mockRejectedValue(http(status));
  await act(async () => expect(await result.current.actions.requestCancel("motivo")).toBe(false));
  if (status === 401) {
    expect(result.current.ticket).toBeNull();
    expect(result.current.accredited).toBe(false);
    expect(result.current.accreditError).toMatch(/ya no acredita/);
  } else {
    expect(result.current.ticket.currentStatus).toBe("REGISTERED");
    expect(result.current.actionError).toBe(cancellationErrorMessage({ status }));
    expect(result.current.actionError).not.toContain("secret");
  }
  expect(result.current.cancellation.requiresReview).toBe(false);
});
it("no habilita solicitud por un 409 genérico ni por REGISTERED obsoleto", async () => {
  expect(cancellationReviewRequired(reviewError(), { currentStatus: "IN_REVIEW" })).toBe(false);
  expect(cancellationReviewRequired(http(409), ticket)).toBe(false);
  expect(cancellationErrorMessage()).toMatch(/verificar/);
});
it.each([false, true])("DUPLICATE y terminales no cancelables (%s)", async (anonymous) => {
  api.fetchMyTicketDetail.mockResolvedValue({ ...ticket, currentStatus: "DUPLICATE" });
  api.trackTicket.mockResolvedValue({ ...ticket, id: undefined, currentStatus: "DUPLICATE" });
  const { result } = await setup(anonymous);
  await act(async () => expect(await result.current.actions.requestCancel()).toBe(false));
  expect(api.cancelTicket).not.toHaveBeenCalled(); expect(api.cancelAnonymousTicket).not.toHaveBeenCalled();
});
it("falla cerrado al no poder consultar historial y permite recuperar", async () => {
  api.fetchCancellationRequests.mockRejectedValue(http(500));
  const { result } = await setup(false);
  expect(result.current.cancellation.unavailable).toBe(true);
  await act(async () => expect(await result.current.actions.requestCancel()).toBe(false));
  api.fetchCancellationRequests.mockResolvedValue([]);
  await act(async () => result.current.cancellation.reload());
  expect(result.current.cancellation.unavailable).toBe(false);
});
it("409 de solicitud existente refresca sin declarar creación nueva", async () => {
  const { result } = await setup(false);
  api.createCancellationRequest.mockRejectedValue(http(409));
  api.fetchCancellationRequests.mockResolvedValue([request]);
  await act(async () => expect(await result.current.cancellation.create({ reasonCode: "OTHER", reason: "Motivo" })).toBe(false));
  expect(result.current.cancellation.pending).toBe(true);
  expect(result.current.ticket.currentStatus).toBe("REGISTERED");
});
it("conserva solicitud confirmada cuando falla refresco del ticket", async () => {
  const { result } = await setup(false);
  api.fetchMyTicketDetail.mockRejectedValue(http(500));
  api.fetchCancellationRequests.mockResolvedValue([request]);
  await act(async () => expect(await result.current.cancellation.create({ reason: "Motivo", reasonCode: "OTHER" })).toBe(true));
  expect(result.current.cancellation.pending).toBe(true);
  await act(async () => result.current.cancellation.reload());
  expect(result.current.cancellation.error).toMatch(/verificar/);
});
it("no crea solicitudes sin motivo", async () => {
  const { result } = await setup(false);
  await act(async () => expect(await result.current.cancellation.create({ reason: " " })).toBe(false));
  expect(api.createCancellationRequest).not.toHaveBeenCalled();
});
it("409 y refresco fallido bloquean nuevas acciones hasta recuperación", async () => {
  const { result } = await setup(false);
  api.cancelTicket.mockRejectedValue(reviewError());
  api.fetchMyTicketDetail.mockRejectedValue(http(500));
  await act(async () => result.current.actions.requestCancel());
  expect(result.current.cancellation.unavailable).toBe(true);
  expect(result.current.cancellation.requiresReview).toBe(false);
  await act(async () => result.current.actions.requestCancel());
  expect(api.cancelTicket).toHaveBeenCalledTimes(1);
  api.fetchMyTicketDetail.mockResolvedValue(ticket);
  await act(async () => result.current.cancellation.reload());
  expect(result.current.cancellation.unavailable).toBe(false);
});
it("una creación que termina después de quitar acreditación no restaura datos privados", async () => {
  const { result } = await setup(true);
  let finish;
  api.createAnonymousCancellationRequest.mockReturnValue(new Promise((done) => { finish = done; }));
  let operation;
  act(() => { operation = result.current.cancellation.create({ reason: "Motivo", reasonCode: "OTHER" }); });
  act(() => result.current.reset());
  await act(async () => { finish(request); expect(await operation).toBe(false); });
  expect(result.current.ticket).toBeNull();
  expect(result.current.cancellation.history).toEqual([]);
});
