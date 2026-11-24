import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStaffCapabilities } from "../useStaffCapabilities";
import { fetchStaffCapabilities } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({ fetchStaffCapabilities: vi.fn() }));

describe("useStaffCapabilities", () => {
  // Con llaves: devolver el mock desde beforeEach lo registraría como función de limpieza y la ejecutaría.
  beforeEach(() => {
    fetchStaffCapabilities.mockReset();
  });

  it("no sabe nada hasta que el servidor responde", () => {
    fetchStaffCapabilities.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useStaffCapabilities());
    expect(result.current.simulatorEnabled).toBeNull();
  });

  it.each([true, false])("informa si el simulador está habilitado (%s)", async (enabled) => {
    fetchStaffCapabilities.mockResolvedValue({ simulatorEnabled: enabled });
    const { result } = renderHook(() => useStaffCapabilities());
    await waitFor(() => expect(result.current.simulatorEnabled).toBe(enabled));
  });

  it("sigue sin dato si el pedido falla (p. ej. un back sin este endpoint)", async () => {
    fetchStaffCapabilities.mockRejectedValue(Object.assign(new Error("No existe"), { status: 404 }));
    const { result } = renderHook(() => useStaffCapabilities());
    await waitFor(() => expect(fetchStaffCapabilities).toHaveBeenCalledTimes(1));
    expect(result.current.simulatorEnabled).toBeNull();
  });

  it("ignora una respuesta con un valor que no es booleano", async () => {
    fetchStaffCapabilities.mockResolvedValue({ simulatorEnabled: "false" });
    const { result } = renderHook(() => useStaffCapabilities());
    await waitFor(() => expect(fetchStaffCapabilities).toHaveBeenCalledTimes(1));
    expect(result.current.simulatorEnabled).toBeNull();
  });
});
