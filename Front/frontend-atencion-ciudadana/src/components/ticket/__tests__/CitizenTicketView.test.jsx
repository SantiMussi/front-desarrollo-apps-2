import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CitizenTicketView from "../CitizenTicketView";

const baseTicket = (overrides = {}) => ({
  id: 5,
  publicId: "TK-000012",
  currentStatus: "IN_PROGRESS",
  summary: "Luminaria apagada",
  description: "Hace días que no enciende.",
  ticketType: "COMPLAINT",
  createdAt: "2026-03-10T12:00:00Z",
  statusChangedAt: "2026-03-11T15:30:00Z",
  requestType: { name: "Luminaria" },
  category: { name: "Alumbrado" },
  subcategory: { name: "Público" },
  neighborhoodName: "Belgrano",
  attachments: [],
  history: [
    { id: "h1", newStatus: "REGISTERED", occurredAt: "2026-03-10T12:00:00Z", message: "Reclamo creado" },
    { id: "h2", newStatus: "IN_PROGRESS", occurredAt: "2026-03-11T15:30:00Z", message: null },
  ],
  rating: null,
  ...overrides,
});

const makeActions = (overrides = {}) => ({
  confirmResolution: vi.fn().mockResolvedValue(true),
  requestReopen: vi.fn().mockResolvedValue(true),
  requestCancel: vi.fn().mockResolvedValue(true),
  answerInformation: vi.fn().mockResolvedValue(true),
  rateAttention: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const makeChat = (overrides = {}) => ({
  items: [],
  loading: false,
  error: null,
  canSend: true,
  currentAuthorId: "me",
  onSend: vi.fn().mockResolvedValue(undefined),
  onEdit: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const view = (props = {}) => render(<CitizenTicketView ticket={baseTicket()} {...props} />, { wrapper: MemoryRouter });

describe("CitizenTicketView - cabecera y detalle", () => {
  it("muestra título, tipo, número corto, estado y datos", () => {
    view({ backTo: "/mis-reclamos", backLabel: "Volver" });
    expect(screen.getByRole("heading", { name: "Luminaria apagada" })).toBeInTheDocument();
    expect(screen.getByText("Reclamo")).toBeInTheDocument();
    expect(screen.getByText("Ticket #12")).toBeInTheDocument();
    expect(screen.getAllByText("En gestión").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Hace días que no enciende.")).toBeInTheDocument();
    expect(screen.getAllByText("Luminaria").length).toBeGreaterThan(0);
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver/ })).toHaveAttribute("href", "/mis-reclamos");
    expect(screen.getByText("Reclamo creado")).toBeInTheDocument();
  });

  it("usa valores de respaldo para datos faltantes", () => {
    view({
      ticket: baseTicket({
        publicId: "ABC",
        ticketType: "OTRO",
        description: "",
        requestType: null,
        category: null,
        subcategory: null,
        neighborhoodName: null,
        location: null,
        statusChangedAt: null,
        createdAt: null,
        currentStatus: "ESTADO_RARO",
        history: [{ id: "x", newStatus: "ESTADO_RARO", occurredAt: null }],
      }),
    });
    expect(screen.getByText("Descripción no disponible.")).toBeInTheDocument();
    expect(screen.getByText("Ticket #ABC")).toBeInTheDocument();
    expect(screen.getAllByText("ESTADO_RARO").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(3);
    expect(screen.queryByText("Reclamo")).not.toBeInTheDocument();
  });

  it("prefiere la dirección exacta sobre el barrio", () => {
    view({ ticket: baseTicket({ location: { addressLine: "Av. Cabildo 2000" } }) });
    expect(screen.getByText("Av. Cabildo 2000")).toBeInTheDocument();
  });

  it.each([
    ["REQUEST", "Solicitud"],
    ["INQUIRY", "Pregunta"],
    ["SUGGESTION", "Sugerencia"],
  ])("muestra el tipo %s", (ticketType, label) => {
    view({ ticket: baseTicket({ ticketType }) });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("muestra la vista de solo lectura sin acciones", () => {
    view({ readOnly: true, ticket: baseTicket({ currentStatus: "REGISTERED" }), actions: makeActions() });
    expect(screen.getByText(/Vista de solo lectura/)).toBeInTheDocument();
    expect(screen.queryByText("Cancelar reclamo")).not.toBeInTheDocument();
    expect(screen.getByText(/No podés enviar mensajes desde la vista de solo lectura/)).toBeInTheDocument();
  });
});

describe("CitizenTicketView - cancelar reclamo", () => {
  const registered = () => baseTicket({ currentStatus: "REGISTERED" });

  it("sólo se ofrece en estado Registrado", () => {
    view({ ticket: baseTicket({ currentStatus: "IN_REVIEW" }) });
    expect(screen.queryByText("Cancelar reclamo")).not.toBeInTheDocument();
  });

  it("cancela con comentario y cierra el panel", async () => {
    const actions = makeActions();
    view({ ticket: registered(), actions });
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    expect(screen.getByText("¿Seguro que querés cancelar este reclamo?")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/ya no es necesario/), { target: { value: " ya lo resolví " } });
    fireEvent.click(screen.getByText("Confirmar cancelación"));
    await waitFor(() => expect(actions.requestCancel).toHaveBeenCalledWith("ya lo resolví"));
    await waitFor(() => expect(screen.queryByText("¿Seguro que querés cancelar este reclamo?")).not.toBeInTheDocument());
  });

  it("envía null sin comentario y mantiene el panel abierto si falla", async () => {
    const actions = makeActions({ requestCancel: vi.fn().mockResolvedValue(false) });
    view({ ticket: registered(), actions, actionError: "No se pudo cancelar" });
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    fireEvent.click(screen.getByText("Confirmar cancelación"));
    await waitFor(() => expect(actions.requestCancel).toHaveBeenCalledWith(null));
    expect(screen.getByText("No se pudo cancelar")).toBeInTheDocument();
    expect(screen.getByText("¿Seguro que querés cancelar este reclamo?")).toBeInTheDocument();
  });

  it("permite volver atrás y descarta el comentario", () => {
    view({ ticket: registered(), actions: makeActions() });
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    fireEvent.change(screen.getByPlaceholderText(/ya no es necesario/), { target: { value: "x" } });
    fireEvent.click(screen.getByText("Volver"));
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    expect(screen.getByPlaceholderText(/ya no es necesario/)).toHaveValue("");
  });

  it("deshabilita los botones mientras trabaja", () => {
    view({ ticket: registered(), actions: makeActions(), actionLoading: true });
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    expect(screen.getByText("Confirmar cancelación").closest("button")).toBeDisabled();
    expect(screen.getByText("Volver")).toBeDisabled();
  });

  it("no falla sin actions", async () => {
    view({ ticket: registered() });
    fireEvent.click(screen.getByText("Cancelar reclamo"));
    fireEvent.click(screen.getByText("Confirmar cancelación"));
    expect(screen.getByText("¿Seguro que querés cancelar este reclamo?")).toBeInTheDocument();
  });
});

describe("CitizenTicketView - ticket resuelto", () => {
  const resolved = (extra = {}) => baseTicket({ currentStatus: "RESOLVED", resolutionConfirmationDueAt: "2026-04-01T00:00:00Z", ...extra });

  it("permite confirmar la solución", () => {
    const actions = makeActions();
    view({ ticket: resolved(), actions });
    expect(screen.getByText(/marcó este reclamo como Resuelto/)).toBeInTheDocument();
    expect(screen.getByText(/Revisá la solución/)).toBeInTheDocument();
    expect(screen.getByText(/Si no respondés antes del/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Confirmar solución"));
    expect(actions.confirmResolution).toHaveBeenCalledOnce();
  });

  it("no menciona la fecha límite si no existe", () => {
    view({ ticket: resolved({ resolutionConfirmationDueAt: null }), actions: makeActions() });
    expect(screen.queryByText(/se cerrará automáticamente/)).not.toBeInTheDocument();
  });

  it("reabre con un motivo obligatorio", async () => {
    const actions = makeActions();
    view({ ticket: resolved(), actions, actionError: "Error al reabrir" });
    fireEvent.click(screen.getByText("Reabrir ticket"));
    const confirm = screen.getByText("Confirmar reapertura").closest("button");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/volvió a aparecer/), { target: { value: " Sigue roto " } });
    fireEvent.click(confirm);
    await waitFor(() => expect(actions.requestReopen).toHaveBeenCalledWith("Sigue roto"));
    await waitFor(() => expect(screen.queryByText("Confirmar reapertura")).not.toBeInTheDocument());
  });

  it("mantiene abierto el panel de reapertura si falla y permite cancelarlo", async () => {
    const actions = makeActions({ requestReopen: vi.fn().mockResolvedValue(false) });
    view({ ticket: resolved(), actions, actionError: "No se pudo" });
    fireEvent.click(screen.getByText("Reabrir ticket"));
    fireEvent.change(screen.getByPlaceholderText(/volvió a aparecer/), { target: { value: "x" } });
    fireEvent.click(screen.getByText("Confirmar reapertura"));
    await waitFor(() => expect(actions.requestReopen).toHaveBeenCalled());
    expect(screen.getByText("Confirmar reapertura")).toBeInTheDocument();
    expect(screen.getAllByText("No se pudo").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.getByText("Confirmar solución")).toBeInTheDocument();
  });

  it("deshabilita los botones mientras trabaja", () => {
    view({ ticket: resolved(), actions: makeActions(), actionLoading: true });
    expect(screen.getByText("Confirmar solución").closest("button")).toBeDisabled();
    expect(screen.getByText("Reabrir ticket").closest("button")).toBeDisabled();
    fireEvent.click(screen.getByText("Reabrir ticket"));
  });

  it("deshabilita los botones de reapertura mientras trabaja", () => {
    const actions = makeActions();
    const { rerender } = view({ ticket: resolved(), actions });
    fireEvent.click(screen.getByText("Reabrir ticket"));
    fireEvent.change(screen.getByPlaceholderText(/volvió a aparecer/), { target: { value: "motivo" } });
    rerender(<CitizenTicketView ticket={resolved()} actions={actions} actionLoading />);
    expect(screen.getByText("Confirmar reapertura").closest("button")).toBeDisabled();
    expect(screen.getByText("Cancelar")).toBeDisabled();
  });

  it("en solo lectura describe lo que puede hacer el ciudadano", () => {
    view({ ticket: resolved(), readOnly: true, actions: makeActions(), actionError: "no se muestra" });
    expect(screen.getByText(/El ciudadano puede confirmar/)).toBeInTheDocument();
    expect(screen.getByText(/Si no responde antes del/)).toBeInTheDocument();
    expect(screen.queryByText("Confirmar solución")).not.toBeInTheDocument();
    expect(screen.queryByText("no se muestra")).not.toBeInTheDocument();
  });

  it("no falla sin actions", async () => {
    view({ ticket: resolved() });
    fireEvent.click(screen.getByText("Confirmar solución"));
    fireEvent.click(screen.getByText("Reabrir ticket"));
    fireEvent.change(screen.getByPlaceholderText(/volvió a aparecer/), { target: { value: "x" } });
    fireEvent.click(screen.getByText("Confirmar reapertura"));
  });
});

describe("CitizenTicketView - información pendiente", () => {
  const pending = (extra = {}) =>
    baseTicket({
      currentStatus: "PENDING_INFORMATION",
      pendingInformationRequest: { messageForCitizen: "¿Podés mandar una foto?", dueAt: "2026-04-01T12:00:00Z" },
      ...extra,
    });

  it("muestra el pedido y responde con texto", async () => {
    const actions = makeActions();
    view({ ticket: pending(), actions });
    expect(screen.getByText("¿Podés mandar una foto?")).toBeInTheDocument();
    expect(screen.getByText(/Plazo para responder/)).toBeInTheDocument();
    const send = screen.getByText("Enviar respuesta").closest("button");
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Escribí la información solicitada/), { target: { value: " Acá va " } });
    fireEvent.click(send);
    await waitFor(() => expect(actions.answerInformation).toHaveBeenCalledWith("Acá va", []));
    await waitFor(() => expect(screen.getByPlaceholderText(/Escribí la información solicitada/)).toHaveValue(""));
  });

  it("responde sólo con archivos, permite quitarlos y conserva el estado si falla", async () => {
    const actions = makeActions({ answerInformation: vi.fn().mockResolvedValue(false) });
    const { container } = view({ ticket: pending(), actions, actionError: "Falló el envío" });
    const input = container.querySelector('input[type="file"]');
    const first = new File(["a"], "a.png");
    const second = new File(["b"], "b.png");
    fireEvent.change(input, { target: { files: [] } });
    fireEvent.change(input, { target: { files: [first, second] } });
    expect(screen.getByText("a.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Quitar b.png"));
    expect(screen.queryByText("b.png")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Enviar respuesta"));
    await waitFor(() => expect(actions.answerInformation).toHaveBeenCalledWith(null, [first]));
    expect(screen.getByText("a.png")).toBeInTheDocument();
    expect(screen.getByText("Falló el envío")).toBeInTheDocument();
  });

  it("textos por defecto según la vista", () => {
    const { unmount } = view({ ticket: pending({ pendingInformationRequest: null }), actions: makeActions() });
    expect(screen.getByText(/Respondé para que podamos continuar/)).toBeInTheDocument();
    expect(screen.queryByText(/Plazo para responder/)).not.toBeInTheDocument();
    unmount();
    view({ ticket: pending({ pendingInformationRequest: null }), readOnly: true });
    expect(screen.getByText(/El ciudadano necesita responder/)).toBeInTheDocument();
    expect(screen.queryByText("Enviar respuesta")).not.toBeInTheDocument();
  });

  it("no envía si no hay texto ni archivos y no falla sin actions", () => {
    view({ ticket: pending() });
    fireEvent.change(screen.getByPlaceholderText(/Escribí la información solicitada/), { target: { value: "algo" } });
    fireEvent.click(screen.getByText("Enviar respuesta"));
  });

  it("deshabilita el envío mientras trabaja", () => {
    view({ ticket: pending(), actions: makeActions(), actionLoading: true });
    expect(screen.getByText("Enviar respuesta").closest("button")).toBeDisabled();
  });
});

describe("CitizenTicketView - ticket cerrado y calificación", () => {
  const closed = (extra = {}) => baseTicket({ currentStatus: "CLOSED", ...extra });

  it("informa el cierre según la vista", () => {
    const { unmount } = view({ ticket: closed(), actions: makeActions() });
    expect(screen.getByText(/Confirmaste la solución/)).toBeInTheDocument();
    unmount();
    view({ ticket: closed(), readOnly: true });
    expect(screen.getByText(/El ciudadano confirmó la solución/)).toBeInTheDocument();
    expect(screen.queryByText("¿Cómo calificarías la atención?")).not.toBeInTheDocument();
  });

  it("muestra la calificación existente", () => {
    view({ ticket: closed({ rating: 4 }), actions: makeActions() });
    expect(screen.getByText(/Calificaste la atención con 4\/5/)).toBeInTheDocument();
  });

  it("califica con estrellas y comentario", () => {
    const actions = makeActions();
    view({ ticket: closed(), actions });
    expect(screen.queryByPlaceholderText(/Contanos más/)).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByLabelText("2 estrellas"));
    fireEvent.mouseLeave(screen.getByLabelText("2 estrellas").parentElement);
    fireEvent.click(screen.getByLabelText("4 estrellas"));
    fireEvent.change(screen.getByPlaceholderText(/Contanos más/), { target: { value: " Muy buena " } });
    fireEvent.click(screen.getByText("Enviar calificación"));
    expect(actions.rateAttention).toHaveBeenCalledWith(4, "Muy buena");
  });

  it("muestra el error, el estado de envío y permite descartar la encuesta", () => {
    const actions = makeActions();
    const { rerender } = view({ ticket: closed(), actions, actionError: "Ya calificaste" });
    fireEvent.click(screen.getByLabelText("3 estrellas"));
    expect(screen.getByText("Ya calificaste")).toBeInTheDocument();
    rerender(<CitizenTicketView ticket={closed()} actions={actions} actionLoading actionError="Ya calificaste" />);
    expect(screen.getByLabelText("3 estrellas")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(screen.queryByText("¿Cómo calificarías la atención?")).not.toBeInTheDocument();
  });

  it("muestra 'Enviando…' al calificar", () => {
    const actions = makeActions();
    const { rerender } = view({ ticket: closed(), actions });
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    rerender(<CitizenTicketView ticket={closed()} actions={actions} actionLoading />);
    expect(screen.getByText("Enviando…")).toBeInTheDocument();
  });

  it("no falla al calificar sin actions", () => {
    view({ ticket: closed() });
    fireEvent.click(screen.getByLabelText("5 estrellas"));
    fireEvent.click(screen.getByText("Enviar calificación"));
  });
});

describe("CitizenTicketView - chat", () => {
  const at = (iso) => iso;
  const items = [
    { id: 1, authorType: "CITIZEN", authorId: "me", text: "Hola, mi mensaje", createdAt: at("2026-03-10T12:00:00Z") },
    { id: 2, authorType: "AGENT", authorId: "ag", text: "Respuesta del agente", createdAt: at("2026-03-10T13:00:00Z") },
    { id: 3, authorType: "AREA_RESPONSIBLE", authorId: "ar", text: "Del área", createdAt: at("2026-03-10T14:00:00Z") },
    { id: 4, authorType: "SYSTEM", text: "Ticket derivado", createdAt: at("2026-03-10T15:00:00Z") },
    { id: 5, authorType: "ADMIN", authorId: "ad", text: "Del admin", createdAt: at("2026-03-10T16:00:00Z"), updatedAt: at("2026-03-10T16:05:00Z") },
    { id: 6, authorType: "RARO", authorId: "zz", text: "De otro tipo", createdAt: at("2026-03-10T17:00:00Z"), updatedAt: at("2026-03-10T17:00:00.500Z") },
  ];

  it("explica que el chat no existe sin adaptador", () => {
    view();
    expect(screen.getByText(/todavía no está disponible para el seguimiento anónimo/)).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay mensajes en este reclamo.")).toBeInTheDocument();
  });

  it("muestra el cargando y el error", () => {
    const { container, unmount } = view({ chat: makeChat({ loading: true }) });
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    unmount();
    view({ chat: makeChat({ error: "No pudimos cargar" }) });
    expect(screen.getByText("No pudimos cargar")).toBeInTheDocument();
  });

  it("distingue mensajes propios, del personal, del sistema y editados", () => {
    view({ chat: makeChat({ items }) });
    expect(screen.getByText("Hola, mi mensaje")).toBeInTheDocument();
    expect(screen.getAllByText("Atención Vecinal").length).toBeGreaterThan(1);
    expect(screen.getByText("Área responsable")).toBeInTheDocument();
    expect(screen.getByText("Administración municipal")).toBeInTheDocument();
    expect(screen.getByText("Ticket derivado")).toBeInTheDocument();
    expect(screen.getAllByText(/\(editado\)/)).toHaveLength(1);
  });

  it("infiere que los mensajes propios son de CITIZEN si no se conoce el autor actual", () => {
    view({ chat: makeChat({ items, currentAuthorId: null }) });
    expect(screen.getByText("Hola, mi mensaje")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Editar mensaje")).toHaveLength(1);
  });

  it("envía con el botón y con Enter, y limpia el borrador", async () => {
    const chat = makeChat();
    view({ chat });
    const box = screen.getByPlaceholderText("Escribí un mensaje…");
    const send = screen.getByLabelText("Enviar mensaje");
    expect(send).toBeDisabled();
    fireEvent.change(box, { target: { value: " Hola " } });
    fireEvent.click(send);
    await waitFor(() => expect(chat.onSend).toHaveBeenCalledWith("Hola"));
    await waitFor(() => expect(box).toHaveValue(""));
    fireEvent.change(box, { target: { value: "otra" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(chat.onSend).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: "a" });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(chat.onSend).toHaveBeenCalledTimes(2));
  });

  it("no envía un mensaje vacío", () => {
    const chat = makeChat();
    view({ chat });
    fireEvent.keyDown(screen.getByPlaceholderText("Escribí un mensaje…"), { key: "Enter" });
    expect(chat.onSend).not.toHaveBeenCalled();
  });

  it("muestra el error del envío con el traductor del chat o con el mensaje del error", async () => {
    const chat = makeChat({ onSend: vi.fn().mockRejectedValue(new Error("Sin permiso")), messageForError: (e) => `Traducido: ${e.message}` });
    const { unmount } = view({ chat });
    fireEvent.change(screen.getByPlaceholderText("Escribí un mensaje…"), { target: { value: "x" } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    expect(await screen.findByText("Traducido: Sin permiso")).toBeInTheDocument();
    unmount();
    const plain = makeChat({ onSend: vi.fn().mockRejectedValueOnce(new Error("Falla cruda")).mockRejectedValueOnce({}) });
    view({ chat: plain });
    fireEvent.change(screen.getByPlaceholderText("Escribí un mensaje…"), { target: { value: "x" } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    expect(await screen.findByText("Falla cruda")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    expect(await screen.findByText("No pudimos enviar el mensaje.")).toBeInTheDocument();
  });

  it("deshabilita el chat según el estado o la falta de permiso", () => {
    const { unmount } = view({ ticket: baseTicket({ currentStatus: "CANCELLED" }), chat: makeChat() });
    expect(screen.getByText(/El chat está deshabilitado porque el reclamo está cancelado/)).toBeInTheDocument();
    unmount();
    const resolved = view({ ticket: baseTicket({ currentStatus: "RESOLVED" }), chat: makeChat(), actions: makeActions() });
    expect(screen.getByText(/deshabilitado porque el reclamo está resuelto/)).toBeInTheDocument();
    resolved.unmount();
    view({ ticket: baseTicket({ currentStatus: "DUPLICATE" }), chat: makeChat() });
    expect(screen.getByText(/deshabilitado porque el reclamo está duplicado/)).toBeInTheDocument();
  });

  it("usa el estado crudo en el aviso cuando no tiene etiqueta", () => {
    view({ ticket: baseTicket({ currentStatus: "CLOSED" }), chat: makeChat() });
    expect(screen.getByText(/deshabilitado porque el reclamo está cerrado/)).toBeInTheDocument();
  });

  it("sin permiso de envío no manda mensajes aunque se escriba", () => {
    const chat = makeChat({ canSend: false });
    view({ chat });
    const box = screen.getByPlaceholderText("Escribí un mensaje…");
    fireEvent.change(box, { target: { value: "hola" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(chat.onSend).not.toHaveBeenCalled();
  });

  it("edita un mensaje propio", async () => {
    const chat = makeChat({ items: [items[0]] });
    view({ chat });
    fireEvent.click(screen.getByLabelText("Editar mensaje"));
    const box = screen.getByDisplayValue("Hola, mi mensaje");
    fireEvent.change(box, { target: { value: "  " } });
    expect(screen.getByText("Guardar")).toBeDisabled();
    fireEvent.change(box, { target: { value: " Editado " } });
    fireEvent.click(screen.getByText("Guardar"));
    await waitFor(() => expect(chat.onEdit).toHaveBeenCalledWith(1, "Editado"));
    await waitFor(() => expect(screen.queryByDisplayValue("Editado")).not.toBeInTheDocument());
  });

  it("cancela la edición y muestra el error de guardado", async () => {
    const chat = makeChat({ items: [items[0]], onEdit: vi.fn().mockRejectedValueOnce(new Error("No se pudo editar")).mockRejectedValueOnce({}) });
    view({ chat });
    fireEvent.click(screen.getByLabelText("Editar mensaje"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByText("Guardar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Editar mensaje"));
    fireEvent.click(screen.getByText("Guardar"));
    expect(await screen.findByText("No se pudo editar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Guardar"));
    expect(await screen.findByText("No pudimos editar el mensaje.")).toBeInTheDocument();
  });

  it("no guarda una edición vacía", () => {
    const chat = makeChat({ items: [items[0]] });
    view({ chat });
    fireEvent.click(screen.getByLabelText("Editar mensaje"));
    fireEvent.change(screen.getByDisplayValue("Hola, mi mensaje"), { target: { value: "" } });
    fireEvent.click(screen.getByText("Guardar"));
    expect(chat.onEdit).not.toHaveBeenCalled();
  });

  it("borra un mensaje propio con confirmación", async () => {
    const chat = makeChat({ items: [items[0]] });
    view({ chat });
    fireEvent.click(screen.getByLabelText("Borrar mensaje"));
    expect(screen.getByText("¿Borrar este mensaje?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("No"));
    expect(screen.queryByText("¿Borrar este mensaje?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Borrar mensaje"));
    fireEvent.click(screen.getByText("Sí, borrar"));
    await waitFor(() => expect(chat.onDelete).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("¿Borrar este mensaje?")).not.toBeInTheDocument());
  });

  it("muestra el error de borrado con y sin traductor", async () => {
    const chat = makeChat({ items: [items[0]], onDelete: vi.fn().mockRejectedValueOnce(new Error("No se pudo borrar")).mockRejectedValueOnce({}) });
    view({ chat });
    fireEvent.click(screen.getByLabelText("Borrar mensaje"));
    fireEvent.click(screen.getByText("Sí, borrar"));
    expect(await screen.findByText("No se pudo borrar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sí, borrar"));
    expect(await screen.findByText("No pudimos borrar el mensaje.")).toBeInTheDocument();
  });

  it("no permite editar ni borrar en solo lectura o sin esas funciones", () => {
    const { unmount } = view({ readOnly: true, chat: makeChat({ items: [items[0]] }) });
    expect(screen.queryByLabelText("Editar mensaje")).not.toBeInTheDocument();
    unmount();
    view({ chat: makeChat({ items: [items[0]], onEdit: undefined, onDelete: undefined }) });
    expect(screen.queryByLabelText("Editar mensaje")).not.toBeInTheDocument();
  });

  it("no envía mientras otro envío está en curso", async () => {
    let finish;
    const chat = makeChat({ onSend: vi.fn(() => new Promise((resolve) => (finish = resolve))) });
    view({ chat });
    const box = screen.getByPlaceholderText("Escribí un mensaje…");
    fireEvent.change(box, { target: { value: "uno" } });
    fireEvent.click(screen.getByLabelText("Enviar mensaje"));
    await waitFor(() => expect(box).toBeDisabled());
    fireEvent.keyDown(box, { key: "Enter" });
    expect(chat.onSend).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(box).not.toBeDisabled());
  });
});

describe("CitizenTicketView - adjuntos", () => {
  it("permite subir sólo si no es de solo lectura y el adaptador lo permite", () => {
    const attachments = { canUpload: true, uploadFile: vi.fn(), downloadFile: vi.fn() };
    const { unmount } = view({ attachments });
    expect(screen.getByText("Adjuntar archivo")).toBeInTheDocument();
    unmount();
    view({ attachments, readOnly: true });
    expect(screen.queryByText("Adjuntar archivo")).not.toBeInTheDocument();
  });

  it("lista los adjuntos del ticket", () => {
    view({ ticket: baseTicket({ attachments: [{ id: 1, fileName: "foto.png", contentType: "image/png", sizeBytes: 10 }] }) });
    expect(screen.getByText("foto.png")).toBeInTheDocument();
  });
});
