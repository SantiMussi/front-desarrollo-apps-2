import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentsPage from "../agent/AgentsPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { fetchAdminAgents } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({ fetchAdminAgents: vi.fn() }));

const row = (overrides) => ({
  actorId: "11111111-1111-4111-8111-111111111111",
  firstName: "Laura",
  lastName: "Martínez",
  email: "lmartinez@m2.test",
  role: "AGENT",
  areaId: null,
  active: true,
  activeTickets: 4,
  resolvedThisMonth: 3,
  slaMet: 19,
  slaBreached: 1,
  ...overrides,
});

const STAFF = [
  row(),
  row({ actorId: "22222222-2222-4222-8222-222222222222", firstName: "Sofía", lastName: "Benítez", email: "sbenitez@m2.test",
    role: "AREA_RESPONSIBLE", areaId: "M3", activeTickets: 2, resolvedThisMonth: 1, slaMet: 17, slaBreached: 1 }),
  row({ actorId: "33333333-3333-4333-8333-333333333333", firstName: "Pablo", lastName: "Empleado", email: "padmin@m2.test",
    role: "ADMIN", activeTickets: 0, resolvedThisMonth: 0, slaMet: 8, slaBreached: 2 }),
  row({ actorId: "44444444-4444-4444-8444-444444444444", firstName: null, lastName: null, email: "baja@m2.test",
    active: false, activeTickets: 0, resolvedThisMonth: 0, slaMet: 0, slaBreached: 0 }),
];

beforeEach(() => {
  fetchAdminAgents.mockReset();
  fetchAdminAgents.mockResolvedValue(STAFF);
});

describe("AgentsPage con el directorio real", () => {
  it("muestra el personal de M2 y los totales calculados desde el back", async () => {
    renderWithProviders(<AgentsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando el directorio del personal");

    expect(await screen.findByText("Laura Martínez")).toBeInTheDocument();
    expect(fetchAdminAgents).toHaveBeenCalledTimes(1);
    expect(screen.getByText("4 personas encontradas")).toBeInTheDocument();
    const stat = (label) => screen.getByText(label, { selector: "p" }).nextSibling;
    expect(stat("Personal activo")).toHaveTextContent("3");
    expect(stat("Tickets activos asignados")).toHaveTextContent("6");
    expect(stat("Resueltos este mes")).toHaveTextContent("4");
    expect(screen.queryByText(/Demostración|ficticios|Invitar agente/)).not.toBeInTheDocument();

    const laura = screen.getByText("Laura Martínez").closest("tr");
    expect(within(laura).getByText("Agente")).toBeInTheDocument();
    expect(within(laura).getByText("Sin área")).toBeInTheDocument();
    expect(within(laura).getByText("Activo")).toBeInTheDocument();
    const sofia = screen.getByText("Sofía Benítez").closest("tr");
    expect(within(sofia).getByText("Responsable de área")).toBeInTheDocument();
    expect(within(sofia).getByText("M3")).toBeInTheDocument();
  });

  it("muestra el cumplimiento de SLA con colores por umbral y sin inventar datos", async () => {
    renderWithProviders(<AgentsPage />);
    await screen.findByText("Laura Martínez");

    expect(screen.getByText("95%")).toHaveClass("text-emerald-600");
    expect(screen.getByText("94.4%")).toHaveClass("text-amber-600");
    expect(screen.getByText("80%")).toHaveClass("text-red-600");
    expect(screen.getByText("80%")).toHaveAttribute("title", "8 cumplidos, 2 vencidos");
    const sinNombre = screen.getByText("baja@m2.test", { selector: "p.font-semibold" }).closest("tr");
    expect(within(sinNombre).getByText("Sin datos")).toHaveClass("text-slate-400");
    expect(within(sinNombre).getByText("Inactivo")).toBeInTheDocument();
  });

  it("filtra por texto sin importar tildes, rol, área y estado, y limpia los filtros", async () => {
    renderWithProviders(<AgentsPage />);
    await screen.findByText("Laura Martínez");
    const search = screen.getByPlaceholderText(/Buscar por nombre/);

    fireEvent.change(search, { target: { value: "sofia" } });
    expect(screen.getByText("1 persona encontrada")).toBeInTheDocument();
    expect(screen.getByText("Sofía Benítez")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "nadie" } });
    expect(screen.getByText("No encontramos personas con esos filtros")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Limpiar filtros"));

    fireEvent.change(screen.getByLabelText("Filtrar por rol"), { target: { value: "ADMIN" } });
    expect(screen.getByText("1 persona encontrada")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por rol"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por área"), { target: { value: "M3" } });
    expect(screen.getByText("1 persona encontrada")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por área"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "inactive" } });
    expect(screen.getByText("1 persona encontrada")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "active" } });
    expect(screen.getByText("3 personas encontradas")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Limpiar filtros"));
    expect(screen.getByText("4 personas encontradas")).toBeInTheDocument();
    expect(screen.queryByText("Limpiar filtros")).not.toBeInTheDocument();
  });

  it("avisa cuando todavía no hay personal cargado", async () => {
    fetchAdminAgents.mockResolvedValue([]);
    renderWithProviders(<AgentsPage />);

    expect(await screen.findByText("Todavía no hay personal cargado en M2")).toBeInTheDocument();
    expect(screen.getByText("0 personas encontradas")).toBeInTheDocument();
  });

  it("muestra el error sin datos inventados y permite reintentar", async () => {
    fetchAdminAgents.mockRejectedValueOnce(Object.assign(new Error("boom"), { status: 500 }));
    renderWithProviders(<AgentsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar el directorio del personal");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Laura Martínez")).toBeInTheDocument();
    expect(fetchAdminAgents).toHaveBeenCalledTimes(2);
  });

  it("explica el 403 cuando el usuario no es administrador", async () => {
    fetchAdminAgents.mockRejectedValueOnce(Object.assign(new Error("Forbidden"), { status: 403 }));
    renderWithProviders(<AgentsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Sólo un administrador puede ver el directorio del personal.");
  });
});
