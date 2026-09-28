import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MetricsPage from "../agent/MetricsPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useAllAgentTickets } from "../../hooks/useAllAgentTickets";
import { fetchCategories, fetchNeighborhoods } from "../../services/apiClient";

vi.mock("../../hooks/useAllAgentTickets", () => ({ useAllAgentTickets: vi.fn() }));
vi.mock("../../services/apiClient", () => ({ fetchCategories: vi.fn(), fetchNeighborhoods: vi.fn() }));

const NOW = new Date("2026-03-31T12:00:00Z");
const daysAgo = (days, extraHours = 0) => new Date(NOW.getTime() - days * 86400000 - extraHours * 3600000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  fetchCategories.mockResolvedValue([{ id: 1, name: "Alumbrado" }]);
  fetchNeighborhoods.mockResolvedValue([{ id: "n1", name: "Palermo" }]);
});
afterEach(() => vi.useRealTimers());

const tickets = () => [
  { id: 1, publicId: "TK-1", createdAt: daysAgo(2), statusChangedAt: daysAgo(1), currentStatus: "RESOLVED", neighborhoodName: "Palermo", categoryName: "Alumbrado", responsibleAreaId: "AREA-LIGHTING", assignedAgentId: 5, slaBreached: false, slaPercentage: 50, reopenCount: 1 },
  { id: 2, publicId: "TK-2", createdAt: daysAgo(3), updatedAt: daysAgo(2, 5), currentStatus: "CLOSED", location: { neighborhoodName: "Belgrano" }, requestTypeName: "Bache", responsibleAreaId: "AREA-X", slaBreached: true, slaPercentage: 120, escalated: true, reopenCount: 2 },
  { id: 3, publicId: "TK-3", createdAt: daysAgo(4), currentStatus: "IN_PROGRESS", neighborhoodId: "n1", categoryId: 1, responsibleAreaName: "Área Nombrada", slaNearDue: true, slaPercentage: 90 },
  { id: 4, createdAt: daysAgo(5), currentStatus: "REGISTERED", ticketType: "COMPLAINT", slaNearDue: false, resolutionDueAt: "2026-05-01T00:00:00Z" },
  { id: 5, publicId: "TK-5", createdAt: daysAgo(6), currentStatus: undefined, categoryId: 99 },
  { id: 6, publicId: "TK-6", createdAt: daysAgo(40), currentStatus: "RESOLVED", statusChangedAt: daysAgo(39), neighborhoodName: "Palermo" },
  { id: 7, publicId: "TK-7", createdAt: daysAgo(50), currentStatus: "REGISTERED" },
  { id: 8, publicId: "TK-8", createdAt: "fecha-invalida", currentStatus: "REGISTERED" },
  { id: 9, publicId: "TK-9", createdAt: daysAgo(-3), currentStatus: "REGISTERED" },
];

const mockHook = (overrides = {}) => {
  const refetch = vi.fn();
  useAllAgentTickets.mockReturnValue({ tickets: tickets(), loading: false, error: null, refetch, ...overrides });
  return refetch;
};

const renderPage = async () => {
  const view = renderWithProviders(<MetricsPage />);
  await act(async () => {});
  return view;
};

const openFilters = () => fireEvent.click(screen.getByRole("button", { name: /Filtros/ }));
const select = (label) => screen.getByLabelText(label);

describe("MetricsPage - reporte", () => {
  it("muestra el cargando", async () => {
    mockHook({ loading: true });
    await renderPage();
    expect(screen.getByText("Calculando métricas…")).toBeInTheDocument();
  });

  it("calcula los indicadores del período", async () => {
    mockHook();
    await renderPage();
    const kpi = (label) => screen.getByText(label).closest("article");
    expect(within(kpi("Tickets creados")).getByText("5")).toBeInTheDocument();
    expect(within(kpi("Tickets creados")).getByText(/vs\. anterior/)).toBeInTheDocument();
    expect(within(kpi("Tasa de resolución")).getByText("40%")).toBeInTheDocument();
    expect(within(kpi("Tasa de resolución")).getByText("2 resueltos en el período")).toBeInTheDocument();
    expect(within(kpi("Tiempo medio de resolución")).getByText(/^\d+\.\d [hd]$/)).toBeInTheDocument();
    expect(within(kpi("Cumplimiento de SLA")).getByText("67%")).toBeInTheDocument();
    expect(within(kpi("Cumplimiento de SLA")).getByText("3 tickets con medición")).toBeInTheDocument();
    expect(screen.getByText("Sin agente asignado").previousSibling).toHaveTextContent("4");
    expect(screen.getByText("Tickets escalados").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Reaperturas registradas").previousSibling).toHaveTextContent("3");
  });

  it("agrupa por estado, ubicación, categoría y área con los nombres de respaldo", async () => {
    mockHook();
    await renderPage();
    expect(screen.getByText("Resuelto")).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    expect(screen.getAllByText("Palermo").length).toBeGreaterThan(0);
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
    expect(screen.getByText("Sin ubicación informada")).toBeInTheDocument();
    expect(screen.getByText("Bache")).toBeInTheDocument();
    expect(screen.getByText("COMPLAINT")).toBeInTheDocument();
    expect(screen.getByText("Sin categoría")).toBeInTheDocument();
    expect(screen.getAllByText("Alumbrado").length).toBeGreaterThan(0);
    expect(screen.getByText("Alumbrado público")).toBeInTheDocument();
    expect(screen.getByText("Área Nombrada")).toBeInTheDocument();
    expect(screen.getByText("AREA-X")).toBeInTheDocument();
    expect(screen.getByText("Sin derivar")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Evolución de tickets/ })).toBeInTheDocument();
  });

  it("muestra guiones y textos vacíos cuando no hay datos", async () => {
    mockHook({ tickets: [] });
    await renderPage();
    expect(screen.getByText("No hay tickets en este período.")).toBeInTheDocument();
    expect(screen.getByText("Sin ubicaciones para mostrar.")).toBeInTheDocument();
    expect(screen.getByText("Sin categorías para mostrar.")).toBeInTheDocument();
    expect(screen.getByText("Sin datos de SLA en el período")).toBeInTheDocument();
    expect(screen.getByText("Sin período anterior")).toBeInTheDocument();
    expect(screen.getByText("Tiempo medio de resolución").closest("article")).toHaveTextContent("—");
    expect(screen.getByRole("button", { name: /Exportar/ })).toBeDisabled();
  });

  it("muestra un delta negativo cuando el período anterior fue mayor", async () => {
    mockHook({
      tickets: [
        { id: 1, createdAt: daysAgo(2), currentStatus: "REGISTERED" },
        { id: 2, createdAt: daysAgo(31), currentStatus: "REGISTERED" },
        { id: 3, createdAt: daysAgo(32), currentStatus: "REGISTERED" },
      ],
    });
    await renderPage();
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
  });

  it("muestra el error de carga parcial", async () => {
    mockHook({ error: "Falló una página" });
    await renderPage();
    expect(screen.getByText(/No pudimos cargar todos los datos: Falló una página/)).toBeInTheDocument();
  });

  it("actualiza los datos y enlaza al dashboard", async () => {
    const refetch = mockHook();
    await renderPage();
    fireEvent.click(screen.getByTitle("Actualizar"));
    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Dashboard operativo" })).toHaveAttribute("href", "/agente/dashboard");
  });

  it("tolera que el catálogo no cargue", async () => {
    fetchCategories.mockRejectedValue(new Error("x"));
    fetchNeighborhoods.mockRejectedValue(new Error("y"));
    mockHook();
    await renderPage();
    openFilters();
    expect(select("Categoría").options).toHaveLength(1);
  });
});

describe("MetricsPage - filtros", () => {
  it("abre y cierra el panel y cuenta los filtros activos", async () => {
    mockHook();
    await renderPage();
    expect(screen.queryByText("Filtrar métricas")).not.toBeInTheDocument();
    openFilters();
    expect(screen.getByText("Filtrar métricas")).toBeInTheDocument();
    fireEvent.change(select("Período"), { target: { value: "7" } });
    fireEvent.change(select("Prioridad"), { target: { value: "HIGH" } });
    expect(screen.getByRole("button", { name: /Filtros/ })).toHaveTextContent("2");
    fireEvent.click(screen.getByLabelText("Cerrar filtros"));
    expect(screen.queryByText("Filtrar métricas")).not.toBeInTheDocument();
  });

  it("envía los filtros al hook", async () => {
    mockHook();
    await renderPage();
    openFilters();
    await waitFor(() => expect(select("Categoría").options.length).toBeGreaterThan(1));
    fireEvent.change(select("Categoría"), { target: { value: "1" } });
    fireEvent.change(select("Barrio"), { target: { value: "n1" } });
    fireEvent.change(select("Prioridad"), { target: { value: "CRITICAL" } });
    fireEvent.change(select("Área responsable"), { target: { value: "AREA-LIGHTING" } });
    expect(useAllAgentTickets).toHaveBeenLastCalledWith({
      categoryId: "1",
      priority: "CRITICAL",
      neighborhoodId: "n1",
      withoutLocation: false,
      responsibleAreaId: "AREA-LIGHTING",
      sort: "createdAt,desc",
    });
    fireEvent.change(select("Barrio"), { target: { value: "__NO_LOCATION__" } });
    expect(useAllAgentTickets).toHaveBeenLastCalledWith(expect.objectContaining({ neighborhoodId: undefined, withoutLocation: true }));
  });

  it("restablece todos los filtros", async () => {
    mockHook();
    await renderPage();
    openFilters();
    fireEvent.change(select("Período"), { target: { value: "90" } });
    fireEvent.change(select("SLA"), { target: { value: "breached" } });
    fireEvent.change(select("Prioridad"), { target: { value: "LOW" } });
    fireEvent.click(screen.getByText("Restablecer filtros"));
    expect(select("Período")).toHaveValue("30");
    expect(select("SLA")).toHaveValue("");
    expect(screen.getByRole("button", { name: /Filtros/ })).not.toHaveTextContent(/\d/);
  });

  it.each([
    ["breached", "1"],
    ["near_due", "1"],
    ["on_track", "2"],
    ["no_resolution_sla", "1"],
  ])("filtra por SLA %s", async (value, expectedCreated) => {
    mockHook();
    await renderPage();
    openFilters();
    fireEvent.change(select("SLA"), { target: { value } });
    expect(within(screen.getByText("Tickets creados").closest("article")).getByText(expectedCreated)).toBeInTheDocument();
  });

  it.each([
    ["7", 7],
    ["30", 10],
    ["90", 12],
    ["365", 12],
  ])("divide el período de %s días en %i tramos", async (days, buckets) => {
    mockHook();
    await renderPage();
    openFilters();
    fireEvent.change(select("Período"), { target: { value: days } });
    const svg = screen.getByRole("img", { name: /Evolución de tickets/ });
    expect(svg.querySelectorAll("text[text-anchor='middle']")).toHaveLength(buckets);
  });
});

describe("MetricsPage - exportación", () => {
  it("descarga un CSV con los tickets del período", async () => {
    mockHook();
    let blob;
    URL.createObjectURL = vi.fn((value) => {
      blob = value;
      return "blob:csv";
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Exportar/ }));
    expect(click).toHaveBeenCalledOnce();
    expect(blob).toBeInstanceOf(Blob);
    const text = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    expect(text).toContain('"Ticket","Creado","Estado","Área","Ubicación"');
    expect(text).toContain('"TK-1"');
    expect(text).toContain("Alumbrado público");
    expect(text).toContain("Sin ubicación informada");
    click.mockRestore();
  });
});
