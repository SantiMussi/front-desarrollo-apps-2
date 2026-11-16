import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCategories } from "../useCategories";
import { useNeighborhoods } from "../useNeighborhoods";
import { useRequestTypesCatalog } from "../useRequestTypesCatalog";
import { fetchCategories, fetchNeighborhoods, fetchRequestTypes, fetchSubcategories } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  fetchCategories: vi.fn(),
  fetchSubcategories: vi.fn(),
  fetchRequestTypes: vi.fn(),
  fetchNeighborhoods: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("useCategories", () => {
  it("arma el árbol categoría > subcategoría > tipo con íconos y contadores", async () => {
    fetchCategories.mockResolvedValue([
      { id: 1, name: "Alumbrado y equipamiento urbano" },
      { id: 2, name: "Categoría inventada" },
    ]);
    fetchSubcategories.mockImplementation(async (categoryId) =>
      categoryId === 1
        ? [
            { id: 10, name: "Alumbrado público" },
            { id: 11, name: "Subcategoría inventada" },
          ]
        : []
    );
    fetchRequestTypes.mockImplementation(async (subcategoryId) =>
      subcategoryId === 10 ? [{ id: 100, name: "Luminaria apagada" }, { id: 101, name: "Poste caído" }] : [{ id: 102, name: "Otro" }]
    );

    const { result } = renderHook(() => useCategories());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    const [first, second] = result.current.categories;
    expect(result.current.error).toBeNull();
    expect(first).toMatchObject({ id: "1", title: "Alumbrado y equipamiento urbano", itemCount: 3 });
    expect(first.iconName).not.toBe("Folder");
    expect(first.subcategories[0]).toMatchObject({ id: "10", requestTypes: [expect.objectContaining({ code: "100", specificFields: [] }), expect.anything()] });
    expect(first.subcategories[0].iconName).not.toBe("Folder");
    expect(first.subcategories[1].iconName).toBe("Folder");
    expect(second).toMatchObject({ id: "2", iconName: "Folder", itemCount: 0, subcategories: [] });
  });

  it("informa el error del backend", async () => {
    fetchCategories.mockRejectedValue(new Error("Sin servicio"));
    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.error).toBe("Sin servicio"));
    expect(result.current.loading).toBe(false);
  });

  it("no actualiza el estado si se desmonta antes de terminar", async () => {
    let resolve;
    fetchCategories.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = renderHook(() => useCategories());
    unmount();
    resolve([]);
    fetchCategories.mockRejectedValue(new Error("x"));
    const second = renderHook(() => useCategories());
    second.unmount();
    await Promise.resolve();
  });
});

describe("useRequestTypesCatalog", () => {
  it("aplana los tipos de solicitud con su categoría y subcategoría", async () => {
    fetchCategories.mockResolvedValue([{ id: 1, name: "Vías" }]);
    fetchSubcategories.mockResolvedValue([{ id: 2, name: "Calzada" }]);
    fetchRequestTypes.mockResolvedValue([{ id: 3, code: "BACHE", name: "Bache", extra: "ignorado" }]);
    const { result } = renderHook(() => useRequestTypesCatalog());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requestTypes).toEqual([{ id: 3, code: "BACHE", name: "Bache", categoryName: "Vías", subcategoryName: "Calzada" }]);
  });

  it("informa el error con mensaje propio o genérico", async () => {
    fetchCategories.mockRejectedValueOnce(new Error("Falló"));
    const first = renderHook(() => useRequestTypesCatalog());
    await waitFor(() => expect(first.result.current.error).toBe("Falló"));
    fetchCategories.mockRejectedValueOnce(undefined);
    const second = renderHook(() => useRequestTypesCatalog());
    await waitFor(() => expect(second.result.current.error).toMatch(/No pudimos cargar el catálogo/));
  });

  it("ignora el resultado si se desmonta", async () => {
    let resolve;
    fetchCategories.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = renderHook(() => useRequestTypesCatalog());
    unmount();
    resolve([]);
    fetchCategories.mockRejectedValue(new Error("x"));
    renderHook(() => useRequestTypesCatalog()).unmount();
    await Promise.resolve();
  });
});

describe("useNeighborhoods", () => {
  const uuid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

  it("empieza con la lista local y usa la del backend cuando trae UUIDs", async () => {
    fetchNeighborhoods.mockResolvedValue([
      { id: uuid(2), name: "Palermo" },
      { id: uuid(1), name: "Almagro" },
      { id: uuid(3), name: "   " },
      { name: "sin id" },
    ]);
    const { result } = renderHook(() => useNeighborhoods());
    expect(result.current.source).toBe("mock");
    expect(result.current.neighborhoods.length).toBeGreaterThan(0);
    await waitFor(() => expect(result.current.source).toBe("backend"));
    expect(result.current.isRemote).toBe(true);
    expect(result.current.neighborhoods.map((n) => n.name)).toEqual(["Almagro", "Palermo"]);
    expect(result.current.loading).toBe(false);
  });

  it.each([
    ["data", { data: [{ id: uuid(1), name: "A" }] }],
    ["neighborhoods", { neighborhoods: [{ value: uuid(1), label: "A" }] }],
    ["content", { content: [{ code: uuid(1), nombre: "A" }] }],
  ])("acepta la respuesta envuelta en %s", async (_key, response) => {
    fetchNeighborhoods.mockResolvedValue(response);
    const { result } = renderHook(() => useNeighborhoods());
    await waitFor(() => expect(result.current.source).toBe("backend"));
    expect(result.current.neighborhoods).toEqual([{ id: uuid(1), name: "A" }]);
  });

  it("vuelve a la lista local si el backend no devuelve UUIDs o viene vacío", async () => {
    fetchNeighborhoods.mockResolvedValue([{ id: 1, name: "Numérico" }]);
    const first = renderHook(() => useNeighborhoods());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.source).toBe("mock");
    fetchNeighborhoods.mockResolvedValue({});
    const second = renderHook(() => useNeighborhoods());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.isRemote).toBe(false);
  });

  it("guarda el error y usa la lista local si el backend falla", async () => {
    fetchNeighborhoods.mockRejectedValueOnce(new Error("Caído"));
    const first = renderHook(() => useNeighborhoods());
    await waitFor(() => expect(first.result.current.error).toBe("Caído"));
    fetchNeighborhoods.mockRejectedValueOnce(undefined);
    const second = renderHook(() => useNeighborhoods());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toBeNull();
  });

  it("no actualiza el estado si se desmonta antes", async () => {
    let resolve;
    fetchNeighborhoods.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = renderHook(() => useNeighborhoods());
    unmount();
    resolve([{ id: uuid(1), name: "A" }]);
    fetchNeighborhoods.mockRejectedValue(new Error("x"));
    renderHook(() => useNeighborhoods()).unmount();
    await Promise.resolve();
  });
});
