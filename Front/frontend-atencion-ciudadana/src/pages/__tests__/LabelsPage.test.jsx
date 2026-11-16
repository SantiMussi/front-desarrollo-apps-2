import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LabelsPage from "../admin/LabelsPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import { createStaffLabel, deleteStaffLabel, fetchStaffLabels, updateStaffLabel } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  createStaffLabel: vi.fn(),
  deleteStaffLabel: vi.fn(),
  fetchStaffLabels: vi.fn(),
  updateStaffLabel: vi.fn(),
}));

const labels = [
  { id: 1, code: "URGENTE", name: "Urgente", description: "Atención inmediata", active: true, ticketCount: 4 },
  { id: 2, code: "ARBOL", name: "Árbol caído", description: "", active: false, ticketCount: 0 },
  { id: 3, code: "OTRA", name: "Otra", description: "Sin uso", active: true },
];

const httpError = (status, message = "Falló") => Object.assign(new Error(message), { status });

beforeEach(() => vi.clearAllMocks());

const renderPage = async (data = labels) => {
  fetchStaffLabels.mockResolvedValue(data);
  const view = renderWithProviders(<LabelsPage />);
  await waitFor(() => expect(screen.queryByRole("button", { name: "Actualizar etiquetas" })).toBeEnabled());
  return view;
};

describe("LabelsPage - listado", () => {
  it("muestra las estadísticas y las etiquetas", async () => {
    await renderPage();
    expect(screen.getByText("Etiquetas totales").previousSibling).toHaveTextContent("3");
    expect(screen.getByText("Activas", { selector: "p" }).previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Inactivas", { selector: "p" }).previousSibling).toHaveTextContent("1");
    expect(screen.getByText("URGENTE")).toBeInTheDocument();
    expect(screen.getByText("Sin descripción")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 3 de 3 etiquetas")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("NaN")).toBeInTheDocument();
  });

  it("filtra por estado y por texto sin distinguir tildes", async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "inactive" } });
    expect(screen.getByText("Mostrando 1 de 3 etiquetas")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "active" } });
    expect(screen.getByText("Mostrando 2 de 3 etiquetas")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Buscar etiquetas"), { target: { value: "arbol" } });
    expect(screen.getByText("Mostrando 1 de 3 etiquetas")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar etiquetas"), { target: { value: "zzz" } });
    expect(screen.getByText("No encontramos coincidencias")).toBeInTheDocument();
    expect(screen.getByText("Probá con otra búsqueda o filtro.")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay etiquetas o la respuesta no es una lista", async () => {
    await renderPage(null);
    expect(screen.getByText("Todavía no hay etiquetas")).toBeInTheDocument();
    expect(screen.getByText(/Creá la primera etiqueta/)).toBeInTheDocument();
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
  });

  it.each([
    [httpError(401), /sesión venció/],
    [httpError(403), /No tenés permisos para administrar etiquetas/],
    [httpError(409, ""), /Ya existe una etiqueta/],
    [httpError(500, "Rota"), "Rota"],
    [{}, /No pudimos completar la operación/],
  ])("traduce el error de carga %# y permite reintentar", async (error, expected) => {
    fetchStaffLabels.mockRejectedValueOnce(error);
    renderWithProviders(<LabelsPage />);
    const text = await screen.findByText(expected);
    expect(text).toBeInTheDocument();
    fetchStaffLabels.mockResolvedValueOnce(labels);
    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByText("Urgente")).toBeInTheDocument();
  });

  it("actualiza el listado con el botón de recarga", async () => {
    await renderPage();
    fireEvent.click(screen.getByLabelText("Actualizar etiquetas"));
    await waitFor(() => expect(fetchStaffLabels).toHaveBeenCalledTimes(2));
  });
});

describe("LabelsPage - alta y edición", () => {
  it("crea una etiqueta y recarga", async () => {
    createStaffLabel.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva etiqueta/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("El código será permanente y debe ser único.")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/^Código/), { target: { value: "NUEVA" } });
    fireEvent.change(within(dialog).getByLabelText(/^Nombre/), { target: { value: "Nueva" } });
    fireEvent.change(within(dialog).getByLabelText(/^Descripción/), { target: { value: "Para pruebas" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear etiqueta" }));
    await waitFor(() => expect(createStaffLabel).toHaveBeenCalledWith({ code: "NUEVA", name: "Nueva", description: "Para pruebas" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchStaffLabels).toHaveBeenCalledTimes(2);
  });

  it("muestra el error de creación y se puede cancelar", async () => {
    createStaffLabel.mockRejectedValue(httpError(409, "Código repetido"));
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva etiqueta/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Código/), { target: { value: "X" } });
    fireEvent.change(within(dialog).getByLabelText(/^Nombre/), { target: { value: "X" } });
    fireEvent.change(within(dialog).getByLabelText(/^Descripción/), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear etiqueta" }));
    expect(await screen.findByText("Código repetido")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edita una etiqueta conservando su estado activo", async () => {
    updateStaffLabel.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getByLabelText("Editar Urgente"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("El código no puede modificarse.")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/^Nombre/), { target: { value: "Muy urgente" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() =>
      expect(updateStaffLabel).toHaveBeenCalledWith(1, { code: "URGENTE", name: "Muy urgente", description: "Atención inmediata", active: true })
    );
  });

  it("muestra el error de edición", async () => {
    updateStaffLabel.mockRejectedValue(httpError(403));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Editar Urgente"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText(/No tenés permisos para administrar etiquetas/)).toBeInTheDocument();
  });
});

describe("LabelsPage - estado y eliminación", () => {
  it("activa y desactiva usando la respuesta del servidor o el estado local", async () => {
    updateStaffLabel
      .mockResolvedValueOnce({ ...labels[0], active: false, name: "Urgente (servidor)" })
      .mockResolvedValueOnce(null);
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar Urgente"));
    await waitFor(() => expect(updateStaffLabel).toHaveBeenCalledWith(1, { name: "Urgente", description: "Atención inmediata", active: false }));
    expect(await screen.findByText("Urgente (servidor)")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Activar Árbol caído"));
    await waitFor(() => expect(screen.getByLabelText("Desactivar Árbol caído")).toBeInTheDocument());
  });

  it("muestra el error al cambiar el estado", async () => {
    updateStaffLabel.mockRejectedValue(httpError(401));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar Urgente"));
    expect(await screen.findByText(/sesión venció/)).toBeInTheDocument();
  });

  it("elimina una etiqueta tras confirmar", async () => {
    deleteStaffLabel.mockResolvedValue(null);
    await renderPage();
    fireEvent.click(screen.getByLabelText("Eliminar Urgente"));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Vas a eliminar Urgente");
    fireEvent.click(screen.getByRole("button", { name: /Eliminar\s+definitivamente/ }));
    await waitFor(() => expect(deleteStaffLabel).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.queryByText("URGENTE")).not.toBeInTheDocument();
  });

  it("muestra el error de eliminación y permite cancelar de todas las formas", async () => {
    deleteStaffLabel.mockRejectedValue(httpError(409, "Tiene tickets asociados"));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Eliminar Urgente"));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar\s+definitivamente/ }));
    expect(await screen.findByText("Tiene tickets asociados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Eliminar Urgente"));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByLabelText("Cerrar"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Eliminar Urgente"));
    fireEvent.mouseDown(screen.getByRole("alertdialog"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("alertdialog").parentElement);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("no permite cancelar la eliminación mientras se procesa", async () => {
    let resolve;
    deleteStaffLabel.mockReturnValue(new Promise((res) => (resolve = res)));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Eliminar Urgente"));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar\s+definitivamente/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled());
    fireEvent.mouseDown(screen.getByRole("alertdialog").parentElement);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    resolve(null);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});
