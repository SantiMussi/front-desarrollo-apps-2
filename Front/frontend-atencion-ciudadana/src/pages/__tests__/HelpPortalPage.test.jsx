import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HelpPortalPage from "../citizen/HelpPortalPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useCategories } from "../../hooks/useCategories";

vi.mock("../../hooks/useCategories", () => ({ useCategories: vi.fn() }));
vi.mock("../../components/ticket/TicketForm", () => ({
  default: ({ requestType, onBack, onNewTicket, onDirtyChange, onStatusChange }) => (
    <div data-testid="ticket-form">
      <span>{`Formulario ${requestType.name}`}</span>
      <button onClick={() => onDirtyChange(true)}>ensuciar</button>
      <button onClick={() => onDirtyChange(false)}>limpiar</button>
      <button onClick={onBack}>form-volver</button>
      <button onClick={onNewTicket}>form-nuevo</button>
      <button onClick={() => onStatusChange("success")}>form-exito</button>
    </div>
  ),
}));

const categories = [
  {
    id: "1",
    title: "Alumbrado",
    description: "Luces de la calle",
    iconName: "Lightbulb",
    itemCount: 2,
    badgeText: "Popular",
    subcategories: [
      {
        id: "10",
        name: "Alumbrado público",
        iconName: "Lightbulb",
        requestTypes: [
          { code: "101", name: "Luminaria apagada", description: "Informá una luminaria" },
          { code: "102", name: "Poste caído", description: "Poste en riesgo" },
        ],
      },
      { id: "11", name: "Sin trámites", iconName: "IconoInexistente", requestTypes: [] },
    ],
  },
  { id: "2", title: "Vacía", description: "Sin nada", iconName: "Folder", itemCount: 0, subcategories: [] },
  {
    id: "otro",
    title: "Otro",
    description: "Consultas",
    iconName: "Folder",
    itemCount: 1,
    subcategories: [
      { id: "otro-general", name: "General", iconName: "Folder", requestTypes: [{ code: "OTRO_CONSULTA_GENERAL", name: "Consulta general", description: "Cualquier consulta" }] },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  useCategories.mockReturnValue({ categories, loading: false, error: null });
});

const renderPortal = (route = "/portal-ayuda") => renderWithProviders(<HelpPortalPage />, { route, path: "/portal-ayuda" });

describe("HelpPortalPage - carga", () => {
  it("muestra el cargando", () => {
    useCategories.mockReturnValue({ categories: [], loading: true, error: null });
    renderPortal();
    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();
  });

  it("muestra el error", () => {
    useCategories.mockReturnValue({ categories: [], loading: false, error: "Sin conexión" });
    renderPortal();
    expect(screen.getByText("Sin conexión")).toBeInTheDocument();
    expect(screen.getByText("Error al cargar")).toBeInTheDocument();
  });

  it("muestra las categorías iniciales y sube al inicio", () => {
    renderPortal();
    expect(screen.getByText("¿Sobre qué es tu consulta?")).toBeInTheDocument();
    expect(screen.getByText("3 categorías")).toBeInTheDocument();
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(screen.queryByLabelText("Volver")).not.toBeInTheDocument();
  });
});

describe("HelpPortalPage - navegación por pasos", () => {
  it("recorre categoría, subcategoría y tipo de solicitud actualizando la URL", () => {
    renderPortal();
    fireEvent.click(screen.getByText("Alumbrado").closest("button"));
    expect(screen.getByText("Seleccioná un área dentro de Alumbrado")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("category=1");
    fireEvent.click(screen.getByText("Alumbrado público").closest("button"));
    expect(screen.getByText("¿Qué necesitás gestionar?")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("subcategory=10");
    fireEvent.click(screen.getByText("Luminaria apagada").closest("button"));
    expect(screen.getByTestId("ticket-form")).toHaveTextContent("Formulario Luminaria apagada");
    expect(screen.getByTestId("location")).toHaveTextContent("requestType=101");
    expect(screen.queryByPlaceholderText(/Buscá/)).not.toBeInTheDocument();
  });

  it("muestra los trámites de cada subcategoría con el ícono de respaldo cuando no existe", () => {
    renderPortal("/portal-ayuda?category=1");
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText("Luminaria apagada, Poste caído")).toBeInTheDocument();
  });

  it("explica cuando una categoría o subcategoría no tiene trámites", () => {
    const first = renderPortal("/portal-ayuda?category=2");
    expect(screen.getByText("Todavía no hay trámites disponibles en esta área")).toBeInTheDocument();
    first.unmount();
    renderPortal("/portal-ayuda?category=1&subcategory=11");
    expect(screen.getByText("Todavía no hay trámites disponibles acá")).toBeInTheDocument();
  });

  it("restaura la selección desde los parámetros de la URL", () => {
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    expect(screen.getByTestId("ticket-form")).toBeInTheDocument();
    expect(screen.getByLabelText("Volver")).toBeInTheDocument();
  });

  it("ignora parámetros que no existen", () => {
    renderPortal("/portal-ayuda?category=999&subcategory=10&requestType=101");
    expect(screen.getByText("¿Sobre qué es tu consulta?")).toBeInTheDocument();
    const second = renderPortal("/portal-ayuda?category=1&subcategory=999&requestType=101");
    expect(screen.getAllByText("Seleccioná un área dentro de Alumbrado").length).toBeGreaterThan(0);
    second.unmount();
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=999");
    expect(screen.getAllByText("¿Qué necesitás gestionar?").length).toBeGreaterThan(0);
  });

  it("vuelve un paso con la flecha y llega al inicio del sitio desde el primer nivel", () => {
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.getByText("¿Qué necesitás gestionar?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.getByText("Seleccioná un área dentro de Alumbrado")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.getByText("¿Sobre qué es tu consulta?")).toBeInTheDocument();
  });

  it("la categoría 'otro' vuelve directo al inicio", () => {
    renderPortal("/portal-ayuda?category=otro&subcategory=otro-general&requestType=OTRO_CONSULTA_GENERAL");
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("navega con el breadcrumb", () => {
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    fireEvent.click(screen.getByRole("button", { name: "Alumbrado público" }));
    expect(screen.getByText("¿Qué necesitás gestionar?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Alumbrado" }));
    expect(screen.getByText("Seleccioná un área dentro de Alumbrado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Portal de Ayuda/ }));
    expect(screen.getByText("¿Sobre qué es tu consulta?")).toBeInTheDocument();
  });

  it("'nuevo reclamo' desde el formulario vuelve a las categorías", () => {
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    fireEvent.click(screen.getByText("form-exito"));
    fireEvent.click(screen.getByText("form-nuevo"));
    expect(screen.getByText("¿Sobre qué es tu consulta?")).toBeInTheDocument();
  });

  it("vuelve al inicio del sitio desde el primer paso sin selección", () => {
    renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    fireEvent.click(screen.getByText("form-volver"));
    expect(screen.getByText("¿Qué necesitás gestionar?")).toBeInTheDocument();
  });
});

describe("HelpPortalPage - protección de cambios sin guardar", () => {
  const openDirtyForm = () => {
    const view = renderPortal("/portal-ayuda?category=1&subcategory=10&requestType=101");
    fireEvent.click(screen.getByText("ensuciar"));
    return view;
  };

  it("avisa antes de salir y se queda si se cancela", async () => {
    openDirtyForm();
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.getByText("¿Querés salir del formulario?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Seguir editando"));
    await waitFor(() => expect(screen.queryByText("¿Querés salir del formulario?")).not.toBeInTheDocument());
    expect(screen.getByTestId("ticket-form")).toBeInTheDocument();
  });

  it("sale y descarta el formulario si se confirma", async () => {
    openDirtyForm();
    fireEvent.click(screen.getByRole("button", { name: "Alumbrado" }));
    fireEvent.click(screen.getByText("Sí, salir"));
    await waitFor(() => expect(screen.queryByTestId("ticket-form")).not.toBeInTheDocument());
    expect(screen.getByText("Seleccioná un área dentro de Alumbrado")).toBeInTheDocument();
  });

  it("no pregunta si el formulario está limpio", () => {
    openDirtyForm();
    fireEvent.click(screen.getByText("limpiar"));
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(screen.queryByText("¿Querés salir del formulario?")).not.toBeInTheDocument();
  });

  it("registra el aviso del navegador al cerrar la pestaña sólo con cambios pendientes", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = openDirtyForm();
    const call = add.mock.calls.find(([type]) => type === "beforeunload");
    expect(call).toBeTruthy();
    const event = new Event("beforeunload", { cancelable: true });
    call[1](event);
    expect(event.defaultPrevented).toBe(true);
    unmount();
    expect(remove.mock.calls.some(([type]) => type === "beforeunload")).toBe(true);
    add.mockRestore();
    remove.mockRestore();
  });

  it("confirmar sin acción pendiente no rompe", async () => {
    openDirtyForm();
    fireEvent.click(screen.getByLabelText("Volver"));
    fireEvent.click(screen.getByText("Sí, salir"));
    fireEvent.click(screen.getByLabelText("Volver"));
    await act(async () => {});
  });
});

describe("HelpPortalPage - búsqueda", () => {
  it("muestra los resultados y permite abrir uno", () => {
    renderPortal("/portal-ayuda?q=luminaria");
    expect(screen.getByText(/Trámites para "luminaria"/)).toBeInTheDocument();
    expect(screen.getByText("Búsqueda: luminaria")).toBeInTheDocument();
    expect(screen.getByText("2 resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Luminaria apagada").closest("button"));
    expect(screen.getByTestId("ticket-form")).toBeInTheDocument();
  });

  it("expande la búsqueda con sinónimos y sin tildes", () => {
    renderPortal("/portal-ayuda?q=LÁMPARA");
    expect(screen.getByText("Luminaria apagada")).toBeInTheDocument();
    expect(screen.getByText("Poste caído")).toBeInTheDocument();
    expect(screen.getByText("2 resultados")).toBeInTheDocument();
  });

  it("usa el singular cuando hay un único resultado", () => {
    renderPortal("/portal-ayuda?q=cualquier");
    expect(screen.getByText("Consulta general")).toBeInTheDocument();
    expect(screen.getByText("1 resultado")).toBeInTheDocument();
  });

  it("muestra que no hay resultados y ofrece ver todas las categorías", () => {
    renderPortal("/portal-ayuda?q=zzzzzz");
    expect(screen.getByText("No encontramos resultados")).toBeInTheDocument();
    expect(screen.getByText("0 resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ver todas las categorías"));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/portal-ayuda$/);
  });

  it("busca desde la barra de búsqueda", () => {
    renderPortal();
    fireEvent.change(screen.getByPlaceholderText(/Buscá/), { target: { value: "poste" } });
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("q=poste");
  });

  it("la búsqueda se ignora cuando ya hay una categoría elegida", () => {
    renderPortal("/portal-ayuda?q=poste&category=1");
    expect(screen.getByText("Seleccioná un área dentro de Alumbrado")).toBeInTheDocument();
    expect(screen.queryByText(/Resultados de búsqueda/)).not.toBeInTheDocument();
  });
});
