import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../agent/DashboardPage";
import { AGENT, authFor, makeAuth, renderWithProviders } from "../../test/renderWithProviders";
import { useAgentTickets } from "../../hooks/useAgentTickets";

vi.mock("../../hooks/useAgentTickets", () => ({ useAgentTickets: vi.fn() }));

const NOW = new Date("2026-03-31T12:00:00Z");
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

const mockTickets = (overrides = {}) => {
  const refetch = vi.fn();
  useAgentTickets.mockReturnValue({ tickets: [], totalElements: 0, loading: false, error: null, refetch, ...overrides });
  return refetch;
};

const renderPage = (auth = authFor(AGENT)) => renderWithProviders(<DashboardPage />, { auth });

describe("DashboardPage", () => {
  it("muestra el cargando", () => {
    mockTickets({ loading: true });
    renderPage();
    expect(screen.getByText("Preparando tu dashboard…")).toBeInTheDocument();
  });

  it("consulta la bandeja con los parámetros del dashboard", () => {
    mockTickets();
    renderPage();
    expect(useAgentTickets).toHaveBeenCalledWith({ page: 0, size: 100, sort: "updatedAt,desc" });
  });

  it("muestra el estado vacío cuando no hay tickets", () => {
    mockTickets();
    renderPage();
    expect(screen.getByText("Todo al día")).toBeInTheDocument();
    expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay actividad reciente.")).toBeInTheDocument();
    expect(screen.getByText("0 tickets en total")).toBeInTheDocument();
  });

  it.each([
    [{ firstName: "Lucía Marta" }, "Hola, Lucía"],
    [{ nombre: "Pedro Pablo" }, "Hola, Pedro"],
    [{ name: "Ana" }, "Hola, Ana"],
    [{ displayName: "  Sofía Ruiz " }, "Hola, Sofía"],
    [{ role: "AGENT" }, "Hola, equipo"],
  ])("saluda según el usuario %j", (user, greeting) => {
    mockTickets();
    renderPage(authFor(user));
    expect(screen.getByRole("heading", { name: greeting })).toBeInTheDocument();
  });

  it("saluda al equipo sin usuario", () => {
    mockTickets();
    renderPage(makeAuth());
    expect(screen.getByRole("heading", { name: "Hola, equipo" })).toBeInTheDocument();
  });

  it("calcula los indicadores y prioriza los tickets que requieren atención", () => {
    mockTickets({
      totalElements: 42,
      tickets: [
        { id: 1, publicId: "TK-1", summary: "Vencido", currentStatus: "IN_PROGRESS", slaBreached: true, assignedAgentId: 9, currentPriority: "HIGH", updatedAt: ago(5 * MIN) },
        { id: 2, publicId: "TK-2", summary: "Por vencer", currentStatus: "REGISTERED", slaNearDue: true, updatedAt: ago(30 * MIN), currentPriorityFactor: "LOW" },
        { id: 3, publicId: "TK-3", summary: "Crítico en plazo", currentStatus: "IN_REVIEW", resolutionDueAt: "2026-04-10T00:00:00Z", currentPriority: "CRITICAL", assignedAgentId: 1, updatedAt: ago(3 * HOUR) },
        { id: 4, publicId: "TK-4", summary: "Escalado", currentStatus: "ROUTED", escalated: true, resolutionDueAt: "2026-04-10T00:00:00Z", assignedAgentId: 1, updatedAt: ago(2 * DAY) },
        { id: 5, summary: "Sin novedades", currentStatus: "PENDING_INFORMATION", resolutionDueAt: "2026-04-10T00:00:00Z", assignedAgentId: 1, updatedAt: ago(10 * DAY) },
        { id: 6, publicId: "TK-6", summary: "", currentStatus: "RESOLVED", updatedAt: "invalid-date", createdAt: undefined },
        { id: 7, publicId: "TK-7", summary: "Factor crítico", currentStatus: "REGISTERED", currentPriorityFactor: "CRITICAL", resolutionDueAt: "2026-04-10T00:00:00Z", assignedAgentId: 1, updatedAt: ago(1000) },
        { id: 8, publicId: "TK-8", currentStatus: "CLOSED", createdAt: ago(20 * MIN) },
      ],
    });
    renderPage();
    const stat = (label) => screen.getAllByText(label)[0].closest("a");
    expect(within(stat("Tickets activos")).getByText("6")).toBeInTheDocument();
    expect(within(stat("Tickets activos")).getByText("42 tickets en total")).toBeInTheDocument();
    expect(within(stat("Sin asignar")).getByText("1")).toBeInTheDocument();
    expect(within(stat("SLA vencido")).getByText("1")).toBeInTheDocument();
    expect(within(stat("Próximos a vencer")).getByText("1")).toBeInTheDocument();

    const attention = screen.getByText("Requieren tu atención").closest("section");
    const rows = within(attention).getAllByRole("link").filter((link) => link.getAttribute("href").startsWith("/agente/tickets/"));
    expect(rows[0]).toHaveTextContent("TK-1");
    expect(within(attention).getByText("SLA vencido")).toBeInTheDocument();
    expect(within(attention).getByText("Próximo a vencer")).toBeInTheDocument();
    expect(within(attention).getAllByText("Escalado").length).toBeGreaterThan(0);
    expect(within(attention).queryByText("Sin novedades")).not.toBeInTheDocument();
    expect(within(attention).getAllByText("Crítica")).toHaveLength(2);
    expect(within(attention).getByText("Alta")).toBeInTheDocument();
    expect(within(attention).getByText("Baja")).toBeInTheDocument();
  });

  it("usa la prioridad cruda cuando no tiene etiqueta y 'Normal' cuando no hay prioridad", () => {
    mockTickets({
      tickets: [
        { id: 1, publicId: "A", summary: "Rara", currentStatus: "REGISTERED", currentPriority: "URGENTISIMA", escalated: true, updatedAt: ago(MIN) },
        { id: 2, publicId: "B", summary: "Sin prioridad", currentStatus: "REGISTERED", escalated: true, updatedAt: ago(2 * MIN) },
      ],
    });
    renderPage();
    expect(screen.getByText("URGENTISIMA")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("muestra la distribución por estado y la actividad reciente con fechas relativas", () => {
    mockTickets({
      tickets: [
        { id: 1, publicId: "TK-1", summary: "Reciente", currentStatus: "REGISTERED", updatedAt: ago(10 * 1000) },
        { id: 2, publicId: "TK-2", summary: "Minutos", currentStatus: "REGISTERED", updatedAt: ago(15 * MIN) },
        { id: 3, publicId: "TK-3", summary: "Horas", currentStatus: "CLOSED", updatedAt: ago(5 * HOUR) },
        { id: 4, publicId: "TK-4", summary: "Días", currentStatus: "ESTADO_RARO", updatedAt: ago(3 * DAY) },
        { id: 5, publicId: "TK-5", summary: "Viejo", currentStatus: "RESOLVED", updatedAt: ago(20 * DAY) },
        { id: 6, publicId: "TK-6", summary: "Inválido", currentStatus: "RESOLVED", updatedAt: "no-fecha" },
        { id: 7, summary: "", currentStatus: "RESOLVED" },
      ],
    });
    renderPage();
    expect(screen.getByText("Ahora")).toBeInTheDocument();
    expect(screen.getByText("Hace 15 min")).toBeInTheDocument();
    expect(screen.getByText("Hace 5 h")).toBeInTheDocument();
    expect(screen.getByText("Hace 3 d")).toBeInTheDocument();
    const flow = screen.getByText("Flujo de trabajo").closest("section");
    expect(within(flow).getByText("Registrado")).toBeInTheDocument();
    expect(within(flow).getByText("Resuelto")).toBeInTheDocument();
    expect(within(flow).queryByText("ESTADO_RARO")).not.toBeInTheDocument();
    expect(screen.getByText("TK-4", { selector: "span" }).parentElement).toHaveTextContent("ESTADO_RARO");
    const activity = screen.getByText("Actividad reciente").closest("section");
    expect(within(activity).getAllByRole("link")).toHaveLength(4);
  });

  it("muestra 'Sin fecha' en la actividad reciente sin fechas válidas", () => {
    mockTickets({ tickets: [{ id: 1, publicId: "TK-1", summary: "", currentStatus: "REGISTERED" }] });
    renderPage();
    expect(screen.getByText("Sin fecha")).toBeInTheDocument();
    expect(screen.getAllByText("Ticket sin resumen").length).toBeGreaterThan(0);
  });

  it("muestra el error con opción de reintentar y permite actualizar", () => {
    const refetch = mockTickets({ error: "Sin conexión" });
    renderPage();
    expect(screen.getByText(/No pudimos actualizar los datos: Sin conexión/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Reintentar"));
    fireEvent.click(screen.getByRole("button", { name: /Actualizar/ }));
    expect(refetch).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: /Abrir Métricas/ })).toHaveAttribute("href", "/agente/metricas");
  });
});
