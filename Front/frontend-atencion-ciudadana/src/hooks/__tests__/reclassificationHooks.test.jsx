import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useReclassificationProposals } from "../useReclassificationProposals";
import { normalizeTicketDetail, useMyTicketDetail } from "../useMyTicketDetail";
import { useAnonymousTicketAccess } from "../useAnonymousTicketAccess";
import * as api from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({ fetchReclassificationProposals: vi.fn(), fetchMyTickets: vi.fn(), fetchMyTicketDetail: vi.fn(), answerTicketInformation: vi.fn(), trackTicket: vi.fn(), answerAnonymousInformation: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const pending = { id: "ticket", publicId: "TK-1", currentStatus: "PENDING_INFORMATION", pendingInformationRequest: { purpose: "RECLASSIFICATION", requestedAt: "2026-10-20", reclassification: { fields: [], missingFields: [], availableAnswers: {} } } };

it("carga historial, refresca y conserva errores sin habilitar acciones", async () => {
  const ticket = { id: 1 };
  api.fetchReclassificationProposals.mockResolvedValue([{ id: 2, status: "READY" }]);
  const { result, rerender } = renderHook(({ enabled }) => useReclassificationProposals(ticket, enabled), { initialProps: { enabled: false } });
  await act(async () => result.current.reload());
  expect(api.fetchReclassificationProposals).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.proposals).toEqual([{ id: 2, status: "READY" }]);
  api.fetchReclassificationProposals.mockRejectedValue(new Error("offline"));
  await act(async () => result.current.reload());
  expect(result.current.error.message).toBe("offline");
  expect(result.current.proposals).toEqual([]);
});

it("ignora resultados de un ticket anterior y gestiona error inicial", async () => {
  let resolve;
  api.fetchReclassificationProposals.mockReturnValueOnce(new Promise((done) => { resolve = done; })).mockRejectedValue(new Error("offline"));
  const { result, rerender } = renderHook(({ ticket }) => useReclassificationProposals(ticket, true), { initialProps: { ticket: { id: 1 } } });
  rerender({ ticket: { id: 2 } });
  await waitFor(() => expect(result.current.error?.message).toBe("offline"));
  await act(async () => resolve([{ id: 99 }]));
  expect(result.current.proposals).toEqual([]);
});

it("conserva propósito, versión proyectada y valores falsy al normalizar", () => {
  const requirements = { ...pending.pendingInformationRequest.reclassification, availableAnswers: { no: false, zero: 0, unknown: null } };
  const data = normalizeTicketDetail({ ...pending, pendingInformationRequest: { ...pending.pendingInformationRequest, reclassification: requirements } });
  expect(data.pendingInformationRequest).toMatchObject({ purpose: "RECLASSIFICATION", reclassification: requirements });
});

it.each([false, true])("responde con ownership o tracking+contraseña y refresca sin confirmar (anonymous=%s)", async (anonymous) => {
  api.fetchMyTickets.mockResolvedValue({ content: [{ id: "ticket", publicId: "TK-1" }] });
  api.fetchMyTicketDetail.mockResolvedValue(pending);
  api.trackTicket.mockResolvedValue(pending);
  api.answerAnonymousInformation.mockResolvedValue({ currentStatus: "IN_REVIEW" });
  api.answerTicketInformation.mockResolvedValue({ currentStatus: "IN_REVIEW" });
  const { result } = renderHook(() => anonymous ? useAnonymousTicketAccess("tracking") : useMyTicketDetail("TK-1"));
  if (anonymous) await act(async () => result.current.accredit("password"));
  await waitFor(() => expect(result.current.ticket).not.toBeNull());
  const ready = { ...pending, currentStatus: "IN_REVIEW", pendingInformationRequest: null, requestTypeName: "Tipo efectivo anterior" };
  api.trackTicket.mockResolvedValue(ready); api.fetchMyTicketDetail.mockResolvedValue(ready);
  const structured = { formData: { no: false, zero: 0, unknown: null }, location: { addressLine: "Calle 1" } };
  await act(async () => expect(await result.current.actions.answerInformation(null, [], structured)).toBe(true));
  const call = anonymous ? api.answerAnonymousInformation : api.answerTicketInformation;
  expect(call).toHaveBeenCalledWith(anonymous ? "tracking" : "ticket", { responseMessage: null, attachments: [], ...structured, ...(anonymous ? { ticketPassword: "password" } : {}) });
  expect(result.current.ticket.currentStatus).toBe("IN_REVIEW");
  expect(result.current.ticket.requestType.name).toBe("Tipo efectivo anterior");
});

it.each([false, true])("conserva estado ante 400/422 y refresca 409/410 (anonymous=%s)", async (anonymous) => {
  api.fetchMyTickets.mockResolvedValue({ content: [{ id: "ticket", publicId: "TK-1" }] });
  api.fetchMyTicketDetail.mockResolvedValue(pending); api.trackTicket.mockResolvedValue(pending);
  const { result } = renderHook(() => anonymous ? useAnonymousTicketAccess("tracking") : useMyTicketDetail("TK-1"));
  if (anonymous) await act(async () => result.current.accredit("password"));
  await waitFor(() => expect(result.current.ticket).not.toBeNull());
  const call = anonymous ? api.answerAnonymousInformation : api.answerTicketInformation;
  const refresh = anonymous ? api.trackTicket : api.fetchMyTicketDetail;
  for (const status of [400, 422, 409, 410]) {
    const before = refresh.mock.calls.length;
    call.mockRejectedValue(Object.assign(new Error("Falta campo"), { status }));
    await act(async () => expect(await result.current.actions.answerInformation(null, [], { formData: {} })).toBe(false));
    expect(result.current.ticket.pendingInformationRequest.purpose).toBe("RECLASSIFICATION");
    expect(result.current.actionError).toMatch(status === 422 ? /evidencia/ : status === 410 ? /venció/ : status === 409 ? /Conflicto/ : /Falta campo/);
    expect(refresh.mock.calls.length - before).toBe([409, 410].includes(status) ? 1 : 0);
  }
});
