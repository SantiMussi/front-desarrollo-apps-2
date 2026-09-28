import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeTicketDetail, useMyTicketDetail } from "../useMyTicketDetail";
import { useAnonymousTicketAccess } from "../useAnonymousTicketAccess";
import * as api from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  answerTicketInformation: vi.fn(),
  cancelTicket: vi.fn(),
  confirmTicketResolution: vi.fn(),
  fetchMyTicketDetail: vi.fn(),
  fetchMyTickets: vi.fn(),
  submitSatisfactionSurvey: vi.fn(),
  reopenTicket: vi.fn(),
  trackTicket: vi.fn(),
  cancelAnonymousTicket: vi.fn(),
  confirmAnonymousResolution: vi.fn(),
  reopenAnonymousTicket: vi.fn(),
  answerAnonymousInformation: vi.fn(),
  rateAnonymousTicketAttention: vi.fn(),
  sendAnonymousMessage: vi.fn(),
  uploadAnonymousAttachment: vi.fn(),
  downloadAnonymousAttachment: vi.fn(),
}));

const httpError = (status, message = "Falló", code) => Object.assign(new Error(message), { status, code });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("normalizeTicketDetail", () => {
  it("aplica valores por defecto para un ticket vacío", () => {
    expect(normalizeTicketDetail(null, "TK-1")).toMatchObject({
      id: null,
      publicId: "TK-1",
      currentStatus: "REGISTERED",
      summary: "",
      description: "",
      createdAt: null,
      statusChangedAt: null,
      escalated: false,
      escalationReasonCode: null,
      slaNearDue: false,
      slaBreached: false,
      requestType: null,
      category: null,
      subcategory: null,
      neighborhoodName: null,
      attachments: [],
      messages: [],
      pendingInformationRequest: null,
      history: [],
      rating: null,
    });
  });

  it("acepta los nombres alternativos del backend", () => {
    const ticket = normalizeTicketDetail(
      {
        id: 7,
        status: "IN_REVIEW",
        updatedAt: "u",
        createdAt: "c",
        confirmationDueAt: "due",
        requestTypeName: "RT",
        categoryName: "C",
        subcategoryName: "S",
        location: { neighborhood: "Palermo" },
        escalated: true,
        slaNearDue: true,
        slaBreached: true,
        attachments: [{ id: 1 }],
        messages: [{ id: 2 }],
        rating: 5,
      },
      "x"
    );
    expect(ticket).toMatchObject({
      publicId: "7",
      currentStatus: "IN_REVIEW",
      statusChangedAt: "u",
      resolutionConfirmationDueAt: "due",
      requestType: { name: "RT" },
      category: { name: "C" },
      subcategory: { name: "S" },
      neighborhoodName: "Palermo",
      escalated: true,
      slaNearDue: true,
      slaBreached: true,
      attachments: [{ id: 1 }],
      messages: [{ id: 2 }],
      rating: 5,
    });
  });

  it("normaliza la solicitud de información pendiente", () => {
    const ticket = normalizeTicketDetail(
      { pendingInformationRequest: { status: "OPEN", messageForCitizen: "m", requestedAt: "r", dueAt: "d", attachments: [{ id: 1 }] } },
      "x"
    );
    expect(ticket.pendingInformationRequest).toEqual({ status: "OPEN", messageForCitizen: "m", requestedAt: "r", dueAt: "d", attachments: [{ id: 1 }] });
    expect(normalizeTicketDetail({ pendingInformationRequest: { status: "OPEN" } }, "x").pendingInformationRequest.attachments).toEqual([]);
  });

  it("mapea ticketActivities con etiqueta por defecto y respeta history/activities", () => {
    const mapped = normalizeTicketDetail(
      {
        ticketActivities: [
          { sequence: 1, actionType: "TICKET_CREATED", newStatus: "REGISTERED", occurredAt: "t1" },
          { sequence: 2, actionType: "DESCONOCIDA", message: "Mensaje propio", occurredAt: "t2" },
          { sequence: 3, actionType: "OTRA_RARA", occurredAt: "t3" },
        ],
      },
      "x"
    ).history;
    expect(mapped.map((item) => item.message)).toEqual(["Ticket creado", "Mensaje propio", null]);
    expect(mapped[0].id).toBe("activity-1");
    expect(normalizeTicketDetail({ history: [{ id: "h" }] }, "x").history).toEqual([{ id: "h" }]);
    expect(normalizeTicketDetail({ activities: [{ id: "a" }] }, "x").history).toEqual([{ id: "a" }]);
  });

  it("arma un historial de respaldo con el estado actual", () => {
    const registered = normalizeTicketDetail({ createdAt: "c", currentStatus: "REGISTERED", statusChangedAt: "s" }, "x").history;
    expect(registered).toHaveLength(1);
    const advanced = normalizeTicketDetail({ createdAt: "c", currentStatus: "IN_REVIEW", statusChangedAt: "s" }, "x").history;
    expect(advanced.map((item) => item.newStatus)).toEqual(["REGISTERED", "IN_REVIEW"]);
    const noChangeDate = normalizeTicketDetail({ createdAt: "c", status: "IN_REVIEW" }, "x").history;
    expect(noChangeDate).toHaveLength(1);
  });
});

describe("useMyTicketDetail", () => {
  const raw = { id: 10, publicId: "TK-10", currentStatus: "RESOLVED", createdAt: "c" };

  const setup = async () => {
    api.fetchMyTickets.mockResolvedValue({ content: [{ id: 10, publicId: "TK-10" }] });
    api.fetchMyTicketDetail.mockResolvedValue(raw);
    const hook = renderHook(() => useMyTicketDetail("TK-10"));
    await waitFor(() => expect(hook.result.current.ticket).not.toBeNull());
    return hook;
  };

  it("busca el ticket entre los propios y carga su detalle", async () => {
    const { result } = await setup();
    expect(api.fetchMyTickets).toHaveBeenCalledWith({ size: 200 });
    expect(api.fetchMyTicketDetail).toHaveBeenCalledWith(10);
    expect(result.current.ticket.publicId).toBe("TK-10");
    expect(result.current.error).toBeNull();
  });

  it.each([
    ["no está en la lista", { content: [] }, undefined, /No encontramos este reclamo/],
    ["la respuesta no es una página", null, undefined, /No encontramos este reclamo/],
    ["403", { content: [{ id: 10, publicId: "TK-10" }] }, httpError(403), /No tenés acceso/],
    ["401", { content: [{ id: 10, publicId: "TK-10" }] }, httpError(401), /sesión no es válida/],
    ["500", { content: [{ id: 10, publicId: "TK-10" }] }, httpError(500), /No pudimos conectar/],
  ])("informa el error cuando %s", async (_case, page, detailError, expected) => {
    api.fetchMyTickets.mockResolvedValue(page);
    if (detailError) api.fetchMyTicketDetail.mockRejectedValue(detailError);
    const { result } = renderHook(() => useMyTicketDetail("TK-10"));
    await waitFor(() => expect(result.current.error).toMatch(expected));
    expect(result.current.ticket).toBeNull();
  });

  it("informa 404 cuando el detalle no existe", async () => {
    api.fetchMyTickets.mockResolvedValue({ content: [{ id: 10, publicId: "TK-10" }] });
    api.fetchMyTicketDetail.mockRejectedValue(httpError(404));
    const { result } = renderHook(() => useMyTicketDetail("TK-10"));
    await waitFor(() => expect(result.current.error).toBe("No encontramos este reclamo."));
  });

  it("confirma la resolución y cierra el ticket localmente", async () => {
    const { result } = await setup();
    api.confirmTicketResolution.mockResolvedValue({});
    let ok;
    await act(async () => {
      ok = await result.current.actions.confirmResolution();
    });
    expect(ok).toBe(true);
    expect(api.confirmTicketResolution).toHaveBeenCalledWith(10);
    expect(result.current.ticket.currentStatus).toBe("CLOSED");
    expect(result.current.ticket.history.at(-1)).toMatchObject({ actionType: "CLOSED" });
  });

  it("reabre con motivo y cancela con o sin comentario", async () => {
    const { result } = await setup();
    api.reopenTicket.mockResolvedValue({});
    api.cancelTicket.mockResolvedValue({});
    await act(async () => {
      await result.current.actions.requestReopen("Sigue roto");
    });
    expect(api.reopenTicket).toHaveBeenCalledWith(10, { reason: "Sigue roto" });
    expect(result.current.ticket.currentStatus).toBe("IN_PROGRESS");
    await act(async () => {
      await result.current.actions.requestCancel("Ya no lo necesito");
    });
    expect(api.cancelTicket).toHaveBeenCalledWith(10, { reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: "Ya no lo necesito" });
    expect(result.current.ticket.currentStatus).toBe("CANCELLED");
    expect(result.current.ticket.history.at(-1).message).toContain("Ya no lo necesito");
    await act(async () => {
      await result.current.actions.requestCancel();
    });
    expect(api.cancelTicket).toHaveBeenLastCalledWith(10, { reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: null });
    expect(result.current.ticket.history.at(-1).message).toBe("El vecino canceló el reclamo.");
  });

  it.each([
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(409, ""), /no permite esta acción/],
    [httpError(200, "", "TICKET_RESOLUTION_CONFLICT"), /no permite esta acción/],
    [httpError(410), "El plazo para responder venció."],
    [httpError(200, "", "INFORMATION_REQUEST_EXPIRED"), "El plazo para responder venció."],
    [httpError(403), /No tenés permiso/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(400, "Datos"), "Datos"],
    [httpError(400, ""), /Faltan datos obligatorios/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos completar la acción/],
  ])("traduce el error de acción %#", async (error, expected) => {
    const { result } = await setup();
    api.confirmTicketResolution.mockRejectedValue(error);
    let ok;
    await act(async () => {
      ok = await result.current.actions.confirmResolution();
    });
    expect(ok).toBe(false);
    if (expected instanceof RegExp) expect(result.current.actionError).toMatch(expected);
    else expect(result.current.actionError).toBe(expected);
    expect(result.current.actionLoading).toBe(false);
    expect(result.current.ticket.currentStatus).toBe("RESOLVED");
  });

  it("no ejecuta acciones sin ticket cargado", async () => {
    api.fetchMyTickets.mockResolvedValue({ content: [] });
    const { result } = renderHook(() => useMyTicketDetail("nope"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.actions.confirmResolution()).resolves.toBe(false);
    await expect(result.current.actions.requestReopen("x")).resolves.toBe(false);
    await expect(result.current.actions.requestCancel("x")).resolves.toBe(false);
    await expect(result.current.actions.answerInformation("x")).resolves.toBe(false);
    await expect(result.current.actions.rateAttention(5, "x")).resolves.toBe(false);
  });

  it("responde una solicitud de información y actualiza el estado", async () => {
    api.fetchMyTickets.mockResolvedValue({ content: [{ id: 10, publicId: "TK-10" }] });
    api.fetchMyTicketDetail.mockResolvedValue({
      ...raw,
      currentStatus: "PENDING_INFORMATION",
      pendingInformationRequest: { status: "OPEN", messageForCitizen: "¿Foto?" },
    });
    const { result } = renderHook(() => useMyTicketDetail("TK-10"));
    await waitFor(() => expect(result.current.ticket).not.toBeNull());
    api.answerTicketInformation.mockResolvedValue({ currentStatus: "IN_REVIEW", answeredAt: "2026-03-01T00:00:00Z" });
    let ok;
    await act(async () => {
      ok = await result.current.actions.answerInformation("Acá va", [new File(["x"], "f.png")]);
    });
    expect(ok).toBe(true);
    expect(api.answerTicketInformation).toHaveBeenCalledWith(10, { responseMessage: "Acá va", attachments: [expect.any(File)] });
    expect(result.current.ticket).toMatchObject({ currentStatus: "IN_REVIEW", pendingInformationRequest: null, statusChangedAt: "2026-03-01T00:00:00Z" });
  });

  it("responde sin fecha ni estado en la respuesta y sin archivos", async () => {
    const { result } = await setup();
    api.answerTicketInformation.mockResolvedValue({});
    await act(async () => {
      await result.current.actions.answerInformation("hola");
    });
    expect(api.answerTicketInformation).toHaveBeenCalledWith(10, { responseMessage: "hola", attachments: [] });
    expect(result.current.ticket.currentStatus).toBe("RESOLVED");
  });

  it("informa el error al responder información", async () => {
    const { result } = await setup();
    api.answerTicketInformation.mockRejectedValue(httpError(410));
    let ok;
    await act(async () => {
      ok = await result.current.actions.answerInformation("tarde");
    });
    expect(ok).toBe(false);
    expect(result.current.actionError).toBe("El plazo para responder venció.");
  });

  it("califica la atención sólo si el ticket está cerrado", async () => {
    const { result } = await setup();
    await expect(result.current.actions.rateAttention(4, "ok")).resolves.toBe(false);
    api.fetchMyTicketDetail.mockResolvedValue({ ...raw, currentStatus: "CLOSED" });
    await act(async () => result.current.reload());
    api.submitSatisfactionSurvey.mockResolvedValue({});
    let ok;
    await act(async () => {
      ok = await result.current.actions.rateAttention(4, "Muy bien");
    });
    expect(ok).toBe(true);
    expect(api.submitSatisfactionSurvey).toHaveBeenCalledWith(10, { score: 4, comment: "Muy bien" });
    expect(result.current.ticket).toMatchObject({ rating: 4, ratingComment: "Muy bien" });
    await act(async () => {
      await result.current.actions.rateAttention(5);
    });
    expect(result.current.ticket.ratingComment).toBeNull();
  });

  it("traduce el error de la encuesta, incluyendo el 409 propio", async () => {
    api.fetchMyTickets.mockResolvedValue({ content: [{ id: 10, publicId: "TK-10" }] });
    api.fetchMyTicketDetail.mockResolvedValue({ ...raw, currentStatus: "CLOSED" });
    const { result } = renderHook(() => useMyTicketDetail("TK-10"));
    await waitFor(() => expect(result.current.ticket).not.toBeNull());
    api.submitSatisfactionSurvey.mockRejectedValueOnce(httpError(409, ""));
    await act(async () => {
      await result.current.actions.rateAttention(3);
    });
    expect(result.current.actionError).toMatch(/Ya enviaste una encuesta/);
    api.submitSatisfactionSurvey.mockRejectedValueOnce(httpError(409, "Ya calificaste"));
    await act(async () => {
      await result.current.actions.rateAttention(3);
    });
    expect(result.current.actionError).toBe("Ya calificaste");
    api.submitSatisfactionSurvey.mockRejectedValueOnce(httpError(403));
    await act(async () => {
      await result.current.actions.rateAttention(3);
    });
    expect(result.current.actionError).toMatch(/No tenés permiso/);
  });
});

describe("useAnonymousTicketAccess", () => {
  const accreditedTicket = { publicId: "TK-1", currentStatus: "RESOLVED", createdAt: "c", messages: [{ id: 1 }] };

  const setup = async () => {
    api.trackTicket.mockResolvedValue(accreditedTicket);
    const hook = renderHook(() => useAnonymousTicketAccess("ABC"));
    await act(async () => {
      await hook.result.current.accredit("pw");
    });
    return hook;
  };

  it("acredita con la contraseña", async () => {
    const { result } = await setup();
    expect(api.trackTicket).toHaveBeenCalledWith("ABC", "pw");
    expect(result.current.accredited).toBe(true);
    expect(result.current.ticket.publicId).toBe("TK-1");
    expect(result.current.accrediting).toBe(false);
  });

  it.each([
    [httpError(401), "La contraseña ingresada no es correcta."],
    [httpError(404), "No encontramos ese ticket."],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos validar la contraseña/],
  ])("traduce el error de acreditación %#", async (error, expected) => {
    api.trackTicket.mockRejectedValue(error);
    const { result } = renderHook(() => useAnonymousTicketAccess("ABC"));
    let ok;
    await act(async () => {
      ok = await result.current.accredit("mala");
    });
    expect(ok).toBe(false);
    if (expected instanceof RegExp) expect(result.current.accreditError).toMatch(expected);
    else expect(result.current.accreditError).toBe(expected);
    expect(result.current.accredited).toBe(false);
  });

  it("no permite acciones sin acreditar", async () => {
    const { result } = renderHook(() => useAnonymousTicketAccess("ABC"));
    await expect(result.current.actions.confirmResolution()).resolves.toBe(false);
    await expect(result.current.actions.requestReopen("x")).resolves.toBe(false);
    await expect(result.current.actions.requestCancel("x")).resolves.toBe(false);
    await expect(result.current.actions.answerInformation("x")).resolves.toBe(false);
    await expect(result.current.actions.rateAttention(5)).resolves.toBe(false);
    await expect(result.current.sendMessage("hola")).rejects.toThrow(/falta acreditar/);
  });

  it("confirma, reabre y cancela con la contraseña", async () => {
    const { result } = await setup();
    api.confirmAnonymousResolution.mockResolvedValue({});
    api.reopenAnonymousTicket.mockResolvedValue({});
    api.cancelAnonymousTicket.mockResolvedValue({});
    await act(async () => {
      await result.current.actions.confirmResolution();
    });
    expect(api.confirmAnonymousResolution).toHaveBeenCalledWith("ABC", "pw");
    expect(result.current.ticket.currentStatus).toBe("CLOSED");
    await act(async () => {
      await result.current.actions.requestReopen("Sigue igual");
    });
    expect(api.reopenAnonymousTicket).toHaveBeenCalledWith("ABC", { ticketPassword: "pw", reason: "Sigue igual" });
    expect(result.current.ticket.currentStatus).toBe("IN_PROGRESS");
    await act(async () => {
      await result.current.actions.requestCancel("Ya no");
    });
    expect(api.cancelAnonymousTicket).toHaveBeenCalledWith("ABC", { ticketPassword: "pw", reasonCode: "WITHDRAWN_BY_CITIZEN", publicMessage: "Ya no" });
    expect(result.current.ticket.history.at(-1).message).toContain("Ya no");
    await act(async () => {
      await result.current.actions.requestCancel();
    });
    expect(result.current.ticket.history.at(-1).message).toBe("Cancelaste el reclamo.");
  });

  it.each([
    [httpError(404), "No encontramos ese ticket."],
    [httpError(401), /ya no acredita/],
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(409, ""), /no permite esta acción/],
    [httpError(400, "Datos"), "Datos"],
    [httpError(400, ""), /Faltan datos/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos completar la acción/],
  ])("traduce el error de acción anónima %#", async (error, expected) => {
    const { result } = await setup();
    api.confirmAnonymousResolution.mockRejectedValue(error);
    let ok;
    await act(async () => {
      ok = await result.current.actions.confirmResolution();
    });
    expect(ok).toBe(false);
    if (expected instanceof RegExp) expect(result.current.actionError).toMatch(expected);
    else expect(result.current.actionError).toBe(expected);
    expect(result.current.messageForError(error)).toBe(result.current.actionError);
  });

  it("responde información con y sin datos en la respuesta", async () => {
    const { result } = await setup();
    api.answerAnonymousInformation.mockResolvedValueOnce({ currentStatus: "IN_REVIEW", answeredAt: "t" });
    await act(async () => {
      await result.current.actions.answerInformation("hola", [new File(["x"], "f.png")]);
    });
    expect(api.answerAnonymousInformation).toHaveBeenCalledWith("ABC", { ticketPassword: "pw", responseMessage: "hola", attachments: [expect.any(File)] });
    expect(result.current.ticket).toMatchObject({ currentStatus: "IN_REVIEW", pendingInformationRequest: null });
    api.answerAnonymousInformation.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.actions.answerInformation("otra");
    });
    expect(result.current.ticket.currentStatus).toBe("IN_REVIEW");
    api.answerAnonymousInformation.mockRejectedValueOnce(httpError(409, ""));
    let ok;
    await act(async () => {
      ok = await result.current.actions.answerInformation("falla");
    });
    expect(ok).toBe(false);
  });

  it("califica sólo con el ticket cerrado", async () => {
    const { result } = await setup();
    await expect(result.current.actions.rateAttention(5)).resolves.toBe(false);
    api.trackTicket.mockResolvedValue({ ...accreditedTicket, currentStatus: "CLOSED" });
    await act(async () => {
      await result.current.accredit("pw");
    });
    api.rateAnonymousTicketAttention.mockResolvedValueOnce({});
    let ok;
    await act(async () => {
      ok = await result.current.actions.rateAttention(5);
    });
    expect(ok).toBe(true);
    expect(api.rateAnonymousTicketAttention).toHaveBeenCalledWith("ABC", { ticketPassword: "pw", stars: 5 });
    expect(result.current.ticket.rating).toBe(5);
    api.rateAnonymousTicketAttention.mockRejectedValueOnce(httpError(404));
    await act(async () => {
      ok = await result.current.actions.rateAttention(1);
    });
    expect(ok).toBe(false);
    expect(result.current.actionError).toBe("No encontramos ese ticket.");
  });

  it("envía mensajes, sube y descarga adjuntos con la contraseña", async () => {
    const { result } = await setup();
    api.sendAnonymousMessage.mockResolvedValue({ id: 2, text: "hola" });
    await act(async () => {
      await result.current.sendMessage("hola");
    });
    expect(api.sendAnonymousMessage).toHaveBeenCalledWith("ABC", { ticketPassword: "pw", text: "hola" });
    expect(result.current.ticket.messages.map((m) => m.id)).toEqual([1, 2]);

    api.uploadAnonymousAttachment.mockResolvedValue({});
    api.downloadAnonymousAttachment.mockResolvedValue(new Blob());
    const file = new File(["x"], "f.png");
    await result.current.attachments.uploadFile(file);
    await result.current.attachments.downloadFile({ id: 9 });
    expect(api.uploadAnonymousAttachment).toHaveBeenCalledWith("ABC", "pw", file);
    expect(api.downloadAnonymousAttachment).toHaveBeenCalledWith("ABC", "pw", 9);
    expect(result.current.attachments.canUpload).toBe(true);
  });

  it("envía mensajes aunque el ticket no traiga la lista todavía", async () => {
    api.trackTicket.mockResolvedValue({ publicId: "TK-1", createdAt: "c" });
    const { result } = renderHook(() => useAnonymousTicketAccess("ABC"));
    await act(async () => {
      await result.current.accredit("pw");
    });
    api.sendAnonymousMessage.mockResolvedValue({ id: 1 });
    await act(async () => {
      await result.current.sendMessage("x");
    });
    expect(result.current.ticket.messages).toEqual([{ id: 1 }]);
  });

  it("reset vuelve al estado inicial", async () => {
    const { result } = await setup();
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ ticket: null, accredited: false, accreditError: null, actionError: null });
    await expect(result.current.actions.confirmResolution()).resolves.toBe(false);
  });
});
