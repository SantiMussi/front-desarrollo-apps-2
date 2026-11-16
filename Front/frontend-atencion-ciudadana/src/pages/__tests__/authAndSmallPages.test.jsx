import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../auth/LoginPage";
import MisReclamoDetailPage from "../citizen/MisReclamoDetailPage";
import TicketCitizenViewPage from "../agent/TicketCitizenViewPage";
import { CITIZEN, authFor, makeAuth, renderWithProviders } from "../../test/renderWithProviders";
import { useMyTicketDetail } from "../../hooks/useMyTicketDetail";
import { useTicketMessages } from "../../hooks/useTicketMessages";
import { useTicketCitizenView } from "../../hooks/useTicketCitizenView";
import { downloadTicketAttachment, uploadTicketAttachment } from "../../services/apiClient";

vi.mock("../../hooks/useMyTicketDetail", async (importOriginal) => ({
  ...(await importOriginal()),
  useMyTicketDetail: vi.fn(),
}));
vi.mock("../../hooks/useTicketMessages", () => ({ useTicketMessages: vi.fn() }));
vi.mock("../../hooks/useTicketCitizenView", () => ({ useTicketCitizenView: vi.fn() }));
vi.mock("../../services/apiClient", () => ({
  getStoredToken: () => "test-session",
  uploadTicketAttachment: vi.fn(),
  downloadTicketAttachment: vi.fn(),
}));

let lastViewProps;
vi.mock("../../components/ticket/CitizenTicketView", () => ({
  default: (props) => {
    lastViewProps = props;
    return <div data-testid="citizen-view">{props.ticket.summary}</div>;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  lastViewProps = undefined;
});

describe("LoginPage", () => {
  const renderLogin = (auth = makeAuth(), route = "/ingresar") =>
    renderWithProviders(<LoginPage />, { auth, route, path: "/ingresar", extraRoutes: <Route path="/mis-reclamos" element={<p>Mis reclamos</p>} /> });

  const fill = () => {
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { name: "username", value: "a@b.c" } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { name: "password", value: "secreta" } });
  };

  it("inicia sesión y vuelve al inicio", async () => {
    const { auth } = renderLogin();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ username: "a@b.c", password: "secreta" }));
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/));
  });

  it("vuelve a la ruta protegida original y muestra el mensaje recibido", async () => {
    const auth = makeAuth();
    renderWithProviders(<LoginPage />, {
      auth,
      route: { pathname: "/ingresar", state: { from: { pathname: "/mis-reclamos" }, message: "Cuenta creada. Ya podés iniciar sesión." } },
      path: "/ingresar",
      extraRoutes: <Route path="/mis-reclamos" element={<p>Mis reclamos</p>} />,
    });
    expect(screen.getByText("Cuenta creada. Ya podés iniciar sesión.")).toBeInTheDocument();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText("Mis reclamos")).toBeInTheDocument();
  });

  it("redirige a la ruta original si ya hay sesión", () => {
    renderWithProviders(<LoginPage />, {
      auth: authFor(CITIZEN),
      route: { pathname: "/ingresar", state: { from: { pathname: "/mis-reclamos" } } },
      path: "/ingresar",
      extraRoutes: <Route path="/mis-reclamos" element={<p>Mis reclamos</p>} />,
    });
    expect(screen.getByText("Mis reclamos")).toBeInTheDocument();
  });

  it("alterna la visibilidad de la contraseña", () => {
    renderLogin();
    expect(screen.getByText("Bienvenido de nuevo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al portal de ayuda" })).toHaveAttribute("href", "/portal-ayuda");
    const password = screen.getByLabelText(/^Contraseña/);
    fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByLabelText("Ocultar contraseña"));
    expect(password).toHaveAttribute("type", "password");
  });

  it("muestra el error del servidor o uno genérico y deshabilita mientras procesa", async () => {
    let reject;
    const auth = makeAuth({ login: vi.fn(() => new Promise((_, rej) => (reject = rej))) });
    renderLogin(auth);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("button", { name: "Procesando..." })).toBeDisabled();
    reject(new Error("Credenciales inválidas"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
    auth.login.mockRejectedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No pudimos completar la solicitud."));
  });

  it("redirige si ya hay sesión", () => {
    renderWithProviders(<LoginPage />, {
      auth: authFor(CITIZEN),
      route: "/ingresar",
      path: "/ingresar",
      extraRoutes: <Route path="/" element={<p>Inicio</p>} />,
    });
    expect(screen.getByText("Inicio")).toBeInTheDocument();
  });
});

describe("MisReclamoDetailPage", () => {
  const messages = () => ({
    messages: [{ id: 1 }],
    loading: false,
    error: null,
    send: vi.fn().mockResolvedValue({}),
    edit: vi.fn(),
    remove: vi.fn(),
    messageForError: vi.fn(),
  });
  const renderPage = (auth = authFor({ ...CITIZEN, citizenId: "cit-1" })) =>
    renderWithProviders(<MisReclamoDetailPage />, { auth, route: "/mis-reclamos/TK-1", path: "/mis-reclamos/:publicId" });

  it("muestra el cargando", () => {
    useMyTicketDetail.mockReturnValue({ ticket: null, loading: true });
    useTicketMessages.mockReturnValue(messages());
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it.each([
    ["con el error del hook", "No tenés acceso a este reclamo.", /No tenés acceso/],
    ["con el mensaje por defecto", null, /No encontramos este reclamo/],
  ])("muestra el error %s y ofrece volver", (_case, error, expected) => {
    useMyTicketDetail.mockReturnValue({ ticket: null, loading: false, error });
    useTicketMessages.mockReturnValue(messages());
    renderPage();
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a Mis Reclamos/ })).toHaveAttribute("href", "/mis-reclamos");
  });

  it("arma la vista con acciones, adjuntos y chat", async () => {
    const actions = { confirmResolution: vi.fn() };
    const chat = messages();
    useMyTicketDetail.mockReturnValue({ ticket: { id: 5, summary: "Mi reclamo" }, loading: false, actions, actionLoading: true, actionError: "Error" });
    useTicketMessages.mockReturnValue(chat);
    uploadTicketAttachment.mockResolvedValue({ id: 1 });
    downloadTicketAttachment.mockResolvedValue(new Blob());
    renderPage();
    expect(screen.getByTestId("citizen-view")).toHaveTextContent("Mi reclamo");
    expect(useTicketMessages).toHaveBeenCalledWith(5);
    expect(lastViewProps).toMatchObject({ backTo: "/mis-reclamos", actions, actionLoading: true, actionError: "Error" });
    expect(lastViewProps.chat).toMatchObject({ items: [{ id: 1 }], canSend: true, currentAuthorId: "cit-1", onEdit: chat.edit, onDelete: chat.remove });
    const file = new File(["x"], "x.png");
    await lastViewProps.attachments.uploadFile(file);
    await lastViewProps.attachments.downloadFile({ id: 9 });
    expect(uploadTicketAttachment).toHaveBeenCalledWith(5, file);
    expect(downloadTicketAttachment).toHaveBeenCalledWith(9);
    await lastViewProps.chat.onSend("hola");
    expect(chat.send).toHaveBeenCalledWith("PUBLIC", "hola");
  });

  it("no monta el detalle sin usuario cargado", () => {
    useMyTicketDetail.mockReturnValue({ ticket: { id: 5, summary: "S" }, loading: false });
    useTicketMessages.mockReturnValue(messages());
    renderPage(makeAuth());
    expect(lastViewProps).toBeUndefined();
    expect(useMyTicketDetail).not.toHaveBeenCalled();
  });
});

describe("TicketCitizenViewPage", () => {
  const renderPage = () => renderWithProviders(<TicketCitizenViewPage />, { route: "/agente/tickets/7/vista-ciudadano", path: "/agente/tickets/:ticketId/vista-ciudadano" });

  it("muestra el cargando", () => {
    useTicketCitizenView.mockReturnValue({ view: null, loading: true });
    useTicketMessages.mockReturnValue({ messages: [], loading: false, error: null });
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it.each([
    ["el error", "No tenés permiso", /No tenés permiso/],
    ["el mensaje por defecto", null, /No encontramos este ticket/],
  ])("muestra %s y ofrece volver al ticket", (_case, error, expected) => {
    useTicketCitizenView.mockReturnValue({ view: null, loading: false, error });
    useTicketMessages.mockReturnValue({ messages: [], loading: false, error: null });
    renderPage();
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al ticket/ })).toHaveAttribute("href", "/agente/tickets/7");
  });

  it("muestra la vista de solo lectura y filtra los mensajes internos", async () => {
    useTicketCitizenView.mockReturnValue({ view: { id: 7, publicId: "TK-7", summary: "Resumen" }, loading: false, error: null });
    useTicketMessages.mockReturnValue({
      messages: [
        { id: 1, visibility: "PUBLIC" },
        { id: 2, visibility: "INTERNAL" },
      ],
      loading: false,
      error: "Falla de chat",
    });
    downloadTicketAttachment.mockResolvedValue(new Blob());
    renderPage();
    expect(screen.getByTestId("citizen-view")).toHaveTextContent("Resumen");
    expect(lastViewProps.readOnly).toBe(true);
    expect(lastViewProps.chat).toMatchObject({ items: [{ id: 1, visibility: "PUBLIC" }], canSend: false, error: "Falla de chat" });
    await lastViewProps.attachments.downloadFile({ id: 3 });
    expect(downloadTicketAttachment).toHaveBeenCalledWith(3);
  });
});
