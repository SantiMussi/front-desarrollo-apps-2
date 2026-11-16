import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeAgent, useAgentDirectory } from "../useAgentDirectory";
import { fetchAdminAgents } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({ fetchAdminAgents: vi.fn() }));

describe("normalizeAgent", () => {
  it("arma el nombre, cae al correo y calcula el cumplimiento sólo con ciclos cerrados", () => {
    expect(normalizeAgent({ actorId: "a", firstName: " Ana ", lastName: "Paz", email: "ana@x", role: "AGENT",
      areaId: "", active: true, activeTickets: 2, resolvedThisMonth: 1, slaMet: 2, slaBreached: 1 }))
      .toEqual({ id: "a", name: "Ana Paz", email: "ana@x", role: "AGENT", areaId: null, active: true,
        activeTickets: 2, resolvedThisMonth: 1, slaMet: 2, slaBreached: 1, slaCompliance: 66.7 });
    expect(normalizeAgent({ actorId: "b", email: "solo@x" }).name).toBe("solo@x");
    expect(normalizeAgent({ actorId: "c" }).name).toBe("Sin nombre");
    expect(normalizeAgent({ actorId: "d", slaMet: 0, slaBreached: 0 }).slaCompliance).toBeNull();
  });

  it("descarta filas sin identificador y valores numéricos inválidos", () => {
    expect(normalizeAgent(null)).toBeNull();
    expect(normalizeAgent({ firstName: "Sin id" })).toBeNull();
    const agent = normalizeAgent({ actorId: "e", activeTickets: -3, resolvedThisMonth: "x", slaMet: 1.9, active: "true" });
    expect(agent).toMatchObject({ activeTickets: 0, resolvedThisMonth: 0, slaMet: 1, active: false });
  });
});

describe("useAgentDirectory", () => {
  beforeEach(() => fetchAdminAgents.mockReset());

  it("ignora una respuesta vieja si se recargó antes de que llegara", async () => {
    let finishFirst;
    fetchAdminAgents
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
      .mockResolvedValueOnce([{ actorId: "nuevo", firstName: "Nueva" }]);
    const { result } = renderHook(() => useAgentDirectory());

    await act(async () => { await result.current.reload(); });
    await act(async () => finishFirst([{ actorId: "viejo", firstName: "Vieja" }]));

    expect(result.current.agents.map((agent) => agent.id)).toEqual(["nuevo"]);
    expect(result.current.loading).toBe(false);
  });

  it("trata una respuesta que no es lista como directorio vacío", async () => {
    fetchAdminAgents.mockResolvedValue({ unexpected: true });
    const { result } = renderHook(() => useAgentDirectory());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.agents).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
