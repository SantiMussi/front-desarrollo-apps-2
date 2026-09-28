import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CategoriesPage from "../admin/CategoriesPage";
import SubcategoriesPage from "../admin/SubcategoriesPage";
import RequestTypesPage from "../admin/RequestTypesPage";
import { renderWithProviders } from "../../test/renderWithProviders";
import * as api from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  fetchAdminCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  activateCategory: vi.fn(),
  deactivateCategory: vi.fn(),
  fetchAdminSubcategories: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  activateSubcategory: vi.fn(),
  deactivateSubcategory: vi.fn(),
  fetchAdminRequestTypes: vi.fn(),
  createRequestType: vi.fn(),
  updateRequestType: vi.fn(),
  activateRequestType: vi.fn(),
  deactivateRequestType: vi.fn(),
}));

vi.mock("../../components/catalog/RequestTypeFormSchemaDialog", () => ({
  default: ({ requestType, onClose }) => (
    <div role="dialog" aria-label="schema">
      <span>Schema de {requestType.name}</span>
      <button onClick={onClose}>cerrar-schema</button>
    </div>
  ),
}));

const httpError = (status, message = "Falló", code) => Object.assign(new Error(message), { status, code });

beforeEach(() => vi.clearAllMocks());

const categories = [
  { id: 1, name: "Alumbrado", description: "Luces", active: true },
  { id: 2, name: "Arbolado", description: "", active: false },
];

const dialogFor = () => screen.getByRole("dialog");

describe("CategoriesPage", () => {
  const renderPage = async () => {
    const view = renderWithProviders(<CategoriesPage />, { route: "/agente/catalogo", path: "/agente/catalogo" });
    await screen.findByText("Alumbrado");
    return view;
  };

  it("lista las categorías y navega a sus subcategorías al hacer clic en la fila", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    await renderPage();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Alumbrado"));
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/catalogo/1");
  });

  it("muestra el vacío y el error de carga", async () => {
    api.fetchAdminCategories.mockResolvedValueOnce(null);
    renderWithProviders(<CategoriesPage />);
    expect(await screen.findByText("Todavía no hay categorías cargadas.")).toBeInTheDocument();
  });

  it("traduce el error de carga", async () => {
    api.fetchAdminCategories.mockRejectedValue(httpError(403));
    renderWithProviders(<CategoriesPage />);
    expect(await screen.findByText(/No tenés permiso para administrar el catálogo/)).toBeInTheDocument();
  });

  it("crea una categoría y recarga la lista", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    api.createCategory.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva categoría/ }));
    fireEvent.change(within(dialogFor()).getByLabelText(/Nombre/), { target: { value: " Nueva " } });
    fireEvent.change(within(dialogFor()).getByLabelText(/Descripción/), { target: { value: "Desc" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear categoría" }));
    await waitFor(() => expect(api.createCategory).toHaveBeenCalledWith({ name: "Nueva", description: "Desc" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.fetchAdminCategories).toHaveBeenCalledTimes(2);
  });

  it("edita una categoría", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    api.updateCategory.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getAllByLabelText("Editar")[0]);
    expect(within(dialogFor()).getByLabelText(/Nombre/)).toHaveValue("Alumbrado");
    fireEvent.change(within(dialogFor()).getByLabelText(/Nombre/), { target: { value: "Alumbrado público" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.updateCategory).toHaveBeenCalledWith(1, { name: "Alumbrado público", description: "Luces" }));
  });

  it("muestra el error al guardar y mantiene el diálogo abierto, luego cancela", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    api.createCategory.mockRejectedValue(httpError(409, "Ya existe una categoría"));
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva categoría/ }));
    fireEvent.change(within(dialogFor()).getByLabelText(/Nombre/), { target: { value: "Dup" } });
    fireEvent.change(within(dialogFor()).getByLabelText(/Descripción/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear categoría" }));
    expect(await screen.findByText("Ya existe una categoría")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Nueva categoría/ }));
    expect(screen.queryByText("Ya existe una categoría")).not.toBeInTheDocument();
  });

  it("activa y desactiva categorías sin navegar", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    api.deactivateCategory.mockResolvedValue({ ...categories[0], active: false });
    api.activateCategory.mockResolvedValue({ ...categories[1], active: true });
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar"));
    await waitFor(() => expect(api.deactivateCategory).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getAllByText("Inactivo")).toHaveLength(2));
    fireEvent.click(screen.getAllByLabelText("Activar")[1]);
    await waitFor(() => expect(api.activateCategory).toHaveBeenCalledWith(2));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/agente\/catalogo$/);
  });

  it("muestra el error al cambiar el estado", async () => {
    api.fetchAdminCategories.mockResolvedValue(categories);
    api.deactivateCategory.mockRejectedValue(httpError(409, "Tiene hijos activos", "DEPENDENCY"));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar"));
    expect(await screen.findByText("Tiene hijos activos")).toBeInTheDocument();
  });
});

describe("SubcategoriesPage", () => {
  const subs = [
    { id: 10, name: "Alumbrado público", description: "Calles", active: true },
    { id: 11, name: "Semáforos", description: "", active: false },
  ];
  const renderPage = async (cats = categories) => {
    api.fetchAdminCategories.mockResolvedValue(cats);
    api.fetchAdminSubcategories.mockResolvedValue(subs);
    const view = renderWithProviders(<SubcategoriesPage />, { route: "/agente/catalogo/1", path: "/agente/catalogo/:categoryId" });
    await screen.findByText("Alumbrado público");
    return view;
  };

  it("muestra el título con la categoría, el aviso informativo y navega a los tipos", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: /Subcategorías de Alumbrado/ })).toBeInTheDocument();
    expect(screen.getByText(/también se desactivan automáticamente sus tipos de solicitud/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Alumbrado público"));
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/catalogo/1/10");
  });

  it("vuelve a las categorías", async () => {
    await renderPage();
    fireEvent.click(screen.getByText("Volver a categorías"));
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/catalogo");
  });

  it("muestra el error de carga", async () => {
    api.fetchAdminCategories.mockRejectedValue(httpError(500, "Rota"));
    api.fetchAdminSubcategories.mockResolvedValue([]);
    renderWithProviders(<SubcategoriesPage />, { route: "/agente/catalogo/1", path: "/agente/catalogo/:categoryId" });
    expect(await screen.findByText("Rota")).toBeInTheDocument();
  });

  it("acepta un listado que no es arreglo y una categoría no encontrada", async () => {
    api.fetchAdminCategories.mockResolvedValue([]);
    api.fetchAdminSubcategories.mockResolvedValue(null);
    renderWithProviders(<SubcategoriesPage />, { route: "/agente/catalogo/9", path: "/agente/catalogo/:categoryId" });
    expect(await screen.findByText("Esta categoría todavía no tiene subcategorías.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Subcategorías" })).toBeInTheDocument();
  });

  it("crea y edita subcategorías", async () => {
    api.createSubcategory.mockResolvedValue({});
    api.updateSubcategory.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva subcategoría/ }));
    expect(within(dialogFor()).getByText("Alumbrado")).toBeInTheDocument();
    fireEvent.change(within(dialogFor()).getByLabelText(/Nombre/), { target: { value: "Nueva sub" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear subcategoría" }));
    await waitFor(() => expect(api.createSubcategory).toHaveBeenCalledWith({ categoryId: 1, name: "Nueva sub", description: null }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByLabelText("Editar")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.updateSubcategory).toHaveBeenCalledWith(10, expect.objectContaining({ name: "Alumbrado público" })));
  });

  it("muestra el error al guardar", async () => {
    api.createSubcategory.mockRejectedValue(httpError(400, "Datos inválidos"));
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva subcategoría/ }));
    fireEvent.change(within(dialogFor()).getByLabelText(/Nombre/), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear subcategoría" }));
    expect(await screen.findByText("Datos inválidos")).toBeInTheDocument();
  });

  it("activa y desactiva subcategorías", async () => {
    api.deactivateSubcategory.mockResolvedValue({ ...subs[0], active: false });
    api.activateSubcategory.mockResolvedValue({ ...subs[1], active: true });
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar"));
    await waitFor(() => expect(api.deactivateSubcategory).toHaveBeenCalledWith(10));
    fireEvent.click(screen.getAllByLabelText("Activar")[1]);
    await waitFor(() => expect(api.activateSubcategory).toHaveBeenCalledWith(11));
  });

  it("muestra el error al cambiar el estado", async () => {
    api.deactivateSubcategory.mockRejectedValue(httpError(403));
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar"));
    expect(await screen.findByText(/No tenés permiso/)).toBeInTheDocument();
  });

  it("con la categoría inactiva bloquea crear, editar y activar", async () => {
    await renderPage([{ id: 1, name: "Alumbrado", active: false }]);
    expect(screen.getByRole("button", { name: /Nueva subcategoría/ })).toBeDisabled();
    expect(screen.getByText(/La categoría “Alumbrado” está inactiva/)).toBeInTheDocument();
    expect(screen.getAllByLabelText("No se puede editar: la categoría está inactiva.")[0]).toBeDisabled();
    expect(screen.getByLabelText("Activá primero la categoría.")).toBeDisabled();
    expect(api.activateSubcategory).not.toHaveBeenCalled();
  });
});

describe("RequestTypesPage", () => {
  const subcategory = { id: 10, name: "Alumbrado público", categoryName: "Alumbrado", active: true };
  const types = [
    { id: 100, code: "LUM", name: "Luminaria apagada", description: "Falta luz", active: true, ticketType: "COMPLAINT", responsibleAreaId: "M6", minimumPriority: "LOW", baseRisk: "LOW", affectedPopulationFactor: 0.1, allowsAnonymous: false, requiresLocation: true },
    { id: 101, code: "SEM", name: "Semáforo", description: "", active: false },
  ];
  const renderPage = async (sub = subcategory) => {
    api.fetchAdminSubcategories.mockResolvedValue([sub]);
    api.fetchAdminRequestTypes.mockResolvedValue(types);
    const view = renderWithProviders(<RequestTypesPage />, { route: "/agente/catalogo/1/10", path: "/agente/catalogo/:categoryId/:subcategoryId" });
    await screen.findByText("Luminaria apagada");
    return view;
  };

  it("lista los tipos de solicitud con su código y estado", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { name: /Tipos de solicitud de Alumbrado público/ })).toBeInTheDocument();
    expect(screen.getByText("LUM")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alumbrado" })).toBeInTheDocument();
  });

  it("vuelve a las subcategorías", async () => {
    await renderPage();
    fireEvent.click(screen.getByText("Volver a subcategorías"));
    expect(screen.getByTestId("location")).toHaveTextContent("/agente/catalogo/1");
  });

  it("muestra el error de carga y tolera respuestas vacías", async () => {
    api.fetchAdminSubcategories.mockRejectedValue(httpError(500, "Rota"));
    api.fetchAdminRequestTypes.mockResolvedValue([]);
    renderWithProviders(<RequestTypesPage />, { route: "/agente/catalogo/1/10", path: "/agente/catalogo/:categoryId/:subcategoryId" });
    expect(await screen.findByText("Rota")).toBeInTheDocument();
  });

  it("tolera respuestas que no son arreglos", async () => {
    api.fetchAdminSubcategories.mockResolvedValue(null);
    api.fetchAdminRequestTypes.mockResolvedValue(null);
    renderWithProviders(<RequestTypesPage />, { route: "/agente/catalogo/1/10", path: "/agente/catalogo/:categoryId/:subcategoryId" });
    expect(await screen.findByText("Esta subcategoría todavía no tiene tipos de solicitud.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tipos de solicitud" })).toBeInTheDocument();
  });

  it("crea un tipo de solicitud con todos sus campos", async () => {
    api.createRequestType.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo tipo de solicitud/ }));
    const dialog = dialogFor();
    fireEvent.change(within(dialog).getByLabelText(/^Código/), { target: { value: "NUEVO" } });
    fireEvent.change(within(dialog).getByLabelText(/^Nombre/), { target: { value: "Nuevo tipo" } });
    fireEvent.change(within(dialog).getByLabelText(/^Descripción/), { target: { value: "Desc" } });
    fireEvent.change(within(dialog).getByLabelText(/^Tipo de ticket/), { target: { value: "REQUEST" } });
    fireEvent.change(within(dialog).getByLabelText(/^Área responsable/), { target: { value: "M3" } });
    fireEvent.change(within(dialog).getByLabelText(/^Prioridad mínima/), { target: { value: "HIGH" } });
    fireEvent.change(within(dialog).getByLabelText(/^Riesgo base/), { target: { value: "MEDIUM" } });
    fireEvent.change(within(dialog).getByLabelText(/^Factor de población afectada/), { target: { value: "0.25" } });
    fireEvent.click(within(dialog).getByLabelText("Permite creación anónima"));
    fireEvent.click(screen.getByRole("button", { name: "Crear tipo de solicitud" }));
    await waitFor(() =>
      expect(api.createRequestType).toHaveBeenCalledWith({
        subcategoryId: 10,
        code: "NUEVO",
        name: "Nuevo tipo",
        description: "Desc",
        ticketType: "REQUEST",
        responsibleAreaId: "M3",
        minimumPriority: "HIGH",
        baseRisk: "MEDIUM",
        affectedPopulationFactor: 0.25,
        allowsAnonymous: true,
        requiresLocation: false,
      })
    );
  });

  it("edita un tipo existente", async () => {
    api.updateRequestType.mockResolvedValue({});
    await renderPage();
    fireEvent.click(screen.getAllByLabelText("Editar")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(api.updateRequestType).toHaveBeenCalledWith(100, expect.objectContaining({ code: "LUM" })));
  });

  it("muestra el error de guardado", async () => {
    api.updateRequestType.mockRejectedValue(httpError(409, "Código duplicado"));
    await renderPage();
    fireEvent.click(screen.getAllByLabelText("Editar")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Código duplicado")).toBeInTheDocument();
  });

  it("activa y desactiva tipos y muestra el error de estado", async () => {
    api.deactivateRequestType.mockResolvedValueOnce({ ...types[0], active: false }).mockRejectedValueOnce(httpError(403));
    api.activateRequestType.mockResolvedValue({ ...types[1], active: true });
    await renderPage();
    fireEvent.click(screen.getByLabelText("Desactivar"));
    await waitFor(() => expect(api.deactivateRequestType).toHaveBeenCalledWith(100));
    fireEvent.click(screen.getAllByLabelText("Activar")[1]);
    await waitFor(() => expect(api.activateRequestType).toHaveBeenCalledWith(101));
    fireEvent.click(screen.getAllByLabelText("Desactivar")[0]);
    expect(await screen.findByText(/No tenés permiso/)).toBeInTheDocument();
  });

  it("abre y cierra el editor de formulario del trámite", async () => {
    await renderPage();
    fireEvent.click(screen.getByLabelText("Editar formulario de Luminaria apagada"));
    expect(screen.getByText("Schema de Luminaria apagada")).toBeInTheDocument();
    fireEvent.click(screen.getByText("cerrar-schema"));
    expect(screen.queryByText("Schema de Luminaria apagada")).not.toBeInTheDocument();
  });

  it("con la subcategoría inactiva bloquea crear, editar y activar", async () => {
    await renderPage({ ...subcategory, active: false });
    expect(screen.getByRole("button", { name: /Nuevo tipo de solicitud/ })).toBeDisabled();
    expect(screen.getByText(/La subcategoría “Alumbrado público” está inactiva/)).toBeInTheDocument();
    expect(screen.getAllByLabelText("No se puede editar: la subcategoría está inactiva.")[0]).toBeDisabled();
    expect(screen.getByLabelText("Activá primero la subcategoría.")).toBeDisabled();
  });
});
