import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MisReclamosPage from "../citizen/MisReclamosPage";
import TrackingPage from "../citizen/TrackingPage";
import HomePage from "../citizen/HomePage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { useMyTickets } from "../../hooks/useMyTickets";
import { useCategories } from "../../hooks/useCategories";
import * as api from "../../services/apiClient";

vi.mock("../../hooks/useMyTickets", () => ({ useMyTickets: vi.fn() }));
vi.mock("../../hooks/useCategories", () => ({ useCategories: vi.fn() }));
vi.mock("../../services/apiClient", () => ({
  trackTicket: vi.fn(),
  cancelAnonymousTicket: vi.fn(),
  confirmAnonymousResolution: vi.fn(),
  reopenAnonymousTicket: vi.fn(),
  answerAnonymousInformation: vi.fn(),
  rateAnonymousTicketAttention: vi.fn(),
  sendAnonymousMessage: vi.fn(),
  uploadAnonymousAttachment: vi.fn(),
  downloadAnonymousAttachment: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const ticket = (overrides = {}) => ({
  publicId: "TK-000001",
  currentStatus: "REGISTERED",
  summary: "Bache en la calle",
  description: "Descripción larga",
  createdAt: "2026-03-10T12:00:00Z",
  category: { name: "Vía pública" },
  requestType: { name: "Bache" },
  ...overrides,
});

describe("MisReclamosPage", () => {
  const mockHook = (overrides = {}) =>
    useMyTickets.mockReturnValue({ tickets: [], loading: false, error: null, source: "backend", ...overrides });

  it("muestra el estado de carga", () => {
    mockHook({ loading: true });
    const { container } = renderWithProviders(<MisReclamosPage />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText(/Datos de ejemplo/)).not.toBeInTheDocument();
  });

  it("muestra el vacío con enlace para iniciar un reclamo", () => {
    mockHook();
    renderWithProviders(<MisReclamosPage />);
    expect(screen.getByText("Todavía no tenés reclamos registrados.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Iniciar un reclamo/ })).toHaveAttribute("href", "/portal-ayuda");
    expect(screen.getByRole("link", { name: /Nuevo Reclamo/ })).toHaveAttribute("href", "/portal-ayuda");
  });

  it("lista los tickets con su estado y enlace al detalle", () => {
    mockHook({
      tickets: [
        ticket(),
        ticket({ publicId: "TK/2", currentStatus: "IN_PROGRESS", category: null, requestType: null, createdAt: null }),
        ticket({ publicId: "TK-3", currentStatus: "RESOLVED", requestType: { name: "Bacheo" }, category: null }),
        ticket({ publicId: "TK-4", currentStatus: "CANCELLED" }),
        ticket({ publicId: "TK-5", currentStatus: "ESTADO_RARO" }),
      ],
    });
    renderWithProviders(<MisReclamosPage />);
    expect(screen.getAllByText("Bache en la calle")).toHaveLength(5);
    expect(screen.getByText("Reclamo")).toBeInTheDocument();
    expect(screen.getByText("Bacheo")).toBeInTheDocument();
    expect(screen.getByText("ESTADO_RARO")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ver detalles/ })[1]).toHaveAttribute("href", "/mis-reclamos/TK%2F2");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("filtra por en curso y resueltos con contadores", () => {
    mockHook({
      tickets: [
        ticket({ publicId: "A", currentStatus: "REGISTERED" }),
        ticket({ publicId: "B", currentStatus: "RESOLVED" }),
        ticket({ publicId: "C", currentStatus: "CLOSED" }),
        ticket({ publicId: "D", currentStatus: "CANCELLED" }),
      ],
    });
    renderWithProviders(<MisReclamosPage />);
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveTextContent("4");
    expect(screen.getByRole("button", { name: /En curso/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Resueltos/ })).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: /En curso/ }));
    expect(screen.getAllByRole("link", { name: /Ver detalles/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Resueltos/ }));
    expect(screen.getAllByRole("link", { name: /Ver detalles/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Todos/ }));
    expect(screen.getAllByRole("link", { name: /Ver detalles/ })).toHaveLength(4);
  });

  it("muestra un vacío específico cuando el filtro no tiene resultados", () => {
    mockHook({ tickets: [ticket({ currentStatus: "REGISTERED" })] });
    renderWithProviders(<MisReclamosPage />);
    fireEvent.click(screen.getByRole("button", { name: /Resueltos/ }));
    expect(screen.getByText("No hay reclamos en esta categoría.")).toBeInTheDocument();
    expect(screen.queryByText("Iniciar un reclamo")).not.toBeInTheDocument();
  });

  it("avisa cuando son datos de ejemplo y muestra el error", () => {
    mockHook({ source: "sample", error: "No pudimos cargar tus reclamos.", tickets: [ticket()] });
    renderWithProviders(<MisReclamosPage />);
    expect(screen.getByText(/Datos de ejemplo/)).toBeInTheDocument();
    expect(screen.getByText("No pudimos cargar tus reclamos.")).toBeInTheDocument();
  });
});

describe("HomePage", () => {
  const categories = [
    { id: "1", title: "Alumbrado", description: "Luces", iconName: "Lightbulb", itemCount: 3, badgeText: "Popular" },
    { id: "otro", title: "Otro", description: "Consultas", iconName: "Folder", itemCount: 1 },
  ];

  it("muestra el cargando con contador provisional", () => {
    useCategories.mockReturnValue({ categories: [], loading: true, error: null });
    renderWithProviders(<HomePage />);
    expect(screen.getByRole("status", { name: "Cargando" })).toBeInTheDocument();
    expect(screen.getByText("... categorías")).toBeInTheDocument();
  });

  it("muestra el error de carga", () => {
    useCategories.mockReturnValue({ categories: [], loading: false, error: "Sin conexión" });
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Error al cargar las categorías: Sin conexión/)).toBeInTheDocument();
  });

  it("navega al portal al elegir una categoría, y a la consulta general para 'otro'", () => {
    useCategories.mockReturnValue({ categories, loading: false, error: null });
    renderWithProviders(<HomePage />);
    expect(screen.getByText("2 categorías")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Alumbrado").closest("button"));
    expect(screen.getByTestId("location")).toHaveTextContent("/portal-ayuda?category=1");
    fireEvent.click(screen.getByText("Otro").closest("button"));
    expect(screen.getByTestId("location")).toHaveTextContent("category=otro&subcategory=otro-general&requestType=OTRO_CONSULTA_GENERAL");
  });

  it("consulta un código de seguimiento sólo si se escribió algo", () => {
    useCategories.mockReturnValue({ categories: [], loading: false, error: null });
    renderWithProviders(<HomePage />);
    const input = screen.getByPlaceholderText("Ingresá tu código de seguimiento");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /^Consultar/ }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    fireEvent.change(input, { target: { value: " ABC123 " } });
    fireEvent.click(screen.getByRole("button", { name: /^Consultar/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("/seguimiento");
  });
});

describe("TrackingPage", () => {
  const publicTicket = {
    publicId: "TK-000009",
    currentStatus: "IN_PROGRESS",
    summary: "Luminaria rota",
    description: "d",
    createdAt: "2026-03-10T12:00:00Z",
    messages: [{ id: 1, authorType: "AGENT", text: "Hola vecino", createdAt: "2026-03-10T12:00:00Z" }],
  };

  const search = async (code = "ABC123") => {
    fireEvent.change(screen.getByPlaceholderText(/Ej\.: a1B2/), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: /Consultar/ }));
  };

  it("muestra la ayuda inicial", () => {
    renderWithProviders(<TrackingPage />);
    expect(screen.getByText(/La consulta es pública y de solo lectura/)).toBeInTheDocument();
  });

  it("exige ingresar un código", async () => {
    renderWithProviders(<TrackingPage />);
    fireEvent.click(screen.getByRole("button", { name: /Consultar/ }));
    expect(await screen.findByText("Ingresá un código de seguimiento.")).toBeInTheDocument();
    expect(api.trackTicket).not.toHaveBeenCalled();
  });

  it("consulta el código y muestra el estado público", async () => {
    api.trackTicket.mockResolvedValue(publicTicket);
    renderWithProviders(<TrackingPage />);
    await search("  ABC123  ");
    expect(await screen.findByText("Luminaria rota")).toBeInTheDocument();
    expect(api.trackTicket).toHaveBeenCalledWith("ABC123");
    expect(screen.getByText("¿Sos el dueño de este ticket?")).toBeInTheDocument();
  });

  it.each([
    [404, /No encontramos ninguna solicitud/],
    [400, /El código ingresado no es válido/],
    [500, /Explotó/],
  ])("traduce el error %s", async (status, expected) => {
    api.trackTicket.mockRejectedValue(Object.assign(new Error("Explotó"), { status }));
    renderWithProviders(<TrackingPage />);
    await search();
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("usa un mensaje genérico si el error no trae texto", async () => {
    api.trackTicket.mockRejectedValue({});
    renderWithProviders(<TrackingPage />);
    await search();
    expect(await screen.findByText(/No pudimos consultar el estado/)).toBeInTheDocument();
  });

  it("consulta automáticamente el código que viene del navegador y limpia el estado de la ruta", async () => {
    api.trackTicket.mockResolvedValue(publicTicket);
    renderWithProviders(<TrackingPage />, { route: { pathname: "/seguimiento", state: { codigo: "XYZ789" } }, path: "/seguimiento" });
    expect(await screen.findByText("Luminaria rota")).toBeInTheDocument();
    expect(api.trackTicket).toHaveBeenCalledTimes(1);
    expect(api.trackTicket).toHaveBeenCalledWith("XYZ789");
  });

  it("permite consultar otro código", async () => {
    api.trackTicket.mockResolvedValue(publicTicket);
    renderWithProviders(<TrackingPage />);
    await search();
    await screen.findByText("Luminaria rota");
    fireEvent.click(screen.getByText("Consultar otro código"));
    expect(screen.getByPlaceholderText(/Ej\.: a1B2/)).toHaveValue("");
    expect(screen.getByText(/La consulta es pública/)).toBeInTheDocument();
  });

  it("acredita con la contraseña y muestra la vista completa con chat", async () => {
    api.trackTicket.mockImplementation(async (code, password) => (password ? { ...publicTicket, description: "Detalle completo" } : publicTicket));
    api.sendAnonymousMessage.mockResolvedValue({ id: 2, authorType: "CITIZEN", text: "Gracias", createdAt: "2026-03-10T13:00:00Z" });
    renderWithProviders(<TrackingPage />);
    await search();
    await screen.findByText("Luminaria rota");
    const accredit = screen.getByRole("button", { name: /Acreditar/ });
    expect(accredit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Contraseña del ticket"), { target: { value: "  clave  " } });
    fireEvent.click(accredit);
    expect(await screen.findByText("Detalle completo")).toBeInTheDocument();
    expect(api.trackTicket).toHaveBeenLastCalledWith("ABC123", "clave");
    expect(screen.getByText("Hola vecino")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Escribí un mensaje…"), { target: { value: "Gracias" } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    await waitFor(() => expect(api.sendAnonymousMessage).toHaveBeenCalledWith("ABC123", { ticketPassword: "clave", text: "Gracias" }));
    expect(await screen.findByText("Gracias")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Consultar otro código"));
    expect(screen.getByPlaceholderText(/Ej\.: a1B2/)).toBeInTheDocument();
  });

  it("muestra el error de acreditación y no envía contraseñas vacías", async () => {
    api.trackTicket.mockResolvedValueOnce(publicTicket).mockRejectedValueOnce(Object.assign(new Error("x"), { status: 401 }));
    renderWithProviders(<TrackingPage />);
    await search();
    await screen.findByText("Luminaria rota");
    const password = screen.getByPlaceholderText("Contraseña del ticket");
    fireEvent.submit(password.closest("form"));
    expect(api.trackTicket).toHaveBeenCalledTimes(1);
    fireEvent.change(password, { target: { value: "mala" } });
    fireEvent.click(screen.getByRole("button", { name: /Acreditar/ }));
    expect(await screen.findByText("La contraseña ingresada no es correcta.")).toBeInTheDocument();
  });

  it("no reejecuta la consulta automática al re-renderizar", async () => {
    api.trackTicket.mockResolvedValue(publicTicket);
    const { rerender } = renderWithProviders(<TrackingPage />, { route: { pathname: "/seguimiento", state: { codigo: "AUTO1" } }, path: "/seguimiento" });
    await screen.findByText("Luminaria rota");
    await act(async () => {});
    expect(api.trackTicket).toHaveBeenCalledTimes(1);
    rerender(<div />);
  });
});
