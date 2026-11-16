import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../agent/DashboardPage";
import { AGENT, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { useAgentTickets } from "../../hooks/useAgentTickets";
import { useIndicatorOverview } from "../../hooks/useIndicatorOverview";
import { indicatorOverview, emptyOverview } from "../../test/indicatorFixtures";
vi.mock("../../hooks/useAgentTickets", () => ({ useAgentTickets: vi.fn() }));
vi.mock("../../hooks/useIndicatorOverview", () => ({ useIndicatorOverview: vi.fn() }));
const refreshMetrics = vi.fn(), refreshRecent = vi.fn();
const renderPage = (user = AGENT) => renderWithProviders(<DashboardPage />, { auth: authFor(user) });
beforeEach(() => {
  vi.clearAllMocks();
  useIndicatorOverview.mockReturnValue({ data: indicatorOverview(), loading: false, error: null, refetch: refreshMetrics });
  useAgentTickets.mockReturnValue({ tickets: [{ id: "recent", summary: "Actividad más reciente", currentStatus: "REGISTERED", updatedAt: new Date().toISOString() }], totalElements: 999, loading: false, error: null, refetch: refreshRecent });
});
describe("DashboardPage con agregados globales", () => {
  it("usa 125 tickets globales y mantiene el listado reciente independiente", () => {
    renderPage();
    expect(useAgentTickets).toHaveBeenCalledWith({ page: 0, size: 4, sort: "updatedAt,desc" });
    const stats = screen.getByRole("region", { name: "Resumen operativo" });
    expect(within(stats).getByText("120")).toBeInTheDocument();
    expect(within(stats).getByText("125 tickets en total")).toBeInTheDocument();
    expect(screen.queryByText("999 tickets en total")).not.toBeInTheDocument();
    expect(screen.getByText("Urgente fuera de la primera página")).toBeInTheDocument();
    expect(screen.getByText("Actividad más reciente")).toBeInTheDocument();
    expect(screen.getByText("Distribución global de tickets")).toBeInTheDocument();
    expect(screen.getByText("En gestión").closest("div").nextSibling.firstChild).toHaveStyle({ width: "96%" });
  });
  it("refresca las dos consultas", () => {
    renderPage(); fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(refreshMetrics).toHaveBeenCalledOnce(); expect(refreshRecent).toHaveBeenCalledOnce();
  });
  it("no muestra cifras ni todo al día si falló la consulta", () => {
    useIndicatorOverview.mockReturnValue({ data: null, loading: false, error: "Sin conexión", refetch: refreshMetrics });
    renderPage(); expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión");
    expect(screen.queryByText("Tickets activos")).not.toBeInTheDocument();
    expect(screen.queryByText("Todo al día")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Reintentar")); expect(refreshMetrics).toHaveBeenCalled();
  });
  it("muestra carga sin ceros", () => {
    useIndicatorOverview.mockReturnValue({ data: null, loading: true, error: null }); renderPage();
    expect(screen.getByText("Preparando tu dashboard…")).toBeInTheDocument();
  });
  it("muestra vacío real tras una respuesta exitosa", () => {
    useIndicatorOverview.mockReturnValue({ data: emptyOverview(), loading: false });
    useAgentTickets.mockReturnValue({ tickets: [], loading: false }); renderPage();
    for(const text of ["0 tickets en total","Todo al día","No hay datos para mostrar.","Todavía no hay actividad reciente."]) expect(screen.getByText(text)).toBeInTheDocument();
  });
  it.each(["CITIZEN", "AREA_RESPONSIBLE", null])("no consulta para %s", (role) => {
    renderPage(role ? { role } : null); expect(screen.getByRole("alert")).toHaveTextContent("permiso");
    expect(useAgentTickets).not.toHaveBeenCalled(); expect(useIndicatorOverview).not.toHaveBeenCalled();
  });
  it.each([[{ firstName: "Lucía Marta" }, "Lucía"], [{ nombre: "Pedro" }, "Pedro"], [{ name: "Ana" }, "Ana"], [{ displayName: "  Sofía Ruiz " }, "Sofía"], [{}, "equipo"]])("saluda a %j", (user, name) => {
    renderPage({ role: "AGENT", ...user }); expect(screen.getByRole("heading", { name: `Hola, ${name}` })).toBeInTheDocument();
  });
  it("el fallo de recientes no invalida métricas ni afirma ausencia de actividad", () => {
    useAgentTickets.mockReturnValue({ tickets: [], loading: false, error: "Error de recientes" }); renderPage();
    expect(screen.getByText("125 tickets en total")).toBeInTheDocument(); expect(screen.getByRole("alert")).toHaveTextContent("Error de recientes");
    expect(screen.queryByText("Todavía no hay actividad reciente.")).not.toBeInTheDocument();
  });
  it("identifica recientes en carga", () => {
    useAgentTickets.mockReturnValue({ tickets: [], loading: true }); renderPage(); expect(screen.getByText("Cargando actividad reciente…")).toBeInTheDocument();
  });
  it("presenta SLA y criticidad de la lista acotada recibida", () => {
    const data=indicatorOverview(); data.attention.push({ id:"risk", summary:"Próximo", currentPriority:"HIGH", slaNearDue:true, resolutionDueAt:"2026-10-23T00:00:00Z" }, { id:"no-sla", summary:"Escalamiento manual", escalated:true });
    useIndicatorOverview.mockReturnValue({ data, loading:false }); renderPage();
    expect(screen.getByText("Próximo")).toBeInTheDocument(); expect(screen.getByText("Escalamiento manual")).toBeInTheDocument();
  });
  it.each([null, "inválida", new Date(Date.now()-2*60000).toISOString(), new Date(Date.now()-3*3600000).toISOString(), new Date(Date.now()-2*86400000).toISOString(), "2020-01-01T00:00:00Z"])("presenta fecha reciente %s", (updatedAt) => {
    useAgentTickets.mockReturnValue({ tickets:[{ id:"date", updatedAt }], loading:false }); renderPage(); expect(screen.getByText("Ticket sin resumen")).toBeInTheDocument();
  });
});
