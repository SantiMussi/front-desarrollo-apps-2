import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TicketDetailPage from "../agent/TicketDetailPage";
import { AGENT, authFor, renderWithProviders } from "../../test/renderWithProviders";
import { useStaffTicketDetail } from "../../hooks/useStaffTicketDetail";
import { useTicketMessages } from "../../hooks/useTicketMessages";
import { useResolveTicket } from "../../hooks/useResolveTicket";
import { useRequestTicketInformation } from "../../hooks/useRequestTicketInformation";
import { useRequestTypesCatalog } from "../../hooks/useRequestTypesCatalog";
import * as api from "../../services/apiClient";

vi.mock("../../hooks/useStaffTicketDetail", () => ({ useStaffTicketDetail: vi.fn() }));
vi.mock("../../hooks/useTicketMessages", () => ({ useTicketMessages: vi.fn() }));
vi.mock("../../hooks/useResolveTicket", () => ({ useResolveTicket: vi.fn() }));
vi.mock("../../hooks/useRequestTicketInformation", () => ({ useRequestTicketInformation: vi.fn() }));
vi.mock("../../hooks/useRequestTypesCatalog", () => ({ useRequestTypesCatalog: vi.fn() }));
vi.mock("../../services/apiClient", () => ({
  reviewTicket: vi.fn(),
  updateTicketClassification: vi.fn(),
  routeTicket: vi.fn(),
  startTicketWork: vi.fn(),
  returnTicketToAgent: vi.fn(),
  rejectTicket: vi.fn(),
  cancelTicket: vi.fn(),
  linkTicketDuplicate: vi.fn(),
  uploadTicketAttachment: vi.fn(),
  downloadTicketAttachment: vi.fn(),
  fetchStaffTicketDetail: vi.fn(),
  fetchMyTicketDetail: vi.fn(),
  fetchDuplicateCandidates: vi.fn(),
}));
vi.mock("../../components/ticket/TicketLabelsCard", () => ({
  default: ({ readOnly }) => <div data-testid="labels" data-readonly={String(Boolean(readOnly))} />,
}));

const NOW = new Date("2026-03-31T12:00:00Z");
const HOUR = 3600000;
const inFuture = (ms) => new Date(NOW.getTime() + ms).toISOString();

const httpError = (status, message = "Falló") => Object.assign(new Error(message), { status });

const baseTicket = (overrides = {}) => ({
  id: 5,
  publicId: "TK-5",
  summary: "Luminaria apagada",
  description: "Hace días que no enciende.",
  currentStatus: "REGISTERED",
  currentPriority: "HIGH",
  responsibleAreaId: "M6",
  assignedAgentId: 3,
  estimatedAffectedCount: 1,
  categoryName: "Alumbrado",
  subcategoryName: "Público",
  neighborhoodName: "Palermo",
  requestTypeCode: "LUM",
  requestTypeName: "Luminaria",
  ticketType: "COMPLAINT",
  anonymous: false,
  createdAt: "2026-03-10T12:00:00Z",
  updatedAt: "2026-03-11T12:00:00Z",
  statusChangedAt: "2026-03-11T12:00:00Z",
  attachments: [],
  ticketActivities: [
    { sequence: 1, actionType: "TICKET_CREATED", occurredAt: "2026-03-10T12:00:00Z" },
    { sequence: 2, actionType: "ROUTED", message: "Derivado", reasonCode: "R1", occurredAt: "2026-03-11T12:00:00Z" },
    { sequence: 3, actionType: "ACCION_RARA", occurredAt: "2026-03-12T12:00:00Z" },
  ],
  ...overrides,
});

let reload;
let chat;
let resolveHook;
let infoHook;

const setTicket = (overrides = {}, hook = {}) => {
  useStaffTicketDetail.mockReturnValue({ ticket: baseTicket(overrides), loading: false, error: null, reload, ...hook });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(NOW);
  reload = vi.fn();
  chat = {
    messages: [],
    loading: false,
    error: null,
    send: vi.fn().mockResolvedValue({}),
    edit: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    messageForError: (err) => `Traducido: ${err.message}`,
  };
  resolveHook = { resolve: vi.fn(), resolveSimulated: vi.fn(), loading: false, error: null, reset: vi.fn() };
  infoHook = { requestInformation: vi.fn(), loading: false, error: null, reset: vi.fn() };
  useTicketMessages.mockImplementation(() => chat);
  useResolveTicket.mockImplementation(() => resolveHook);
  useRequestTicketInformation.mockImplementation(() => infoHook);
  useRequestTypesCatalog.mockReturnValue({
    requestTypes: [
      { id: 1, code: "LUM", name: "Luminaria apagada" },
      { id: 2, code: "POD", name: "Poda" },
    ],
  });
  api.fetchMyTicketDetail.mockRejectedValue(httpError(403));
  api.fetchStaffTicketDetail.mockResolvedValue({ publicId: "TK-MAIN" });
  api.fetchDuplicateCandidates.mockResolvedValue([
    { ticketId: 77, publicId: "TK-77", summary: "Otro reclamo", currentStatus: "REGISTERED", createdAt: "2026-03-10T12:00:00Z" },
  ]);
  setTicket();
});
afterEach(() => vi.useRealTimers());

const renderPage = async (auth = authFor({ ...AGENT, citizenId: "agent-citizen", displayName: "Agente Uno" })) => {
  const view = renderWithProviders(<TicketDetailPage />, { auth, route: "/agente/tickets/5", path: "/agente/tickets/:ticketId" });
  await act(async () => {});
  return view;
};

const openMenu = (label) => fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
const pickTransition = async (label, action) => {
  openMenu(label);
  fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(action) }));
  await act(async () => {});
};

describe("TicketDetailPage - estados de carga", () => {
  it("muestra el cargando", async () => {
    setTicket({}, { ticket: null, loading: true });
    const { container } = await renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it.each([
    [null, /Ticket no encontrado/, "Error 404"],
    [{ status: 404 }, /Ticket no encontrado/, "Error 404"],
    [{ status: 403 }, /No tenés acceso a este ticket/, "Error 403"],
  ])("sin ticket muestra el error %j", async (error, title, code) => {
    setTicket({}, { ticket: null, error });
    await renderPage();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(code)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver a tickets/ })).toHaveAttribute("href", "/agente/tickets");
  });
});

describe("TicketDetailPage - cabecera y detalles", () => {
  it("muestra el ticket, el tipo y los datos del panel lateral", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: "Luminaria apagada" })).toBeInTheDocument();
    expect(screen.getByText("TK-5")).toBeInTheDocument();
    expect(screen.getByText("Complaint", { selector: '[role="tooltip"]' })).toBeInTheDocument();
    expect(screen.getByText("Hace días que no enciende.")).toBeInTheDocument();
    expect(screen.getAllByText("Palermo").length).toBeGreaterThan(0);
    expect(screen.getByText("1 persona afectada")).toBeInTheDocument();
    expect(screen.getByText("Agente #3")).toBeInTheDocument();
    expect(screen.getByText("Ciudadano registrado")).toBeInTheDocument();
    expect(screen.getByText("Alumbrado")).toBeInTheDocument();
    expect(screen.getByText("Público")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver como ciudadano/ })).toHaveAttribute("href", "/agente/tickets/5/vista-ciudadano");
    expect(screen.getByTestId("labels")).toHaveAttribute("data-readonly", "false");
  });

  it("usa textos de respaldo para datos faltantes", async () => {
    setTicket({
      description: "",
      neighborhoodName: null,
      categoryName: null,
      subcategoryName: null,
      assignedAgentId: null,
      anonymous: true,
      ticketType: "OTRO",
      estimatedAffectedCount: 3,
      requestTypeCode: "NO_EXISTE",
      requestTypeName: undefined,
    });
    await renderPage();
    expect(screen.getByText("Descripción no disponible desde este endpoint.")).toBeInTheDocument();
    expect(screen.getByText("Ubicación pendiente")).toBeInTheDocument();
    expect(screen.getByText("Sin categoría")).toBeInTheDocument();
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
    expect(screen.getByText("Anónimo")).toBeInTheDocument();
    expect(screen.getByText("3 personas afectadas")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it.each([
    ["REQUEST", "Request"],
    ["INQUIRY", "Question"],
    ["SUGGESTION", "Suggestion"],
  ])("muestra el tipo %s", async (ticketType, label) => {
    setTicket({ ticketType });
    await renderPage();
    expect(screen.getByText(label, { selector: '[role="tooltip"]' })).toBeInTheDocument();
  });

  it("muestra el enlace al ticket principal con su código público", async () => {
    setTicket({ mainTicketId: 9 });
    await renderPage();
    expect(await screen.findByText(/Duplicado de TK-MAIN/)).toBeInTheDocument();
  });

  it("muestra el vínculo sin código público si no se puede resolver el principal", async () => {
    api.fetchStaffTicketDetail.mockRejectedValue(httpError(403));
    setTicket({ mainTicketId: 9 });
    await renderPage();
    expect(await screen.findByRole("link", { name: /Duplicado/ })).toBeInTheDocument();
  });

  it("muestra el vínculo cuando el principal no trae código público", async () => {
    api.fetchStaffTicketDetail.mockResolvedValue({});
    setTicket({ mainTicketId: 9 });
    await renderPage();
    expect(await screen.findByRole("link", { name: "Duplicado" })).toBeInTheDocument();
  });

  it("descarta la resolución del principal si se desmonta antes", async () => {
    let resolve;
    let reject;
    api.fetchStaffTicketDetail.mockReturnValueOnce(new Promise((res) => (resolve = res)));
    setTicket({ mainTicketId: 9 });
    const first = await renderPage();
    first.unmount();
    await act(async () => resolve({ publicId: "X" }));
    api.fetchStaffTicketDetail.mockReturnValueOnce(new Promise((_, rej) => (reject = rej)));
    const second = await renderPage();
    second.unmount();
    await act(async () => reject(new Error("tarde")));
  });

  it("muestra el bloque de escalamiento con y sin datos", async () => {
    setTicket({ escalated: true, escalationReasonCode: "CRITICAL_PRIORITY", escalatedAt: "2026-03-12T12:00:00Z" });
    const first = await renderPage();
    expect(screen.getByText("Ticket escalado")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL_PRIORITY")).toBeInTheDocument();
    first.unmount();
    setTicket({ escalated: true });
    await renderPage();
    expect(screen.getByText("No informado")).toBeInTheDocument();
    expect(screen.queryByText("Escalado", { selector: "dt" })).not.toBeInTheDocument();
  });

  it("muestra el historial de actividades con su etiqueta, mensaje y motivo", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Historial" }));
    expect(screen.getByText("Ticket creado")).toBeInTheDocument();
    expect(screen.getByText(/Derivado al área — "Derivado" — \(motivo: R1\)/)).toBeInTheDocument();
    expect(screen.getByText("ACCION_RARA")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actividad" }));
    expect(screen.getByText("Todavía no hay comentarios en este ticket.")).toBeInTheDocument();
  });

  it("no falla sin actividades", async () => {
    setTicket({ ticketActivities: undefined });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Historial" }));
  });
});

describe("TicketDetailPage - propiedad del ticket (solo lectura)", () => {
  it("mientras verifica no permite actuar", async () => {
    api.fetchMyTicketDetail.mockReturnValue(new Promise(() => {}));
    await renderPage();
    expect(screen.getByText(/Verificando si este ticket es tuyo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registrado/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("labels")).toHaveAttribute("data-readonly", "true");
    expect(screen.getByText(/No podés comentar acá porque este ticket es tuyo/)).toBeInTheDocument();
  });

  it("si es propio bloquea todo y lo explica", async () => {
    api.fetchMyTicketDetail.mockResolvedValue({ id: 5 });
    await renderPage();
    expect(await screen.findByText(/Este ticket es tuyo/)).toBeInTheDocument();
    expect(screen.getByText("Registrado", { selector: "span.rounded-md" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo de solicitud")).toBeDisabled();
    expect(screen.getByLabelText("Prioridad")).toBeDisabled();
    expect(screen.getByTestId("labels")).toHaveAttribute("data-readonly", "true");
    expect(screen.queryByText("Adjuntar archivo")).not.toBeInTheDocument();
  });

  it("ante un error de red queda en solo lectura y permite reintentar", async () => {
    api.fetchMyTicketDetail.mockRejectedValueOnce(httpError(500));
    await renderPage();
    expect(await screen.findByText(/No pudimos confirmar si este ticket es tuyo/)).toBeInTheDocument();
    api.fetchMyTicketDetail.mockRejectedValueOnce(httpError(403));
    fireEvent.click(screen.getByText("Reintentar"));
    await act(async () => {});
    expect(screen.queryByText(/No pudimos confirmar/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Registrado/ })).toBeInTheDocument();
  });

  it("ignora la respuesta de propiedad si se desmonta", async () => {
    let resolve;
    let reject;
    api.fetchMyTicketDetail.mockReturnValueOnce(new Promise((res) => (resolve = res)));
    const first = await renderPage();
    first.unmount();
    await act(async () => resolve({}));
    api.fetchMyTicketDetail.mockReturnValueOnce(new Promise((_, rej) => (reject = rej)));
    const second = await renderPage();
    second.unmount();
    await act(async () => reject(httpError(500)));
  });
});

describe("TicketDetailPage - comentarios", () => {
  const messages = () => [
    { id: 1, authorType: "AGENT", authorId: "other", text: "Mensaje del agente", visibility: "PUBLIC", createdAt: "2026-03-10T12:00:00Z" },
    { id: 2, authorType: "ADMIN", authorId: "x", text: "Nota del admin", visibility: "INTERNAL", createdAt: "2026-03-10T13:00:00Z", updatedAt: "2026-03-10T13:10:00Z" },
    { id: 3, authorType: "AREA_RESPONSIBLE", authorId: "y", text: "Del área", visibility: "PUBLIC", createdAt: "2026-03-10T14:00:00Z" },
    { id: 4, authorType: "CITIZEN", authorId: "c", text: "Del vecino", visibility: "PUBLIC", createdAt: "2026-03-10T15:00:00Z" },
    { id: 5, authorType: "SYSTEM", text: "Ticket derivado", visibility: "PUBLIC", createdAt: "2026-03-10T16:00:00Z" },
    { id: 6, authorType: "AGENT", authorId: "agent-citizen", text: "Mi comentario", visibility: "PUBLIC", createdAt: "2026-03-10T17:00:00Z", updatedAt: "2026-03-10T17:00:00.300Z" },
    { id: 7, authorType: "RARO", authorId: "z", text: "De otro tipo", visibility: "PUBLIC", createdAt: "2026-03-10T18:00:00Z" },
  ];

  it("muestra los mensajes según su autor y visibilidad", async () => {
    chat.messages = messages();
    await renderPage();
    expect(screen.getByText("Mensaje del agente")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Responsable de área")).toBeInTheDocument();
    expect(screen.getByText("Ciudadano registrado", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Ticket derivado")).toBeInTheDocument();
    expect(screen.getByText("Agente Uno")).toBeInTheDocument();
    expect(screen.getByText("Equipo municipal")).toBeInTheDocument();
    expect(screen.getByText("NOTA INTERNA")).toBeInTheDocument();
    expect(screen.getAllByText(/\(editado\)/)).toHaveLength(1);
    expect(screen.getByText("7 comentarios")).toBeInTheDocument();
  });

  it("usa 'Vos' si el usuario no tiene nombre", async () => {
    chat.messages = [messages()[5]];
    await renderPage(authFor({ ...AGENT, displayName: undefined, citizenId: "agent-citizen" }));
    expect(screen.getByText("Vos")).toBeInTheDocument();
  });

  it("muestra el cargando y el error del chat", async () => {
    chat.loading = true;
    const first = await renderPage();
    expect(first.container.querySelectorAll(".animate-spin").length).toBeGreaterThan(0);
    first.unmount();
    chat.loading = false;
    chat.error = "No pudimos cargar";
    await renderPage();
    expect(screen.getByText("No pudimos cargar")).toBeInTheDocument();
  });

  it("envía un comentario público con el botón y vuelve a habilitar el campo", async () => {
    await renderPage();
    const box = screen.getByPlaceholderText("Escribe un comentario o respuesta...");
    const send = screen.getByRole("button", { name: /Enviar/ });
    expect(send).toBeDisabled();
    fireEvent.change(box, { target: { value: "  Hola  " } });
    fireEvent.click(send);
    await act(async () => {});
    expect(chat.send).toHaveBeenCalledWith("PUBLIC", "Hola");
    expect(box).toHaveValue("");
  });

  it("envía una nota interna", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Nota interna" }));
    fireEvent.change(screen.getByPlaceholderText("Agrega una nota para el equipo..."), { target: { value: "reservado" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));
    await act(async () => {});
    expect(chat.send).toHaveBeenCalledWith("INTERNAL", "reservado");
    fireEvent.click(screen.getByRole("button", { name: "Responder al ciudadano" }));
    expect(screen.getByPlaceholderText("Escribe un comentario o respuesta...")).toBeInTheDocument();
  });

  it("muestra el error traducido al fallar el envío", async () => {
    chat.send.mockRejectedValue(new Error("Sin permiso"));
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText("Escribe un comentario o respuesta..."), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));
    await act(async () => {});
    expect(screen.getByText("Traducido: Sin permiso")).toBeInTheDocument();
  });

  it("no envía dos veces mientras hay un envío en curso", async () => {
    let finish;
    chat.send.mockReturnValue(new Promise((res) => (finish = res)));
    await renderPage();
    const box = screen.getByPlaceholderText("Escribe un comentario o respuesta...");
    fireEvent.change(box, { target: { value: "uno" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));
    await act(async () => {});
    expect(box).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Enviar/ }));
    expect(chat.send).toHaveBeenCalledTimes(1);
    await act(async () => finish({}));
  });

  it("edita un comentario propio", async () => {
    chat.messages = [messages()[5]];
    await renderPage();
    fireEvent.click(screen.getByLabelText("Editar comentario"));
    const box = screen.getByDisplayValue("Mi comentario");
    fireEvent.change(box, { target: { value: "  " } });
    expect(screen.getByText("Guardar")).toBeDisabled();
    fireEvent.click(screen.getByText("Guardar"));
    expect(chat.edit).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: " Editado " } });
    fireEvent.click(screen.getByText("Guardar"));
    await act(async () => {});
    expect(chat.edit).toHaveBeenCalledWith(6, "Editado");
    expect(screen.queryByDisplayValue("Editado")).not.toBeInTheDocument();
  });

  it("cancela la edición y muestra el error de guardado", async () => {
    chat.messages = [messages()[5]];
    chat.edit.mockRejectedValue(new Error("No editable"));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Editar comentario"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Guardar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Editar comentario"));
    fireEvent.click(screen.getByText("Guardar"));
    await act(async () => {});
    expect(screen.getByText("Traducido: No editable")).toBeInTheDocument();
  });

  it("borra un comentario propio con confirmación y muestra el error", async () => {
    chat.messages = [messages()[5]];
    chat.remove.mockRejectedValueOnce(new Error("No borrable")).mockResolvedValueOnce(undefined);
    await renderPage();
    fireEvent.click(screen.getByLabelText("Borrar comentario"));
    expect(screen.getByText("¿Borrar este comentario?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("No"));
    expect(screen.queryByText("¿Borrar este comentario?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Borrar comentario"));
    fireEvent.click(screen.getByText("Sí, borrar"));
    await act(async () => {});
    expect(screen.getByText("Traducido: No borrable")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sí, borrar"));
    await act(async () => {});
    expect(chat.remove).toHaveBeenCalledWith(6);
    expect(screen.queryByText("¿Borrar este comentario?")).not.toBeInTheDocument();
  });

  it("no ofrece editar mensajes ajenos ni si el usuario no tiene citizenId", async () => {
    chat.messages = [messages()[0]];
    await renderPage(authFor({ ...AGENT }));
    expect(screen.queryByLabelText("Editar comentario")).not.toBeInTheDocument();
  });
});

describe("TicketDetailPage - transiciones de estado", () => {
  it("empieza el análisis desde Registrado", async () => {
    api.reviewTicket.mockResolvedValue({ currentStatus: "IN_REVIEW", assignedAgentId: 8 });
    await renderPage();
    await pickTransition("Registrado", "Empezar análisis");
    expect(api.reviewTicket).toHaveBeenCalledWith(5);
    expect(reload).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /En revisión/ })).toBeInTheDocument();
  });

  it("mantiene el responsable si el análisis no devuelve uno", async () => {
    api.reviewTicket.mockResolvedValue({ currentStatus: "IN_REVIEW" });
    await renderPage();
    await pickTransition("Registrado", "Empezar análisis");
    expect(screen.getByRole("button", { name: /En revisión/ })).toBeInTheDocument();
  });

  it.each([
    [httpError(409, "Ya no se puede"), "Ya no se puede"],
    [httpError(409, ""), /ya no está en un estado/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos iniciar el análisis/],
  ])("traduce el error del análisis %#", async (error, expected) => {
    api.reviewTicket.mockRejectedValue(error);
    await renderPage();
    await pickTransition("Registrado", "Empezar análisis");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("no inicia dos análisis simultáneos", async () => {
    let finish;
    api.reviewTicket.mockReturnValue(new Promise((res) => (finish = res)));
    await renderPage();
    openMenu("Registrado");
    fireEvent.click(screen.getByRole("menuitem", { name: /Empezar análisis/ }));
    await act(async () => {});
    openMenu("Registrado");
    fireEvent.click(screen.getByRole("menuitem", { name: /Empezar análisis/ }));
    expect(api.reviewTicket).toHaveBeenCalledTimes(1);
    await act(async () => finish({ currentStatus: "IN_REVIEW" }));
  });

  it("vincula un duplicado", async () => {
    api.linkTicketDuplicate.mockResolvedValue({ currentStatus: "DUPLICATE" });
    await renderPage();
    await pickTransition("Registrado", "Marcar como duplicado");
    fireEvent.click(await screen.findByText("TK-77"));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar vínculo/ }));
    await act(async () => {});
    expect(api.linkTicketDuplicate).toHaveBeenCalledWith(5, { mainTicketId: 77 });
    expect(screen.getByRole("button", { name: /Duplicado/ })).toBeInTheDocument();
    expect(screen.queryByText("Vincular a un ticket principal")).not.toBeInTheDocument();
  });

  it("usa DUPLICATE si el backend no informa el estado y muestra los errores de vínculo", async () => {
    api.linkTicketDuplicate.mockRejectedValueOnce(httpError(409, "")).mockResolvedValueOnce({});
    await renderPage();
    await pickTransition("Registrado", "Marcar como duplicado");
    fireEvent.click(await screen.findByText("TK-77"));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar vínculo/ }));
    await act(async () => {});
    expect(screen.getByText(/ya no permite vincularse como duplicado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar vínculo/ }));
    await act(async () => {});
    expect(screen.queryByText("Vincular a un ticket principal")).not.toBeInTheDocument();
  });

  it.each([
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(400, ""), /revisá la selección/],
    [httpError(404), /No encontramos alguno de los tickets/],
    [httpError(401), /sesión no es válida/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos vincular el ticket/],
  ])("traduce el error de vínculo %#", async (error, expected) => {
    api.linkTicketDuplicate.mockRejectedValue(error);
    await renderPage();
    await pickTransition("Registrado", "Marcar como duplicado");
    fireEvent.click(await screen.findByText("TK-77"));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar vínculo/ }));
    await act(async () => {});
    expect(within(screen.getByRole("dialog")).getByText(expected)).toBeInTheDocument();
  });

  it("cancela desde Registrado eligiendo un motivo", async () => {
    api.cancelTicket.mockResolvedValue({ currentStatus: "CANCELLED" });
    await renderPage();
    await pickTransition("Registrado", "Cancelar ticket");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná un motivo…"));
    fireEvent.click(screen.getByRole("option", { name: "Otro" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "Duplicado real" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    await act(async () => {});
    expect(api.cancelTicket).toHaveBeenCalledWith(5, { reasonCode: "OTHER", publicMessage: "Duplicado real", internalMessage: "" });
    expect(reload).toHaveBeenCalled();
  });

  it.each([
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(400, ""), /Faltan datos obligatorios/],
    [httpError(403), /No tenés permiso/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(500), /No pudimos registrar la acción/],
  ])("traduce el error de la acción con motivo %#", async (error, expected) => {
    api.cancelTicket.mockRejectedValue(error);
    await renderPage();
    await pickTransition("Registrado", "Cancelar ticket");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná un motivo…"));
    fireEvent.click(screen.getByRole("option", { name: "Otro" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "msg" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    await act(async () => {});
    expect(within(screen.getByRole("dialog")).getByText(expected)).toBeInTheDocument();
  });

  it("deriva el ticket al área con un comentario", async () => {
    setTicket({ currentStatus: "IN_REVIEW", responsibleAreaId: "M3" });
    api.routeTicket.mockResolvedValue({ currentStatus: "ROUTED" });
    await renderPage();
    await pickTransition("En revisión", "Derivar al área");
    expect(within(screen.getByRole("dialog")).getByText(/Obras Públicas/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Mensaje visible para el ciudadano…"), { target: { value: "Derivado a obras" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar derivación" }));
    await act(async () => {});
    expect(api.routeTicket).toHaveBeenCalledWith(5);
    expect(screen.getByText("Derivado a obras")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Derivado/ })).toBeInTheDocument();
  });

  it("deriva sin comentario y muestra el error de derivación", async () => {
    setTicket({ currentStatus: "IN_REVIEW", responsibleAreaId: "M99" });
    api.routeTicket.mockRejectedValueOnce(new Error("No derivable")).mockRejectedValueOnce({}).mockResolvedValueOnce({ currentStatus: "ROUTED" });
    await renderPage();
    await pickTransition("En revisión", "Derivar al área");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar derivación" }));
    await act(async () => {});
    expect(screen.getByText("No derivable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar derivación" }));
    await act(async () => {});
    expect(screen.getByText("No pudimos derivar este ticket.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar derivación" }));
    await act(async () => {});
    expect(screen.queryByText("Derivar ticket")).not.toBeInTheDocument();
  });

  it("no deriva dos veces a la vez y permite cancelar el diálogo", async () => {
    setTicket({ currentStatus: "IN_REVIEW" });
    let finish;
    api.routeTicket.mockReturnValue(new Promise((res) => (finish = res)));
    await renderPage();
    await pickTransition("En revisión", "Derivar al área");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar derivación" }));
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /Derivando/ }));
    expect(api.routeTicket).toHaveBeenCalledTimes(1);
    await act(async () => finish({ currentStatus: "ROUTED" }));
    await pickTransition("Derivado", "Devolver al agente");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("solicita información al ciudadano", async () => {
    setTicket({ currentStatus: "IN_REVIEW" });
    infoHook.requestInformation.mockResolvedValue({ ok: true });
    await renderPage();
    await pickTransition("En revisión", "Solicitar información");
    expect(infoHook.reset).toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText(/Explicá qué información/), { target: { value: "¿Foto?" } });
    fireEvent.click(screen.getByRole("button", { name: /Solicitar información/ }));
    await act(async () => {});
    expect(infoHook.requestInformation).toHaveBeenCalledWith(5, { messageForCitizen: "¿Foto?", internalMessage: "" });
    expect(screen.getByRole("button", { name: /Pendiente de información/ })).toBeInTheDocument();
  });

  it("mantiene el diálogo de información abierto si falla", async () => {
    setTicket({ currentStatus: "IN_REVIEW" });
    infoHook.requestInformation.mockResolvedValue(null);
    await renderPage();
    await pickTransition("En revisión", "Solicitar información");
    fireEvent.change(screen.getByPlaceholderText(/Explicá qué información/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Solicitar información/ }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: /Solicitar información/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("inicia el trabajo del área desde Derivado y muestra el error", async () => {
    setTicket({ currentStatus: "ROUTED", responsibleAreaId: "M3" });
    api.startTicketWork.mockRejectedValueOnce(new Error("Sin permiso")).mockRejectedValueOnce({}).mockResolvedValueOnce({ currentStatus: "IN_PROGRESS" });
    await renderPage();
    await pickTransition("Derivado", "Iniciar trabajo del área");
    expect(api.startTicketWork).toHaveBeenCalledWith(5, "M3");
    expect(screen.getByText("Sin permiso")).toBeInTheDocument();
    await pickTransition("Derivado", "Iniciar trabajo del área");
    expect(screen.getByText(/No pudimos iniciar el trabajo/)).toBeInTheDocument();
    await pickTransition("Derivado", "Iniciar trabajo del área");
    expect(screen.getByRole("button", { name: /En gestión/ })).toBeInTheDocument();
  });

  it("no inicia el trabajo dos veces a la vez", async () => {
    setTicket({ currentStatus: "ROUTED" });
    let finish;
    api.startTicketWork.mockReturnValue(new Promise((res) => (finish = res)));
    await renderPage();
    await pickTransition("Derivado", "Iniciar trabajo del área");
    await pickTransition("Derivado", "Iniciar trabajo del área");
    expect(api.startTicketWork).toHaveBeenCalledTimes(1);
    await act(async () => finish({ currentStatus: "IN_PROGRESS" }));
  });

  it("devuelve un ticket derivado al agente con un motivo", async () => {
    setTicket({ currentStatus: "ROUTED", responsibleAreaId: "M3" });
    api.returnTicketToAgent.mockResolvedValue({ currentStatus: "IN_REVIEW" });
    await renderPage();
    await pickTransition("Derivado", "Devolver al agente");
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByPlaceholderText("Ej.: AREA_NOT_RESPONSIBLE"), { target: { value: "WRONG_AREA" } });
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "Área equivocada" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar devolución" }));
    await act(async () => {});
    expect(api.returnTicketToAgent).toHaveBeenCalledWith(5, "M3", { reasonCode: "WRONG_AREA", publicMessage: "Área equivocada", internalMessage: "" });
  });

  it("rechaza una solicitud en gestión", async () => {
    setTicket({ currentStatus: "IN_PROGRESS", responsibleAreaId: "M3" });
    api.rejectTicket.mockResolvedValue({ currentStatus: "CANCELLED" });
    await renderPage();
    await pickTransition("En gestión", "Cancelar ticket");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná un motivo…"));
    fireEvent.click(screen.getByRole("option", { name: "Fuera de alcance del área" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "Fuera de alcance" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    await act(async () => {});
    expect(api.rejectTicket).toHaveBeenCalledWith(5, "M3", { reasonCode: "OUT_OF_SCOPE", publicMessage: "Fuera de alcance", internalMessage: "" });
  });

  it("cancela desde Pendiente de información", async () => {
    setTicket({ currentStatus: "PENDING_INFORMATION" });
    await renderPage();
    await pickTransition("Pendiente de información", "Cancelar ticket");
    expect(screen.getByText("Cancelar ticket", { selector: "h2" })).toBeInTheDocument();
  });

  it("no envía dos acciones con motivo a la vez", async () => {
    let finish;
    api.cancelTicket.mockReturnValue(new Promise((res) => (finish = res)));
    await renderPage();
    await pickTransition("Registrado", "Cancelar ticket");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná un motivo…"));
    fireEvent.click(screen.getByRole("option", { name: "Otro" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "msg" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar cancelación" }));
    await act(async () => {});
    fireEvent.click(within(dialog).getByRole("button", { name: /Enviando/ }));
    expect(api.cancelTicket).toHaveBeenCalledTimes(1);
    await act(async () => finish({ currentStatus: "CANCELLED" }));
  });

  it("avisa cuando la transición no tiene endpoint", async () => {
    setTicket({ currentStatus: "DUPLICATE" });
    await renderPage();
    await pickTransition("Duplicado", "Cerrar con el caso principal");
    expect(screen.getByText(/todavía no tiene un endpoint en el back/)).toBeInTheDocument();
  });
});

describe("TicketDetailPage - resolución", () => {
  it("resuelve manualmente cuando el área es M2 y está en gestión", async () => {
    setTicket({ currentStatus: "IN_PROGRESS", responsibleAreaId: "M2" });
    resolveHook.resolve.mockResolvedValue({ resolvedAt: "2026-03-31T12:00:00Z" });
    await renderPage();
    await pickTransition("En gestión", "Completar solicitud");
    expect(resolveHook.reset).toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccionar…"));
    fireEvent.click(screen.getByRole("option", { name: "Acción completada" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "Listo" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar resolución" }));
    await act(async () => {});
    expect(resolveHook.resolve).toHaveBeenCalledWith(5, { type: "ACTION_COMPLETED", publicMessage: "Listo", internalMessage: "" });
    expect(screen.getByText("Ticket resuelto: Listo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resuelto/ })).toBeInTheDocument();
  });

  it("mantiene abierto el diálogo si la resolución manual falla", async () => {
    setTicket({ currentStatus: "IN_PROGRESS", responsibleAreaId: "M2" });
    resolveHook.resolve.mockResolvedValue(null);
    await renderPage();
    await pickTransition("En gestión", "Completar solicitud");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccionar…"));
    fireEvent.click(screen.getByRole("option", { name: "Acción completada" }));
    fireEvent.change(within(dialog).getByPlaceholderText(/Explicá brevemente/), { target: { value: "Listo" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar resolución" }));
    await act(async () => {});
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /En gestión/ })).toBeInTheDocument();
  });

  it("registra la respuesta simulada del área", async () => {
    setTicket({ currentStatus: "ROUTED", responsibleAreaId: "M3" });
    resolveHook.resolveSimulated.mockResolvedValue({ statusChangedAt: "2026-03-31T12:00:00Z" });
    await renderPage();
    await pickTransition("Derivado", "Marcar caso como resuelto");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná la respuesta del área…"));
    fireEvent.click(screen.getByRole("option", { name: "El área ejecutó el trabajo solicitado" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Registrar respuesta del área" }));
    await act(async () => {});
    expect(resolveHook.resolveSimulated).toHaveBeenCalledWith(5, expect.objectContaining({ moduleId: "M3", type: "ACTION_COMPLETED" }));
    expect(screen.getByRole("button", { name: /Resuelto/ })).toBeInTheDocument();
  });

  it("mantiene abierto el diálogo si la respuesta simulada falla", async () => {
    setTicket({ currentStatus: "ROUTED", responsibleAreaId: "M3" });
    resolveHook.resolveSimulated.mockResolvedValue(null);
    await renderPage();
    await pickTransition("Derivado", "Marcar caso como resuelto");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("Seleccioná la respuesta del área…"));
    fireEvent.click(screen.getByRole("option", { name: "El área ejecutó el trabajo solicitado" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Registrar respuesta del área" }));
    await act(async () => {});
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("explica que el área externa resuelve desde Derivado o En gestión", async () => {
    setTicket({ currentStatus: "ROUTED", responsibleAreaId: "M2" });
    await renderPage();
    await pickTransition("Derivado", "Marcar caso como resuelto");
    expect(screen.getByText(/debe estar En gestión/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar" })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("TicketDetailPage - clasificación, prioridad y adjuntos", () => {
  const classificationSelect = () => screen.getByLabelText("Tipo de solicitud");

  it("permite corregir la clasificación durante la revisión inicial", async () => {
    setTicket({ currentStatus: "IN_REVIEW" });
    api.updateTicketClassification.mockResolvedValue({ responsibleAreaId: "M3", currentPriority: "LOW", estimatedAffectedCount: 4 });
    await renderPage();
    expect(classificationSelect()).toBeEnabled();
    fireEvent.click(classificationSelect());
    fireEvent.click(screen.getByRole("option", { name: "Poda" }));
    await act(async () => {});
    expect(api.updateTicketClassification).toHaveBeenCalledWith(5, 2);
    expect(reload).toHaveBeenCalled();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("usa 0 afectados si la clasificación no informa una estimación", async () => {
    setTicket({ currentStatus: "IN_REVIEW", estimatedAffectedCount: undefined });
    api.updateTicketClassification.mockResolvedValue({ responsibleAreaId: "M3", currentPriority: "LOW" });
    await renderPage();
    expect(screen.getByText("0 personas afectadas")).toBeInTheDocument();
    fireEvent.click(classificationSelect());
    fireEvent.click(screen.getByRole("option", { name: "Poda" }));
    await act(async () => {});
    expect(screen.getByText("0 personas afectadas")).toBeInTheDocument();
  });

  it.each([
    [httpError(409, "Conflicto"), "Conflicto"],
    [httpError(400, ""), /no es válido/],
    [httpError(404), "No encontramos el ticket."],
    [httpError(401), /sesión no es válida/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos corregir la clasificación/],
  ])("traduce el error de clasificación %#", async (error, expected) => {
    setTicket({ currentStatus: "IN_REVIEW" });
    api.updateTicketClassification.mockRejectedValue(error);
    await renderPage();
    fireEvent.click(classificationSelect());
    fireEvent.click(screen.getByRole("option", { name: "Poda" }));
    await act(async () => {});
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("ignora la selección vacía (el tipo actual) sin llamar al backend", async () => {
    setTicket({ currentStatus: "IN_REVIEW", requestTypeCode: "SIN_CATALOGO", requestTypeName: "" });
    await renderPage();
    fireEvent.click(classificationSelect());
    fireEvent.click(screen.getByRole("option", { name: "—" }));
    await act(async () => {});
    expect(api.updateTicketClassification).not.toHaveBeenCalled();
  });

  it.each([
    [{ currentStatus: "REGISTERED" }, /revisión inicial/],
    [{ currentStatus: "ROUTED" }, /No se puede reclasificar en este estado/],
    [{ currentStatus: "IN_REVIEW", classificationFinalizedAt: "2026-03-12T12:00:00Z" }, /fijada una vez que el ticket fue derivado/],
  ])("bloquea la clasificación %j", async (overrides, message) => {
    setTicket(overrides);
    await renderPage();
    expect(classificationSelect()).toBeDisabled();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("cambia la prioridad localmente", async () => {
    await renderPage();
    fireEvent.click(screen.getByLabelText("Prioridad"));
    fireEvent.click(screen.getByRole("option", { name: "Crítica" }));
    expect(screen.getByLabelText("Prioridad")).toHaveTextContent("Crítica");
    expect(screen.getByLabelText("Área responsable")).toBeDisabled();
  });

  it("sube y descarga adjuntos", async () => {
    api.uploadTicketAttachment.mockResolvedValue({ id: 3, fileName: "nuevo.png" });
    api.downloadTicketAttachment.mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    setTicket({ attachments: [{ id: 1, fileName: "foto.png", contentType: "image/png", sizeBytes: 10 }] });
    const { container } = await renderPage();
    fireEvent.click(screen.getByLabelText("Descargar foto.png"));
    await act(async () => {});
    expect(api.downloadTicketAttachment).toHaveBeenCalledWith(1);
    const input = container.querySelector('input[type="file"]');
    const file = new File(["x"], "nuevo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await act(async () => {});
    expect(api.uploadTicketAttachment).toHaveBeenCalledWith(5, file);
    click.mockRestore();
  });
});

describe("TicketDetailPage - SLA", () => {
  it("muestra la cuenta regresiva de resolución y primera respuesta en plazo", async () => {
    setTicket({ resolutionDueAt: inFuture(50 * HOUR), firstResponseDueAt: inFuture(25 * HOUR) });
    await renderPage();
    expect(screen.getByLabelText(/Tiempo restante 2 días y 2 horas$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiempo restante 1 día y 1 hora para la primera respuesta/)).toBeInTheDocument();
    expect(screen.getByText("Primera respuesta")).toBeInTheDocument();
    expect(screen.getByText(/Vencimiento de resolución/)).toBeInTheDocument();
    expect(screen.getByText(/Vencimiento de primera respuesta/)).toBeInTheDocument();
  });

  it("marca como vencidos los plazos pasados", async () => {
    setTicket({ resolutionDueAt: inFuture(-5 * HOUR), firstResponseDueAt: inFuture(-30 * HOUR) });
    await renderPage();
    expect(screen.getByLabelText(/Vencido hace 0 días y 5 horas$/)).toBeInTheDocument();
    expect(screen.getByText("Primera respuesta vencida")).toBeInTheDocument();
    expect(screen.getByText("SLA vencido", { selector: "div" })).toBeInTheDocument();
  });

  it("usa las banderas del backend cuando no hay fechas", async () => {
    setTicket({ firstResponseBreached: true, slaBreached: true, resolutionDueAt: undefined, firstResponseDueAt: undefined });
    await renderPage();
    expect(screen.getByText("Primera respuesta vencida")).toBeInTheDocument();
    expect(screen.getAllByText("Sin fecha de vencimiento disponible")).toHaveLength(2);
    expect(screen.getByText("SLA vencido", { selector: "div" })).toBeInTheDocument();
  });

  it("avisa cuando el plazo está próximo a vencer", async () => {
    setTicket({ firstResponseNearDue: true, slaNearDue: true, resolutionDueAt: inFuture(5 * HOUR), firstResponseDueAt: inFuture(3 * HOUR) });
    await renderPage();
    expect(screen.getByText("Primera respuesta próxima a vencer")).toBeInTheDocument();
    expect(screen.getByText("Próximo a vencer")).toBeInTheDocument();
  });

  it.each([
    ["RESOLVED", /SLA de resolución completado/],
    ["CANCELLED", /SLA finalizado por cancelación/],
  ])("muestra el SLA finalizado para %s", async (currentStatus, message) => {
    setTicket({ currentStatus, resolutionDueAt: inFuture(5 * HOUR) });
    await renderPage();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText(/Vencimiento original/)).toBeInTheDocument();
    expect(screen.getByText(/Finalizado:/)).toBeInTheDocument();
  });

  it("muestra el SLA finalizado sin fecha de vencimiento original", async () => {
    setTicket({ currentStatus: "CLOSED", resolutionDueAt: undefined });
    await renderPage();
    expect(screen.getByText(/SLA de resolución completado/)).toBeInTheDocument();
    expect(screen.queryByText(/Vencimiento original/)).not.toBeInTheDocument();
  });

  it("actualiza la cuenta regresiva cada minuto y limpia el temporizador", async () => {
    setTicket({ resolutionDueAt: inFuture(2.5 * HOUR) });
    const { unmount } = await renderPage();
    expect(screen.getByLabelText(/Tiempo restante 0 días y 2 horas$/)).toBeInTheDocument();
    await act(async () => {
      vi.setSystemTime(new Date(NOW.getTime() + HOUR));
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByLabelText(/Tiempo restante 0 días y 1 hora$/)).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("no crea temporizador si no hay fechas de SLA", async () => {
    setTicket({ resolutionDueAt: undefined, firstResponseDueAt: undefined });
    await renderPage();
    expect(vi.getTimerCount()).toBe(0);
  });
});
