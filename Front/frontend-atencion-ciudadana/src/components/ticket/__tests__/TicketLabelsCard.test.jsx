import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TicketLabelsCard from "../TicketLabelsCard";
import { assignTicketLabels, createStaffLabel, fetchStaffLabels, removeTicketLabel } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
  assignTicketLabels: vi.fn(),
  createStaffLabel: vi.fn(),
  fetchStaffLabels: vi.fn(),
  removeTicketLabel: vi.fn(),
}));

const catalog = [
  { id: 1, code: "URGENTE", name: "Urgente", active: true },
  { id: 2, code: "ARBOL", name: "Árbol caído", description: "Poda", active: true },
  { id: 3, code: "VIEJA", name: "Vieja", active: false },
  { id: 4, code: "ASIGNADA", name: "Asignada", active: true },
];

const httpError = (status, message = "Falló") => Object.assign(new Error(message), { status });

const renderCard = async (ticket = { id: 50 }, props = {}) => {
  fetchStaffLabels.mockResolvedValue(catalog);
  const view = render(<TicketLabelsCard ticket={ticket} {...props} />);
  await waitFor(() => expect(screen.queryByText(/Cargando etiquetas/)).not.toBeInTheDocument());
  return view;
};

const search = () => screen.getByLabelText("Buscar o crear etiqueta");

beforeEach(() => vi.clearAllMocks());

describe("TicketLabelsCard", () => {
  it("muestra el estado de carga y luego el ticket sin etiquetas", async () => {
    fetchStaffLabels.mockReturnValue(new Promise(() => {}));
    render(<TicketLabelsCard ticket={{ id: 1 }} />);
    expect(screen.getByText(/Cargando etiquetas/)).toBeInTheDocument();
    fetchStaffLabels.mockResolvedValue([]);
    render(<TicketLabelsCard ticket={{ id: 1 }} />);
    expect(await screen.findByText("Este ticket no tiene etiquetas.")).toBeInTheDocument();
  });

  it.each([
    ["labels con objetos", { id: 5, labels: [{ id: 4, name: "Asignada", code: "ASIGNADA", description: "Ya puesta" }] }],
    ["ticketLabels con envoltorio", { id: 5, ticketLabels: [{ label: { id: 4, name: "Asignada" } }] }],
    ["manualLabels", { id: 5, manualLabels: [{ id: 4, name: "Asignada" }] }],
  ])("parte de las etiquetas asignadas (%s)", async (_case, ticket) => {
    await renderCard(ticket);
    expect(screen.getByText("Asignada")).toBeInTheDocument();
  });

  it("ignora etiquetas malformadas o una lista que no es arreglo", async () => {
    const { unmount } = await renderCard({ id: 5, labels: ["texto", null, { name: "sin id" }] });
    expect(screen.getByText("Este ticket no tiene etiquetas.")).toBeInTheDocument();
    unmount();
    await renderCard({ id: 5, labels: "no-arreglo" });
    expect(screen.getByText("Este ticket no tiene etiquetas.")).toBeInTheDocument();
  });

  it("trata un catálogo que no es lista como vacío", async () => {
    fetchStaffLabels.mockResolvedValue(null);
    render(<TicketLabelsCard ticket={{ id: 1 }} />);
    expect(await screen.findByText("Este ticket no tiene etiquetas.")).toBeInTheDocument();
  });

  it.each([
    [httpError(401), /sesión no es válida/],
    [httpError(403), /consultar el catálogo/],
    [httpError(404), /No se encontró el catálogo/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos actualizar las etiquetas/],
  ])("traduce el error de carga %#", async (error, expected) => {
    fetchStaffLabels.mockRejectedValue(error);
    render(<TicketLabelsCard ticket={{ id: 1 }} />);
    const alert = await screen.findByRole("alert");
    if (expected instanceof RegExp) expect(alert).toHaveTextContent(expected);
    else expect(alert).toHaveTextContent(expected);
  });

  it("asigna una etiqueta sugerida y filtra las inactivas y ya asignadas", async () => {
    await renderCard({ id: 50, labels: [{ id: 4, name: "Asignada" }] });
    assignTicketLabels.mockResolvedValue({});
    fireEvent.change(search(), { target: { value: "arbol" } });
    expect(screen.getByText("Etiquetas disponibles")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vieja" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Árbol caído" }));
    await waitFor(() => expect(assignTicketLabels).toHaveBeenCalledWith(50, [2]));
    expect(await screen.findByTitle("ARBOL · Poda")).toBeInTheDocument();
    expect(search()).toHaveValue("");
  });

  it("asigna la coincidencia exacta con el botón y con Enter", async () => {
    await renderCard();
    assignTicketLabels.mockResolvedValue({});
    fireEvent.change(search(), { target: { value: "urgente" } });
    expect(screen.getByRole("button", { name: "Asignar" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
    await waitFor(() => expect(assignTicketLabels).toHaveBeenCalledWith(50, [1]));
    fireEvent.change(search(), { target: { value: "arbol caido" } });
    fireEvent.keyDown(search(), { key: "Enter" });
    await waitFor(() => expect(assignTicketLabels).toHaveBeenCalledWith(50, [2]));
  });

  it("crea y asigna una etiqueta nueva con el botón y con Enter", async () => {
    await renderCard();
    createStaffLabel.mockResolvedValueOnce({ label: { id: 10, name: "Zona Norte" } }).mockResolvedValueOnce({ id: 11, name: "Otra Nueva" });
    assignTicketLabels.mockResolvedValue({});
    fireEvent.change(search(), { target: { value: "Zona Norte" } });
    expect(screen.getByText(/Podés crear/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(createStaffLabel).toHaveBeenCalledWith({ code: "ZONA_NORTE", name: "Zona Norte", description: null }));
    await waitFor(() => expect(assignTicketLabels).toHaveBeenCalledWith(50, [10]));
    fireEvent.change(search(), { target: { value: "Otra Nueva" } });
    fireEvent.keyDown(search(), { key: "Enter" });
    await waitFor(() => expect(assignTicketLabels).toHaveBeenCalledWith(50, [11]));
    fireEvent.keyDown(search(), { key: "a" });
  });

  it("genera un código genérico para nombres sin caracteres válidos", async () => {
    await renderCard();
    createStaffLabel.mockResolvedValue({ id: 12, name: "???" });
    assignTicketLabels.mockResolvedValue({});
    fireEvent.change(search(), { target: { value: "???" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    await waitFor(() => expect(createStaffLabel).toHaveBeenCalledWith(expect.objectContaining({ code: "LABEL" })));
  });

  it("Enter sin texto no hace nada", async () => {
    await renderCard();
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(createStaffLabel).not.toHaveBeenCalled();
    expect(assignTicketLabels).not.toHaveBeenCalled();
  });

  it("avisa si la etiqueta creada no trae identificador", async () => {
    await renderCard();
    createStaffLabel.mockResolvedValue({});
    fireEvent.change(search(), { target: { value: "Nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudimos obtener su identificador/);
  });

  it.each([
    [httpError(403), /No tenés permiso para crear etiquetas/],
    [httpError(401), /sesión no es válida/],
  ])("traduce el error al crear %#", async (error, expected) => {
    await renderCard();
    createStaffLabel.mockRejectedValue(error);
    fireEvent.change(search(), { target: { value: "Nueva" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
  });

  it.each([
    [httpError(403), /No tenés permiso para asignar/],
    [httpError(404), /ya no existe/],
  ])("traduce el error al asignar %#", async (error, expected) => {
    await renderCard();
    assignTicketLabels.mockRejectedValue(error);
    fireEvent.change(search(), { target: { value: "urgente" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
  });

  it("quita una etiqueta asignada y traduce el error al quitar", async () => {
    await renderCard({ id: 50, labels: [{ id: 4, name: "Asignada" }, { id: 1, name: "Urgente" }] });
    removeTicketLabel.mockResolvedValueOnce(null).mockRejectedValueOnce(httpError(404));
    fireEvent.click(screen.getByLabelText("Quitar etiqueta Asignada"));
    await waitFor(() => expect(removeTicketLabel).toHaveBeenCalledWith(50, 4));
    await waitFor(() => expect(screen.queryByText("Asignada")).not.toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Quitar etiqueta Urgente"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/ya no existe/);
  });

  it("en modo lectura no muestra controles de edición", async () => {
    await renderCard({ id: 50, labels: [{ id: 4, name: "Asignada" }] }, { readOnly: true });
    expect(screen.getByText("Asignada")).toBeInTheDocument();
    expect(screen.queryByLabelText("Buscar o crear etiqueta")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Quitar etiqueta Asignada")).not.toBeInTheDocument();
  });

  it("no lanza otra operación mientras hay una en curso", async () => {
    await renderCard();
    let resolveAssign;
    assignTicketLabels.mockReturnValue(new Promise((resolve) => (resolveAssign = resolve)));
    fireEvent.change(search(), { target: { value: "urgente" } });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));
    await waitFor(() => expect(search()).toBeDisabled());
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(assignTicketLabels).toHaveBeenCalledTimes(1);
    resolveAssign({});
    await waitFor(() => expect(search()).not.toBeDisabled());
  });

  it("coincide con búsquedas aproximadas y descarta las demasiado distintas", async () => {
    await renderCard();
    fireEvent.change(search(), { target: { value: "urgnte" } });
    expect(screen.getByRole("button", { name: "Urgente" })).toBeInTheDocument();
    fireEvent.change(search(), { target: { value: "zzzzzz" } });
    expect(screen.queryByText("Etiquetas disponibles")).not.toBeInTheDocument();
    fireEvent.change(search(), { target: { value: "ur" } });
    expect(screen.getByRole("button", { name: "Urgente" })).toBeInTheDocument();
  });
});
