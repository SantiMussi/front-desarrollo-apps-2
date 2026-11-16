import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RequestTypeFormSchemaDialog from "../RequestTypeFormSchemaDialog";
import { fetchAdminRequestTypeForm, saveAdminRequestTypeForm } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({
  fetchAdminRequestTypeForm: vi.fn(),
  saveAdminRequestTypeForm: vi.fn(),
}));

const requestType = { id: 12, name: "Luminaria", code: "LUM" };

const serverForm = {
  version: 3,
  fields: [
    {
      code: "cantidad",
      label: "Cantidad",
      type: "NUMBER",
      required: true,
      allowUnknown: false,
      displayOrder: 1,
      config: {},
      riskRules: [],
    },
  ],
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const renderDialog = async (form = serverForm, onClose = vi.fn()) => {
  fetchAdminRequestTypeForm.mockResolvedValue(form);
  render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={onClose} />);
  await screen.findByText(/Armá las preguntas/);
  return onClose;
};

const addField = (typeLabel) => {
  const opener = screen.queryByRole("button", { name: /Agregar campo/ });
  if (opener) fireEvent.click(opener);
  fireEvent.click(screen.getByText(typeLabel).closest("button"));
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RequestTypeFormSchemaDialog", () => {
  it("carga el formulario existente con su versión", async () => {
    await renderDialog();
    expect(screen.getByText("Formulario del trámite")).toBeInTheDocument();
    expect(screen.getByText("Versión 3")).toBeInTheDocument();
    expect(screen.getByText("Luminaria")).toBeInTheDocument();
    expect(screen.getByText("1 campo")).toBeInTheDocument();
    expect(fetchAdminRequestTypeForm).toHaveBeenCalledWith(12);
    expect(screen.getByRole("button", { name: "Guardar formulario" })).toBeDisabled();
  });

  it("colapsa las tarjetas cuando hay más de tres campos", async () => {
    const fields = Array.from({ length: 4 }, (_, index) => ({
      code: `c${index}`,
      label: `Pregunta ${index}`,
      type: "TEXT",
      displayOrder: index,
    }));
    await renderDialog({ version: 1, fields });
    expect(screen.getByText("4 campos")).toBeInTheDocument();
    expect(screen.queryByText("Pregunta que ve el vecino")).not.toBeInTheDocument();
  });

  it("parte de un formulario vacío cuando el trámite todavía no tiene uno", async () => {
    fetchAdminRequestTypeForm.mockRejectedValue(Object.assign(new Error("Sin formulario configurado"), { status: 404 }));
    render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={vi.fn()} />);
    await screen.findByText(/Armá las preguntas/);
    expect(screen.getByText("¿Qué tipo de campo querés agregar?")).toBeInTheDocument();
    expect(screen.queryByText(/^Versión/)).not.toBeInTheDocument();
    expect(screen.getByText("0 campos")).toBeInTheDocument();
  });

  it("muestra el error de carga y permite reintentar", async () => {
    fetchAdminRequestTypeForm.mockRejectedValueOnce(Object.assign(new Error("boom"), { status: 500 }));
    render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={vi.fn()} />);
    expect(await screen.findByText("boom")).toBeInTheDocument();
    fetchAdminRequestTypeForm.mockResolvedValueOnce(serverForm);
    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByText("Versión 3")).toBeInTheDocument();
  });

  it("un 404 con otro mensaje sigue siendo un error", async () => {
    fetchAdminRequestTypeForm.mockRejectedValue(Object.assign(new Error("no existe"), { status: 404 }));
    render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={vi.fn()} />);
    expect(await screen.findByText(/No encontramos ese registro/)).toBeInTheDocument();
  });

  it("ignora la respuesta si se cierra antes de terminar de cargar", async () => {
    const pending = deferred();
    fetchAdminRequestTypeForm.mockReturnValue(pending.promise);
    const { unmount } = render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={vi.fn()} />);
    unmount();
    await act(async () => pending.resolve(serverForm));
    const failing = deferred();
    fetchAdminRequestTypeForm.mockReturnValue(failing.promise);
    const second = render(<RequestTypeFormSchemaDialog requestType={requestType} onClose={vi.fn()} />);
    second.unmount();
    await act(async () => failing.reject(new Error("tarde")));
  });

  it("agrega un campo de cada tipo, valida y muestra el resumen de errores", async () => {
    await renderDialog({ version: 1, fields: [] });
    ["Texto corto", "Texto largo", "Lista de opciones", "Sí / No", "Número", "Fecha"].forEach((label, index) => {
      if (index > 0) fireEvent.click(screen.getByRole("button", { name: /Agregar campo/ }));
      const picker = screen.getByText("¿Qué tipo de campo querés agregar?").parentElement;
      fireEvent.click(within(picker).getByText(label).closest("button"));
    });
    expect(screen.getByText("6 campos")).toBeInTheDocument();
    expect(screen.getByText(/Cambios sin guardar \(se creará la versión 2\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(screen.getByText(/Corregí 6 cosas antes de guardar/)).toBeInTheDocument();
    expect(saveAdminRequestTypeForm).not.toHaveBeenCalled();
  });

  it("muestra el mensaje a nivel formulario cuando no quedan campos", async () => {
    await renderDialog();
    fireEvent.click(screen.getByLabelText("Eliminar campo"));
    fireEvent.click(screen.getByText("Eliminar"));
    expect(screen.getByText("Todavía no hay preguntas en este formulario.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(screen.getByText("El formulario debe tener al menos una pregunta.")).toBeInTheDocument();
    expect(screen.getByText(/Corregí 1 cosa antes/)).toBeInTheDocument();
  });

  it("guarda un formulario válido y muestra la versión nueva", async () => {
    await renderDialog();
    saveAdminRequestTypeForm.mockResolvedValue({ ...serverForm, version: 4 });
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Cantidad de luces" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(await screen.findByText(/ahora está en la versión 4/)).toBeInTheDocument();
    expect(saveAdminRequestTypeForm).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ fields: [expect.objectContaining({ label: "Cantidad de luces", code: "cantidad" })] })
    );
    expect(screen.getByText("Versión 4")).toBeInTheDocument();
  });

  it("usa 'nueva' si el backend no devuelve versión", async () => {
    await renderDialog();
    saveAdminRequestTypeForm.mockResolvedValue({ fields: serverForm.fields });
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Otra" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(await screen.findByText(/versión nueva/)).toBeInTheDocument();
  });

  it("no crea dos versiones con un doble clic en Guardar", async () => {
    await renderDialog();
    const pending = deferred();
    saveAdminRequestTypeForm.mockReturnValue(pending.promise);
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Cambio" } });
    const save = screen.getByRole("button", { name: "Guardar formulario" });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(saveAdminRequestTypeForm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Guardando…")).toBeInTheDocument();
    await act(async () => pending.resolve({ ...serverForm, version: 4 }));
    await screen.findByText(/versión 4/);
  });

  it("muestra el rechazo del servidor y permite volver a intentar", async () => {
    await renderDialog();
    saveAdminRequestTypeForm.mockRejectedValueOnce(Object.assign(new Error("Código repetido"), { status: 400 }));
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Cambio" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(await screen.findByText(/El servidor rechazó el formulario/)).toBeInTheDocument();
    expect(screen.getByText(/Código repetido/)).toBeInTheDocument();
    saveAdminRequestTypeForm.mockResolvedValueOnce({ ...serverForm, version: 4 });
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    expect(await screen.findByText(/ahora está en la versión 4/)).toBeInTheDocument();
    expect(saveAdminRequestTypeForm).toHaveBeenCalledTimes(2);
  });

  it("reordena y elimina campos", async () => {
    await renderDialog({
      version: 1,
      fields: [
        { code: "a", label: "A", type: "TEXT", displayOrder: 1 },
        { code: "b", label: "B", type: "TEXT", displayOrder: 2 },
      ],
    });
    const order = () => screen.getAllByRole("article").map((card) => card.textContent.match(/\d\. (\w)/)[1]);
    expect(order()).toEqual(["A", "B"]);
    fireEvent.click(screen.getAllByLabelText("Bajar campo")[0]);
    expect(order()).toEqual(["B", "A"]);
    fireEvent.click(screen.getAllByLabelText("Subir campo")[1]);
    expect(order()).toEqual(["A", "B"]);
    fireEvent.click(screen.getAllByLabelText("Subir campo")[0]);
    expect(order()).toEqual(["A", "B"]);
    fireEvent.click(screen.getAllByLabelText("Eliminar campo")[0]);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("muestra el JSON que se envía", async () => {
    await renderDialog();
    fireEvent.click(screen.getByText(/Ver JSON que se envía/));
    expect(screen.getByText(/"displayOrder": 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ocultar JSON/));
    expect(screen.queryByText(/"displayOrder": 1/)).not.toBeInTheDocument();
  });

  it("serializa NaN como null en el JSON de vista previa", async () => {
    await renderDialog({ version: 1, fields: [] });
    addField("Número");
    fireEvent.click(screen.getByText("Agregar regla de riesgo"));
    fireEvent.change(screen.getByLabelText("Puntos de riesgo"), { target: { value: "" } });
    fireEvent.click(screen.getByText(/Ver JSON que se envía/));
    expect(screen.getByText(/"riskIncrement": null/)).toBeInTheDocument();
  });

  it("cierra directo si no hay cambios (botón, X, Escape y fondo)", async () => {
    const onClose = await renderDialog();
    screen.getAllByRole("button", { name: "Cerrar" }).forEach((button) => fireEvent.click(button));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "a" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it("pide confirmar antes de descartar cambios sin guardar", async () => {
    const onClose = await renderDialog();
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Cambio" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText(/Tenés cambios sin guardar/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Seguir editando"));
    expect(screen.queryByText(/Tenés cambios sin guardar/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText("Cerrar")[0]);
    fireEvent.click(screen.getByText("Descartar y cerrar"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("no permite cerrar mientras se guarda", async () => {
    const onClose = await renderDialog();
    const pending = deferred();
    saveAdminRequestTypeForm.mockReturnValue(pending.promise);
    fireEvent.change(screen.getByPlaceholderText(/¿Cuántas luminarias/), { target: { value: "Cambio" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar formulario" }));
    screen.getAllByLabelText("Cerrar").forEach((button) => fireEvent.click(button));
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => pending.resolve({ ...serverForm, version: 4 }));
    await waitFor(() => expect(screen.getByText("Versión 4")).toBeInTheDocument());
  });
});
