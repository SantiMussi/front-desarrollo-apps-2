import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAllAgentTickets } from "../useAllAgentTickets";
import { useAgentTickets } from "../useAgentTickets";
import { fetchAgentTickets } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({ fetchAgentTickets: vi.fn() }));

const located = { id: 1, neighborhoodId: 4 };
const unlocated = { id: 2 };

beforeEach(() => vi.clearAllMocks());

describe("useAllAgentTickets", () => {
  it("carga todas las páginas con los filtros", async () => {
    fetchAgentTickets
      .mockResolvedValueOnce({ content: [located], totalPages: 2 })
      .mockResolvedValueOnce({ content: [unlocated], totalPages: 2 });
    const { result } = renderHook(() => useAllAgentTickets({ categoryId: 8, sort: "id,asc" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets).toEqual([located, unlocated]);
    expect(fetchAgentTickets).toHaveBeenNthCalledWith(1, expect.objectContaining({ categoryId: 8, page: 0, size: 200, sort: "id,asc" }));
    expect(fetchAgentTickets).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1, size: 200 }));
  });

  it("filtra tickets sin ubicación y permite recargar", async () => {
    fetchAgentTickets.mockResolvedValue({ content: [located, unlocated], totalPages: 1 });
    const { result } = renderHook(() => useAllAgentTickets({ withoutLocation: true }));
    await waitFor(() => expect(result.current.tickets).toEqual([unlocated]));
    act(() => result.current.refetch());
    await waitFor(() => expect(fetchAgentTickets).toHaveBeenCalledTimes(2));
  });

  it.each([
    ["ausente", { content: [unlocated] }],
    ["igual a cero", { content: [unlocated], totalPages: 0 }],
  ])("trata totalPages %s como una respuesta de una sola página", async (_case, response) => {
    fetchAgentTickets.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useAllAgentTickets({ withoutLocation: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tickets).toEqual([unlocated]);
    expect(fetchAgentTickets).toHaveBeenCalledTimes(1);
  });

  it("normaliza una respuesta undefined del backend", async () => {
    fetchAgentTickets.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAllAgentTickets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tickets).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("informa errores con mensaje remoto o predeterminado", async () => {
    fetchAgentTickets.mockRejectedValueOnce(new Error("Sin conexión"));
    const { result, rerender } = renderHook(() => useAllAgentTickets());
    await waitFor(() => expect(result.current.error).toBe("Sin conexión"));
    fetchAgentTickets.mockRejectedValueOnce({});
    act(() => result.current.refetch());
    rerender();
    await waitFor(() => expect(result.current.error).toBe("No pudimos cargar todos los tickets."));
    expect(result.current.tickets).toEqual([]);
  });
});

describe("useAgentTickets", () => {
  it("carga una página normal y normaliza una respuesta vacía", async () => {
    fetchAgentTickets.mockResolvedValueOnce({ content: [located], totalElements: 1, totalPages: 1, number: 2 });
    const { result } = renderHook(() => useAgentTickets({ page: 2, size: 10, priority: "HIGH" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ tickets: [located], totalElements: 1, totalPages: 1, pageNumber: 2, error: null });
    expect(fetchAgentTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 2, size: 10, priority: "HIGH" }));
  });

	it("solicita una página al backend cuando withoutLocation es false", async () => {
    fetchAgentTickets.mockResolvedValueOnce({ content: [located] });
    const { result } = renderHook(() => useAgentTickets({ withoutLocation: false, page: 3, size: 5 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tickets).toEqual([located]);
    expect(fetchAgentTickets).toHaveBeenCalledTimes(1);
    expect(fetchAgentTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 3, size: 5 }));
  });

  it("recorre, filtra y pagina localmente los tickets sin ubicación", async () => {
    fetchAgentTickets
      .mockResolvedValueOnce({ content: [located, { id: 2 }, { id: 3 }], totalPages: 2 })
      .mockResolvedValueOnce({ content: [{ id: 4 }], totalPages: 2 });
    const { result } = renderHook(() => useAgentTickets({ withoutLocation: true, page: 1, size: 2 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ tickets: [{ id: 4 }], totalElements: 3, totalPages: 2, pageNumber: 1 });
    expect(fetchAgentTickets).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 0, size: 200 }));
    expect(fetchAgentTickets).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1, size: 200 }));
  });

  it.each([
    ["ausente", { content: [located] }],
    ["igual a cero", { content: [located], totalPages: 0 }],
  ])("usa una sola página con totalPages %s y queda vacío si no hay coincidencias", async (_case, response) => {
    fetchAgentTickets.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useAgentTickets({ withoutLocation: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toMatchObject({ tickets: [], totalElements: 0, totalPages: 0, pageNumber: 0 });
    expect(fetchAgentTickets).toHaveBeenCalledTimes(1);
  });

  it("vacía los datos al fallar y se puede reintentar", async () => {
    fetchAgentTickets.mockRejectedValueOnce({});
    const { result } = renderHook(() => useAgentTickets());
    await waitFor(() => expect(result.current.error).toBe("No pudimos cargar los tickets."));
    expect(result.current).toMatchObject({ tickets: [], totalElements: 0, totalPages: 0, pageNumber: 0 });
    fetchAgentTickets.mockResolvedValueOnce(null);
    act(() => result.current.refetch());
    await waitFor(() => expect(fetchAgentTickets).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});