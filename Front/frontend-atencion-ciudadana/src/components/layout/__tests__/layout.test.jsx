import { fireEvent, screen, within } from "@testing-library/react";
import { Route } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AgentLayout from "../AgentLayout";
import AgentSidebar from "../AgentSidebar";
import CitizenNavbar from "../CitizenNavbar";
import Footer from "../Footer";
import { ADMIN, AGENT, CITIZEN, authFor, makeAuth, renderWithProviders } from "../../../test/renderWithProviders";

describe("Footer", () => {
  it("muestra el área, contacto y enlaces activos e inactivos", () => {
    renderWithProviders(<Footer areaName="Atención Ciudadana" areaEmail="atencion@ciudaduade.com.ar" />);
    expect(screen.getByText(/Atención Ciudadana/)).toBeInTheDocument();
    expect(screen.getByText("atencion@ciudaduade.com.ar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar Reclamo" })).toHaveAttribute("href", "/portal-ayuda");
    expect(screen.getByRole("link", { name: "Consultar Ticket" })).toHaveAttribute("href", "/seguimiento");
    expect(screen.getByText("Habilitaciones").tagName).toBe("SPAN");
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
  });
});

describe("CitizenNavbar", () => {
  const openMenu = (name) => fireEvent.click(screen.getByRole("button", { name }));

  it("ofrece ingresar y crear cuenta a los visitantes", () => {
    renderWithProviders(<CitizenNavbar />);
    openMenu(/Ingresar/);
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
    expect(within(menu).getByRole("menuitem", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    expect(within(menu).getByRole("menuitem", { name: /código de seguimiento/ })).toHaveAttribute("href", "/seguimiento");
    expect(within(menu).queryByRole("menuitem", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Ingresar" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("muestra el usuario ciudadano con su menú y cierra sesión", () => {
    const auth = authFor({ ...CITIZEN, subjectId: "sub-123" });
    renderWithProviders(<CitizenNavbar />, { auth });
    openMenu(/Vecina Uno/);
    expect(screen.getByText("sub-123")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mis reclamos" })).toHaveAttribute("href", "/mis-reclamos");
    expect(screen.getByRole("menuitem", { name: "Cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.queryByRole("menuitem", { name: "Vista agente" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("agrega el acceso a la vista agente para el personal", () => {
    renderWithProviders(<CitizenNavbar />, { auth: authFor(AGENT) });
    openMenu(/Agente Uno/);
    expect(screen.getByRole("menuitem", { name: "Vista agente" })).toHaveAttribute("href", "/agente/tickets");
  });

  it("resuelve el nombre desde otros campos y omite la línea secundaria repetida", () => {
    const { unmount } = renderWithProviders(<CitizenNavbar />, { auth: authFor({ role: "CITIZEN", firstName: "Lucía", subjectId: "Lucía" }) });
    openMenu(/Lucía/);
    expect(screen.getAllByText("Lucía").length).toBeGreaterThan(0);
    unmount();
    renderWithProviders(<CitizenNavbar />, { auth: authFor({ role: "CITIZEN", email: "solo@mail.com" }) });
    expect(screen.getByRole("button", { name: /solo@mail.com/ })).toBeInTheDocument();
  });

  it("cierra el menú al hacer clic afuera y no al hacer clic dentro", () => {
    renderWithProviders(
      <div>
        <CitizenNavbar />
        <p>afuera</p>
      </div>
    );
    openMenu(/Ingresar/);
    fireEvent.mouseDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("afuera"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("tiene un menú móvil para visitantes", () => {
    renderWithProviders(<CitizenNavbar />);
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getAllByRole("link", { name: "Crear cuenta" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("link", { name: "Crear cuenta" }));
    expect(screen.getByLabelText("Abrir menú")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    fireEvent.click(screen.getByLabelText("Cerrar menú"));
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });

  it("tiene un menú móvil para usuarios con sesión", () => {
    const auth = authFor({ ...CITIZEN, subjectId: "sub-9" });
    renderWithProviders(<CitizenNavbar />, { auth });
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByText("sub-9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Mis reclamos" }));
    fireEvent.click(screen.getByLabelText("Abrir menú"));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Abrir menú")).toBeInTheDocument();
  });
});

describe("AgentSidebar", () => {
  it("muestra la navegación de un agente sin opciones de administrador", () => {
    renderWithProviders(<AgentSidebar />, { auth: authFor(AGENT), route: "/agente/tickets" });
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Catálogo")).not.toBeInTheDocument();
    expect(screen.getByText("Agente")).toBeInTheDocument();
    expect(screen.getAllByText("Agente Uno").length).toBeGreaterThan(0);
  });

  it("muestra las opciones de administración y marca la ruta activa", () => {
    renderWithProviders(<AgentSidebar />, { auth: authFor(ADMIN), route: "/agente/catalogo/3" });
    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveClass("bg-[#0F2C59]");
    expect(screen.getByRole("link", { name: "Tickets" })).not.toHaveClass("bg-[#0F2C59]");
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Etiquetas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agentes" })).toBeInTheDocument();
  });

  it("cierra sesión desde el escritorio", () => {
    const auth = authFor(ADMIN);
    renderWithProviders(<AgentSidebar />, { auth });
    fireEvent.click(screen.getAllByRole("button", { name: /Cerrar Sesión/ })[0]);
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /Ir al centro de ayuda/ })).toHaveAttribute("href", "/portal-ayuda");
  });

  it("resuelve nombre y rol desde campos alternativos", () => {
    const { unmount } = renderWithProviders(<AgentSidebar />, { auth: authFor({ role: "AREA_RESPONSIBLE", nombre: "Marta", apellido: "Díaz" }) });
    expect(screen.getByText("Marta Díaz")).toBeInTheDocument();
    expect(screen.getByText("Responsable de área")).toBeInTheDocument();
    unmount();
    const second = renderWithProviders(<AgentSidebar />, { auth: authFor({ role: "OTRO_ROL", email: "x@y.z" }) });
    expect(screen.getAllByText("x@y.z").length).toBeGreaterThan(0);
    expect(screen.getByText("OTRO_ROL")).toBeInTheDocument();
    second.unmount();
    renderWithProviders(<AgentSidebar />, { auth: makeAuth({ user: null }) });
    expect(screen.getByText("Usuario")).toBeInTheDocument();
  });

  it("abre y cierra el menú móvil y navega desde él", () => {
    const auth = authFor(ADMIN);
    const { container } = renderWithProviders(<AgentSidebar />, { auth, route: "/agente/metricas" });
    const toggle = container.querySelector(".md\\:hidden button");
    fireEvent.click(toggle);
    const overlay = container.querySelector(".fixed.inset-0");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(within(overlay).getByRole("link", { name: "Métricas" }));
    expect(container.querySelector(".fixed.inset-0")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(within(container.querySelector(".fixed.inset-0")).getByRole("link", { name: /centro de ayuda/ }));
    expect(container.querySelector(".fixed.inset-0")).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(within(container.querySelector(".fixed.inset-0")).getByRole("button", { name: /Cerrar Sesión/ }));
    expect(auth.logout).toHaveBeenCalledOnce();
    fireEvent.click(toggle);
    expect(container.querySelector(".fixed.inset-0")).not.toBeInTheDocument();
  });
});

describe("AgentLayout", () => {
  it("renderiza la barra lateral y el contenido anidado", () => {
    renderWithProviders(<AgentLayout />, {
      auth: authFor(AGENT),
      route: "/agente/tickets",
      path: "/agente",
      extraRoutes: <Route path="/agente/*" element={<AgentLayout />}><Route path="tickets" element={<p>Contenido</p>} /></Route>,
    });
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.getAllByText("Panel de Gestión").length).toBeGreaterThan(0);
  });
});
