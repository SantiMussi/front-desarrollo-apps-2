import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TicketsInboxPage from "../agent/TicketsInboxPage";
import { AGENT, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { useAgentTickets } from "../../hooks/useAgentTickets";
import { fetchCategories, fetchStaffLabels } from "../../services/apiClient";

vi.mock("../../hooks/useAgentTickets", () => ({ useAgentTickets: vi.fn() }));
vi.mock("../../hooks/useNeighborhoods", () => ({
  useNeighborhoods: () => ({ neighborhoods: [{ id: "n1", name: "Palermo" }] }),
}));
vi.mock("../../services/apiClient", () => ({ fetchCategories: vi.fn(), fetchStaffLabels: vi.fn() }));

const rawTickets = [
  {
    id: 1,
    publicId: "TK-1",
    summary: "Luminaria",
    currentStatus: "REGISTERED",
    createdAt: "2026-03-10T12:00:00Z",
    updatedAt: "2026-03-11T12:00:00Z",
    categoryName: "Alumbrado",
    currentPriority: "HIGH",
    assignedAgentId: 7,
    anonymous: false,
    slaBreached: true,
    escalated: true,
    escalationReasonCode: "CRITICAL_PRIORITY",
    mainTicketId: 5,
    mainTicketPublicId: "TK-005",
  },
  { id: 2, summary: "Bache", currentStatus: "ESTADO_RARO", requestTypeName: "Bache", anonymous: true, createdAt: "2026-03-12T12:00:00Z", updatedAt: "2026-03-12T12:00:00Z" },
  { id: 3, summary: "Otro", currentStatus: "RESOLVED", ticketType: "COMPLAINT", neighborhoodName: "Palermo", createdAt: "2026-03-13T12:00:00Z", updatedAt: "2026-03-13T12:00:00Z" },
];

const mockTickets = (overrides = {}) => {
  const refetch = vi.fn();
  useAgentTickets.mockReturnValue({ tickets: rawTickets, totalElements: 45, totalPages: 3, loading: false, error: null, refetch, ...overrides });
  return refetch;
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchCategories.mockResolvedValue([{ id: 1, name: "Alumbrado" }]);
  fetchStaffLabels.mockResolvedValue([{ id: 9, name: "Urgente", active: true }, { id: 10, name: "Vieja", active: false }]);
});
afterEach(() => vi.useRealTimers());

const renderPage = async () => {
  const view = renderWithProviders(<TicketsInboxPage />, { auth: authFor(AGENT) });
  await act(async () => {});
  return view;
};

const lastArgs = () => useAgentTickets.mock.lastCall[0];
const openFilters = () => fireEvent.click(screen.getByRole("button", { name: /Filtros/ }));
const filterSelect = (label) => screen.getByText(label, { selector: "label" }).parentElement.querySelector("select");

describe("TicketsInboxPage - listado", () => {
  it("consulta la primera página ordenada y muestra los tickets mapeados", async () => {
    mockTickets();
    await renderPage();
    expect(lastArgs()).toMatchObject({ page: 0, size: 20, sort: "createdAt,desc", withoutLocation: false });
    expect(screen.getByRole("heading", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByText("TK-1")).toBeInTheDocument();
    expect(screen.getByText("Agente #7")).toBeInTheDocument();
    expect(screen.getAllByText("Sin asignar").length).toBeGreaterThan(0);
    expect(screen.getByText("Anónimo")).toBeInTheDocument();
    expect(screen.getAllByText("Ciudadano registrado").length).toBeGreaterThan(0);
    expect(screen.getByText("Escalado")).toBeInTheDocument();
    expect(screen.getByText("ESTADO_RARO")).toBeInTheDocument();
    expect(screen.getByText(/Duplicado de TK-005/)).toBeInTheDocument();
    expect(screen.getByText("1-20 de 45 incidencias")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("muestra el cargando, el error y el vacío", async () => {
    mockTickets({ loading: true, tickets: [] });
    const first = await renderPage();
    expect(first.container.querySelector(".animate-spin")).toBeInTheDocument();
    first.unmount();
    mockTickets({ error: "Sin conexión", tickets: [], totalElements: 0, totalPages: 0 });
    await renderPage();
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
    expect(screen.getByText("0 incidencias")).toBeInTheDocument();
    expect(screen.getByText("Página 0 de 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Página anterior")).toBeDisabled();
    expect(screen.getByLabelText("Página siguiente")).toBeDisabled();
  });

  it("pagina hacia adelante y hacia atrás sin pasar los límites", async () => {
    mockTickets({ totalElements: 45, totalPages: 3 });
    await renderPage();
    const next = screen.getByLabelText("Página siguiente");
    const previous = screen.getByLabelText("Página anterior");
    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(lastArgs().page).toBe(1);
    expect(screen.getByText("21-40 de 45 incidencias")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("41-45 de 45 incidencias")).toBeInTheDocument();
    expect(next).toBeDisabled();
    fireEvent.click(previous);
    fireEvent.click(previous);
    expect(lastArgs().page).toBe(0);
  });

  it("cambia de pestaña y fuerza el estado Resueltos", async () => {
    mockTickets();
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Resueltos" }));
    expect(screen.getByRole("heading", { name: "Resueltos" })).toBeInTheDocument();
    expect(lastArgs().status).toBe("RESOLVED");
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(lastArgs().status).toBeUndefined();
  });

  it("actualiza los datos con el botón de recarga", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const refetch = mockTickets();
    await renderPage();
    fireEvent.click(screen.getByTitle("Actualizar"));
    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.getByTitle("Actualizar").querySelector("svg")).toHaveClass("animate-spin");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(screen.getByTitle("Actualizar").querySelector("svg")).not.toHaveClass("animate-spin");
  });
});

describe("TicketsInboxPage - búsqueda y filtros", () => {
  it("busca con retardo y vuelve a la primera página", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockTickets();
    await renderPage();
    fireEvent.click(screen.getByLabelText("Página siguiente"));
    fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "  bache  " } });
    expect(lastArgs().search).toBeUndefined();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(lastArgs()).toMatchObject({ search: "bache", page: 0 });
  });

  it("aplica y limpia los filtros y los muestra en el contador", async () => {
    mockTickets();
    await renderPage();
    openFilters();
    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    fireEvent.change(filterSelect("Área responsable"), { target: { value: "M3" } });
    fireEvent.change(filterSelect("Categoría"), { target: { value: "1" } });
    fireEvent.change(filterSelect("Prioridad"), { target: { value: "CRITICAL" } });
    fireEvent.change(filterSelect("Barrio"), { target: { value: "n1" } });
    fireEvent.change(filterSelect("Estado"), { target: { value: "IN_REVIEW" } });
    fireEvent.change(filterSelect("Etiqueta"), { target: { value: "9" } });
    expect(lastArgs()).toMatchObject({
      responsibleAreaId: "M3",
      categoryId: "1",
      priority: "CRITICAL",
      neighborhoodId: "n1",
      status: "IN_REVIEW",
      labelIds: "9",
      withoutLocation: false,
    });
    expect(screen.getByRole("button", { name: /Filtros \(6\)/ })).toBeInTheDocument();
    expect(within(filterSelect("Etiqueta")).queryByText("Vieja")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Limpiar filtros"));
    expect(lastArgs().categoryId).toBeUndefined();
    expect(screen.queryByText("Limpiar filtros")).not.toBeInTheDocument();
  });

  it("volver a elegir el mismo valor quita el filtro", async () => {
    mockTickets();
    await renderPage();
    openFilters();
    fireEvent.change(filterSelect("Prioridad"), { target: { value: "HIGH" } });
    expect(lastArgs().priority).toBe("HIGH");
    fireEvent.change(filterSelect("Prioridad"), { target: { value: "" } });
    expect(lastArgs().priority).toBeUndefined();
  });

  it("filtra los tickets sin ubicación y deshabilita el estado en Resueltos", async () => {
    mockTickets();
    await renderPage();
    openFilters();
    fireEvent.change(filterSelect("Barrio"), { target: { value: "__NO_LOCATION__" } });
    expect(lastArgs()).toMatchObject({ withoutLocation: true, neighborhoodId: undefined });
    fireEvent.click(screen.getByRole("button", { name: "Resueltos" }));
    expect(filterSelect("Estado")).toBeDisabled();
  });

  it("oculta el panel de filtros al volver a hacer clic", async () => {
    mockTickets();
    await renderPage();
    openFilters();
    expect(screen.getByText("Área responsable")).toBeInTheDocument();
    openFilters();
    expect(screen.queryByText("Área responsable")).not.toBeInTheDocument();
  });

  it("tolera errores al cargar categorías y etiquetas y respuestas que no son listas", async () => {
    fetchCategories.mockRejectedValue(new Error("x"));
    fetchStaffLabels.mockResolvedValue(null);
    mockTickets();
    await renderPage();
    openFilters();
    expect(filterSelect("Categoría").options).toHaveLength(1);
    expect(filterSelect("Etiqueta").options).toHaveLength(1);
  });

  it("tolera que categorías devuelva algo que no es lista y que las etiquetas fallen", async () => {
    fetchCategories.mockResolvedValue(null);
    fetchStaffLabels.mockRejectedValue(new Error("y"));
    mockTickets();
    await renderPage();
    openFilters();
    expect(filterSelect("Categoría").options).toHaveLength(1);
    expect(filterSelect("Etiqueta").options).toHaveLength(1);
  });

  it("ignora las respuestas de catálogos si se desmonta antes", async () => {
    let resolveCategories;
    let resolveLabels;
    fetchCategories.mockReturnValue(new Promise((res) => (resolveCategories = res)));
    fetchStaffLabels.mockReturnValue(new Promise((res) => (resolveLabels = res)));
    mockTickets();
    const { unmount } = await renderPage();
    unmount();
    await act(async () => {
      resolveCategories([{ id: 1, name: "X" }]);
      resolveLabels([]);
    });
    let rejectCategories;
    let rejectLabels;
    fetchCategories.mockReturnValue(new Promise((_, rej) => (rejectCategories = rej)));
    fetchStaffLabels.mockReturnValue(new Promise((_, rej) => (rejectLabels = rej)));
    const second = await renderPage();
    second.unmount();
    await act(async () => {
      rejectCategories(new Error("a"));
      rejectLabels(new Error("b"));
    });
  });
});

describe("TicketsInboxPage - columnas y exportación", () => {
  it("permite ocultar columnas", async () => {
    mockTickets();
    await renderPage();
    expect(screen.getByText("SLA", { selector: "th" })).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Configurar columnas"));
    expect(screen.getByText("Columnas visibles")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("sla"));
    expect(screen.queryByText("SLA", { selector: "th" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Configurar columnas"));
    expect(screen.queryByText("Columnas visibles")).not.toBeInTheDocument();
  });

  it("descarga un CSV con las columnas visibles", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockTickets();
    await renderPage();
    let href;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      href = decodeURI(this.getAttribute("href"));
    });
    const button = screen.getByTitle("Descargar CSV");
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(click).toHaveBeenCalledOnce();
    expect(href).toContain("CLAVE,RESUMEN,INFORMADOR,RESPONSABLE,ESTADO,CREADO,SLA");
    expect(href).toContain('TK-1,"Luminaria","Ciudadano registrado","Agente #7"');
    expect(href).toContain("SLA vencido");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByTitle("Descargar CSV")).toBeEnabled();
    click.mockRestore();
  });

  it("marca el éxito aunque no haya tickets para exportar", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockTickets({ tickets: [], totalElements: 0, totalPages: 0 });
    await renderPage();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByTitle("Descargar CSV"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(click).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    click.mockRestore();
  });

  it("exporta sólo las columnas visibles y omite las desconocidas", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockTickets({ tickets: [rawTickets[1]] });
    await renderPage();
    fireEvent.click(screen.getByTitle("Configurar columnas"));
    fireEvent.click(screen.getByLabelText("clave"));
    fireEvent.click(screen.getByLabelText("estado"));
    fireEvent.click(screen.getByLabelText("creado"));
    let href;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      href = decodeURI(this.getAttribute("href"));
    });
    fireEvent.click(screen.getByTitle("Descargar CSV"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(href).toContain("RESUMEN,INFORMADOR,RESPONSABLE,SLA");
    expect(href).toContain('"Bache","Anónimo","Sin asignar"');
    click.mockRestore();
  });
});
