import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthContext } from "../context/authContext";
import { ADMIN, AGENT, CITIZEN, authFor, makeAuth } from "../test/renderWithProviders";

const stub = vi.hoisted(() => (name) => ({ default: () => <div>{name}</div> }));

vi.mock("../pages/citizen/HomePage", () => stub("Home"));
vi.mock("../pages/citizen/HelpPortalPage", () => stub("Portal de ayuda"));
vi.mock("../pages/citizen/TrackingPage", () => stub("Seguimiento"));
vi.mock("../pages/citizen/MisReclamosPage", () => stub("Mis reclamos"));
vi.mock("../pages/citizen/MisReclamoDetailPage", () => stub("Detalle de mi reclamo"));
vi.mock("../pages/auth/LoginPage", () => stub("Ingresar"));
vi.mock("../pages/auth/RegisterPage", () => stub("Registro"));
vi.mock("../pages/agent/TicketsInboxPage", () => stub("Bandeja"));
vi.mock("../pages/agent/TicketDetailPage", () => stub("Detalle de ticket"));
vi.mock("../pages/agent/TicketCitizenViewPage", () => stub("Vista ciudadano"));
vi.mock("../pages/agent/DashboardPage", () => stub("Dashboard"));
vi.mock("../pages/agent/MetricsPage", () => stub("Métricas"));
vi.mock("../pages/agent/AgentsPage", () => stub("Agentes"));
vi.mock("../pages/admin/CategoriesPage", () => stub("Categorías"));
vi.mock("../pages/admin/SubcategoriesPage", () => stub("Subcategorías"));
vi.mock("../pages/admin/RequestTypesPage", () => stub("Tipos de solicitud"));
vi.mock("../pages/admin/LabelsPage", () => stub("Etiquetas"));
vi.mock("../components/layout/AgentSidebar", () => ({ default: () => <nav>Barra lateral</nav> }));
vi.mock("../components/layout/CitizenNavbar", () => ({ default: () => <header>Barra ciudadana</header> }));
vi.mock("../components/layout/Footer", () => ({ default: ({ areaName }) => <footer>{`Pie ${areaName}`}</footer> }));

vi.mock("../components/ui/SplashScreen", () => ({
  default: ({ onFinish }) => (
    <div>
      <span>Splash</span>
      <button onClick={onFinish}>terminar-splash</button>
    </div>
  ),
}));

const renderAt = async (path, auth = makeAuth()) => {
  window.history.pushState({}, "", path);
  const view = render(
    <AuthContext.Provider value={auth}>
      <App />
    </AuthContext.Provider>
  );
  await act(async () => {});
  return view;
};

beforeEach(() => window.history.pushState({}, "", "/"));
afterEach(() => vi.clearAllMocks());

describe("App - rutas públicas", () => {
  it("muestra el splash hasta que termina y luego el inicio con navbar y pie", async () => {
    await renderAt("/");
    expect(screen.getByText("Splash")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Barra ciudadana")).toBeInTheDocument();
    expect(screen.getByText("Pie Atención Ciudadana")).toBeInTheDocument();
    await act(async () => screen.getByText("terminar-splash").click());
    expect(screen.queryByText("Splash")).not.toBeInTheDocument();
  });

  it.each([
    ["/portal-ayuda", "Portal de ayuda"],
    ["/seguimiento", "Seguimiento"],
    ["/ingresar", "Ingresar"],
    ["/registro", "Registro"],
  ])("resuelve %s", async (path, text) => {
    await renderAt(path);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("las pantallas de acceso no usan el layout ciudadano", async () => {
    await renderAt("/ingresar");
    expect(screen.queryByText("Barra ciudadana")).not.toBeInTheDocument();
  });
});

describe("App - rutas del ciudadano", () => {
  it("redirige a ingresar si no hay sesión", async () => {
    await renderAt("/mis-reclamos");
    expect(screen.getByText("Ingresar")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/ingresar");
  });

  it.each([
    ["/mis-reclamos", "Mis reclamos"],
    ["/mis-reclamos/TK-1", "Detalle de mi reclamo"],
    ["/cuenta", "Cuenta — próximamente"],
  ])("con sesión resuelve %s", async (path, text) => {
    await renderAt(path, authFor(CITIZEN));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

describe("App - rutas del personal", () => {
  it("no deja entrar sin sesión", async () => {
    await renderAt("/agente/tickets");
    expect(screen.getByText("Ingresar")).toBeInTheDocument();
  });

  it("un ciudadano recibe acceso denegado en el panel", async () => {
    await renderAt("/agente/tickets", authFor(CITIZEN));
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
  });

  it.each([
    ["/agente/tickets", "Bandeja"],
    ["/agente/tickets/5", "Detalle de ticket"],
    ["/agente/tickets/5/vista-ciudadano", "Vista ciudadano"],
    ["/agente/dashboard", "Dashboard"],
    ["/agente/metricas", "Métricas"],
  ])("un agente resuelve %s dentro del layout del panel", async (path, text) => {
    await renderAt(path, authFor(AGENT));
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText("Barra lateral")).toBeInTheDocument();
  });

  it.each(["/agente/agentes", "/agente/catalogo", "/agente/etiquetas"])("un agente no puede entrar a %s", async (path) => {
    await renderAt(path, authFor(AGENT));
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
  });

  it.each([
    ["/agente/agentes", "Agentes"],
    ["/agente/catalogo", "Categorías"],
    ["/agente/catalogo/1", "Subcategorías"],
    ["/agente/catalogo/1/2", "Tipos de solicitud"],
    ["/agente/etiquetas", "Etiquetas"],
  ])("un administrador resuelve %s", async (path, text) => {
    await renderAt(path, authFor(ADMIN));
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
