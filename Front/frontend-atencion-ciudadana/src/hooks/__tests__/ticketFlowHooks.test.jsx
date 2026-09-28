import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateTicket } from "../useCreateTicket";
import { useMyTickets } from "../useMyTickets";
import { useRequestTicketInformation } from "../useRequestTicketInformation";
import { useResolveTicket } from "../useResolveTicket";
import { useStaffTicketDetail } from "../useStaffTicketDetail";
import { useTicketCitizenView } from "../useTicketCitizenView";
import { useTicketMessages } from "../useTicketMessages";
import * as api from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  createTicket: vi.fn(),
  fetchMyTickets: vi.fn(),
  requestTicketInformation: vi.fn(),
  resolveTicket: vi.fn(),
  simulateAreaResolution: vi.fn(),
  fetchStaffTicketDetail: vi.fn(),
  fetchTicketCitizenView: vi.fn(),
  fetchTicketMessages: vi.fn(),
  createTicketMessage: vi.fn(),
  updateTicketMessage: vi.fn(),
  deleteTicketMessage: vi.fn(),
}));

const httpError = (status, message = "Falló", code) => Object.assign(new Error(message), { status, code });

beforeEach(() => vi.clearAllMocks());

describe("useCreateTicket", () => {
  it("crea el ticket y expone código de seguimiento y contraseña", async () => {
    api.createTicket.mockResolvedValue({ trackingCode: "ABC", generatedAnonymousAccessPassword: "pw" });
    const { result } = renderHook(() => useCreateTicket());
    let code;
    await act(async () => {
      code = await result.current.submit({ a: 1 }, [{ file: 1 }], { skipAuth: true });
    });
    expect(code).toBe("ABC");
    expect(api.createTicket).toHaveBeenCalledWith({ a: 1 }, [{ file: 1 }], { skipAuth: true });
    expect(result.current).toMatchObject({ trackingCode: "ABC", ticketPassword: "pw", loading: false, error: null });
  });

  it("la contraseña es null cuando el ticket no es anónimo", async () => {
    api.createTicket.mockResolvedValue({ trackingCode: "X" });
    const { result } = renderHook(() => useCreateTicket());
    await act(async () => {
      await result.current.submit({});
    });
    expect(result.current.ticketPassword).toBeNull();
  });

  it("guarda el error y su código, con mensaje propio o genérico", async () => {
    api.createTicket.mockRejectedValueOnce(httpError(422, "Datos inválidos", "VALIDATION"));
    const { result } = renderHook(() => useCreateTicket());
    let code;
    await act(async () => {
      code = await result.current.submit({});
    });
    expect(code).toBeNull();
    expect(result.current).toMatchObject({ error: "Datos inválidos", errorCode: "VALIDATION" });
    api.createTicket.mockRejectedValueOnce({ status: 500 });
    await act(async () => {
      await result.current.submit({});
    });
    expect(result.current).toMatchObject({ error: "Ocurrió un error inesperado. Intentá de nuevo.", errorCode: 500 });
    api.createTicket.mockRejectedValueOnce({});
    await act(async () => {
      await result.current.submit({});
    });
    expect(result.current.errorCode).toBeNull();
  });

  it("reset y setters manuales limpian el estado", async () => {
    api.createTicket.mockResolvedValue({ trackingCode: "ABC" });
    const { result } = renderHook(() => useCreateTicket());
    await act(async () => {
      await result.current.submit({});
    });
    act(() => {
      result.current.setError("manual");
      result.current.setErrorCode("C");
    });
    expect(result.current).toMatchObject({ error: "manual", errorCode: "C" });
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ trackingCode: null, error: null, errorCode: null, ticketPassword: null, loading: false });
  });
});

describe("useMyTickets", () => {
  it.each([
    ["arreglo", [{ id: 1 }]],
    ["content", { content: [{ id: 1 }] }],
    ["data", { data: [{ id: 1 }] }],
    ["tickets", { tickets: [{ id: 1 }] }],
  ])("normaliza una respuesta con forma de %s", async (_shape, response) => {
    api.fetchMyTickets.mockResolvedValue(response);
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.source).toBe("backend");
    expect(result.current.tickets).toEqual([
      expect.objectContaining({ publicId: "1", currentStatus: "REGISTERED", summary: "", description: "", createdAt: null, requestType: null, category: null, subcategory: null }),
    ]);
    expect(api.fetchMyTickets).toHaveBeenCalledWith({ size: 50, sort: "createdAt,desc" });
  });

  it("completa nombres alternativos de campos", async () => {
    api.fetchMyTickets.mockResolvedValue([
      { publicId: "P1", status: "RESOLVED", updatedAt: "u", requestTypeName: "RT", categoryName: "C", subcategoryName: "S" },
      { publicId: "P2", createdAt: "c", requestType: { name: "x" }, category: { name: "y" }, subcategory: { name: "z" } },
    ]);
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets[0]).toMatchObject({
      currentStatus: "RESOLVED",
      statusChangedAt: "u",
      requestType: { name: "RT" },
      category: { name: "C" },
      subcategory: { name: "S" },
    });
    expect(result.current.tickets[1].statusChangedAt).toBe("c");
  });

  it("no devuelve tickets ante respuestas sin forma reconocida", async () => {
    api.fetchMyTickets.mockResolvedValue({});
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets).toEqual([]);
  });

  it.each([401, 403, 404])("usa datos de ejemplo sin mostrar error ante un %s", async (status) => {
    api.fetchMyTickets.mockRejectedValue(httpError(status));
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.source).toBe("sample");
    expect(result.current.error).toBeNull();
    expect(result.current.tickets.length).toBeGreaterThan(0);
  });

  it("muestra el error del servidor y permite recargar", async () => {
    api.fetchMyTickets.mockRejectedValueOnce(httpError(500, "Caído"));
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.error).toBe("Caído"));
    api.fetchMyTickets.mockResolvedValueOnce([{ id: 2 }]);
    await act(async () => result.current.reload());
    expect(result.current.source).toBe("backend");
    expect(result.current.error).toBeNull();
  });

  it("usa un mensaje genérico si el error no trae texto y no informa errores sin status", async () => {
    api.fetchMyTickets.mockRejectedValueOnce({ status: 500, message: undefined });
    const first = renderHook(() => useMyTickets());
    await waitFor(() => expect(first.result.current.error).toBe("No pudimos cargar tus reclamos."));
    api.fetchMyTickets.mockRejectedValueOnce(new Error("sin status"));
    const second = renderHook(() => useMyTickets());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toBeNull();
  });
});

describe("useRequestTicketInformation", () => {
  it("solicita información y devuelve la respuesta", async () => {
    api.requestTicketInformation.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRequestTicketInformation());
    let response;
    await act(async () => {
      response = await result.current.requestInformation(5, { messageForCitizen: "hola" });
    });
    expect(response).toEqual({ ok: true });
    expect(api.requestTicketInformation).toHaveBeenCalledWith(5, { messageForCitizen: "hola" });
    expect(result.current.error).toBeNull();
  });

  it.each([
    [httpError(409, "Pendiente ya"), "Pendiente ya"],
    [httpError(200, "", "INFORMATION_REQUEST_CONFLICT"), /solicitud de información pendiente/],
    [httpError(409, ""), /ya tiene una solicitud de información pendiente/],
    [httpError(403), /No tenés permiso/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(400, "Datos faltantes"), "Datos faltantes"],
    [httpError(400, ""), /Faltan datos obligatorios/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos registrar la solicitud/],
  ])("traduce el error %#", async (error, expected) => {
    api.requestTicketInformation.mockRejectedValue(error);
    const { result } = renderHook(() => useRequestTicketInformation());
    let response;
    await act(async () => {
      response = await result.current.requestInformation(1, {});
    });
    expect(response).toBeNull();
    if (expected instanceof RegExp) expect(result.current.error).toMatch(expected);
    else expect(result.current.error).toBe(expected);
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });
});

describe("useResolveTicket", () => {
  it("resuelve manualmente y guarda la resolución", async () => {
    api.resolveTicket.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useResolveTicket());
    let data;
    await act(async () => {
      data = await result.current.resolve(7, { type: "X" });
    });
    expect(data).toEqual({ id: 1 });
    expect(result.current.resolution).toEqual({ id: 1 });
    expect(api.resolveTicket).toHaveBeenCalledWith(7, { type: "X" });
  });

  it("registra la resolución simulada del área", async () => {
    api.simulateAreaResolution.mockResolvedValue({ id: 2 });
    const { result } = renderHook(() => useResolveTicket());
    await act(async () => {
      await result.current.resolveSimulated(7, { moduleId: 4 });
    });
    expect(result.current.resolution).toEqual({ id: 2 });
  });

  it.each([
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(200, "", "TICKET_STATE_CONFLICT"), /estado actual del ticket/],
    [httpError(403), /No tenés permiso/],
    [httpError(200, "", "FORBIDDEN"), /No tenés permiso/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(400, "Faltan"), "Faltan"],
    [httpError(400, ""), /Faltan datos obligatorios/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos registrar la resolución/],
  ])("traduce el error %# en ambas variantes", async (error, expected) => {
    api.resolveTicket.mockRejectedValue(error);
    api.simulateAreaResolution.mockRejectedValue(error);
    const { result } = renderHook(() => useResolveTicket());
    for (const method of ["resolve", "resolveSimulated"]) {
      let data;
      await act(async () => {
        data = await result.current[method](1, {});
      });
      expect(data).toBeNull();
      if (expected instanceof RegExp) expect(result.current.error).toMatch(expected);
      else expect(result.current.error).toBe(expected);
    }
    expect(result.current.errorCode ?? null).toBe(error.code || error.status || null);
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ error: null, errorCode: null, resolution: null, loading: false });
  });
});

describe("useStaffTicketDetail", () => {
  it("carga el detalle y permite recargar", async () => {
    api.fetchStaffTicketDetail.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useStaffTicketDetail(1));
    await waitFor(() => expect(result.current.ticket).toEqual({ id: 1 }));
    api.fetchStaffTicketDetail.mockResolvedValue({ id: 1, x: 2 });
    await act(async () => result.current.reload());
    expect(result.current.ticket).toEqual({ id: 1, x: 2 });
  });

  it("guarda el error crudo y limpia el ticket", async () => {
    const error = httpError(404);
    api.fetchStaffTicketDetail.mockRejectedValue(error);
    const { result } = renderHook(() => useStaffTicketDetail(1));
    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.ticket).toBeNull();
  });

  it("no consulta sin id", async () => {
    const { result } = renderHook(() => useStaffTicketDetail(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.fetchStaffTicketDetail).not.toHaveBeenCalled();
  });
});

describe("useTicketCitizenView", () => {
  it("carga la vista del ciudadano", async () => {
    api.fetchTicketCitizenView.mockResolvedValue({ publicId: "TK" });
    const { result } = renderHook(() => useTicketCitizenView(3));
    await waitFor(() => expect(result.current.view).toEqual({ publicId: "TK" }));
    expect(result.current.error).toBeNull();
  });

  it.each([
    [httpError(403), /No tenés permiso/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos cargar la vista del ciudadano/],
  ])("traduce el error %#", async (error, expected) => {
    api.fetchTicketCitizenView.mockRejectedValue(error);
    const { result } = renderHook(() => useTicketCitizenView(3));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    if (expected instanceof RegExp) expect(result.current.error).toMatch(expected);
    else expect(result.current.error).toBe(expected);
    expect(result.current.view).toBeNull();
  });

  it("no consulta sin id", async () => {
    const { result } = renderHook(() => useTicketCitizenView(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.fetchTicketCitizenView).not.toHaveBeenCalled();
  });

  it("permite recargar", async () => {
    api.fetchTicketCitizenView.mockResolvedValue({ a: 1 });
    const { result } = renderHook(() => useTicketCitizenView(3));
    await waitFor(() => expect(result.current.view).toEqual({ a: 1 }));
    await act(async () => result.current.reload());
    expect(api.fetchTicketCitizenView).toHaveBeenCalledTimes(2);
  });
});

describe("useTicketMessages", () => {
  it("carga, envía, edita y elimina mensajes", async () => {
    api.fetchTicketMessages.mockResolvedValue([{ id: 1, text: "uno" }]);
    api.createTicketMessage.mockResolvedValue({ id: 2, text: "dos" });
    api.updateTicketMessage.mockResolvedValue({ id: 2, text: "dos editado" });
    api.deleteTicketMessage.mockResolvedValue(null);
    const { result } = renderHook(() => useTicketMessages(9));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    await act(async () => {
      await result.current.send("PUBLIC", "dos");
    });
    expect(api.createTicketMessage).toHaveBeenCalledWith(9, { visibility: "PUBLIC", text: "dos" });
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2]);

    await act(async () => {
      await result.current.edit(2, "dos editado");
    });
    expect(api.updateTicketMessage).toHaveBeenCalledWith(9, 2, { text: "dos editado" });
    expect(result.current.messages[1].text).toBe("dos editado");
    expect(result.current.messages[0].text).toBe("uno");

    await act(async () => {
      await result.current.remove(1);
    });
    expect(api.deleteTicketMessage).toHaveBeenCalledWith(9, 1);
    expect(result.current.messages.map((m) => m.id)).toEqual([2]);
  });

  it("trata una respuesta que no es lista como sin mensajes", async () => {
    api.fetchTicketMessages.mockResolvedValue(null);
    const { result } = renderHook(() => useTicketMessages(9));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it.each([
    [httpError(403), /No tenés permiso/],
    [httpError(404), /No encontramos el mensaje/],
    [httpError(401), /sesión no es válida/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos completar la acción/],
  ])("traduce el error de carga %# (y lo expone como messageForError)", async (error, expected) => {
    api.fetchTicketMessages.mockRejectedValue(error);
    const { result } = renderHook(() => useTicketMessages(9));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    if (expected instanceof RegExp) expect(result.current.error).toMatch(expected);
    else expect(result.current.error).toBe(expected);
    expect(result.current.messageForError(error)).toBe(result.current.error);
  });

  it("no consulta sin ticket y permite recargar", async () => {
    const { result } = renderHook(() => useTicketMessages(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.fetchTicketMessages).not.toHaveBeenCalled();
    const second = renderHook(() => useTicketMessages(1));
    api.fetchTicketMessages.mockResolvedValue([]);
    await act(async () => second.result.current.reload());
    expect(api.fetchTicketMessages).toHaveBeenCalled();
  });
});
