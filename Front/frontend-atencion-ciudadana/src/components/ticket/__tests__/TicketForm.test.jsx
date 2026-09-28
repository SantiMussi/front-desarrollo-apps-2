import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TicketForm from "../TicketForm";
import { createTicket, fetchRequestTypeForm } from "../../../services/apiClient";
import { CITIZEN, authFor, makeAuth, renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("../../../services/apiClient", () => ({
  createTicket: vi.fn(),
  fetchRequestTypeForm: vi.fn(),
}));

const UUID = "11111111-1111-4111-8111-111111111111";

vi.mock("../../../hooks/useNeighborhoods", () => ({
  useNeighborhoods: () => ({
    neighborhoods: [
      { id: "11111111-1111-4111-8111-111111111111", name: "Palermo" },
      { id: "legacy-2", name: "Belgrano" },
    ],
  }),
}));

vi.mock("../../ui/LocationMap", () => ({
  default: ({ onLocationSelect, address, streetNumber, addressSource, latitude, longitude, disabled }) => (
    <div data-testid="map" data-source={addressSource ?? ""} data-lat={latitude ?? ""} data-lng={longitude ?? ""} data-disabled={String(Boolean(disabled))}>
      <span>{`${address}|${streetNumber}`}</span>
      <button type="button" onClick={() => onLocationSelect({ lat: -34.6, lng: -58.4, address: "Av. Corrientes 1234", street: "Av. Corrientes", streetNumber: "1234", neighborhoods: ["Palermo"], source: "map" })}>
        map-click
      </button>
      <button type="button" onClick={() => onLocationSelect({ lat: -34.5, lng: -58.5, neighborhoods: [null, "Belgrano"], source: "geocode" })}>
        geocode
      </button>
      <button type="button" onClick={() => onLocationSelect({ lat: 1, lng: 2, address: "Calle Sola", neighborhoods: ["Inexistente"], source: "map" })}>
        map-no-street
      </button>
      <button type="button" onClick={() => onLocationSelect({ lat: 3, lng: 4, neighborhoods: [], source: "map" })}>
        map-empty
      </button>
    </div>
  ),
}));

const requestType = (overrides = {}) => ({
  id: 12,
  code: "12",
  name: "Luminaria apagada",
  description: "Informá una luminaria",
  allowsAnonymous: false,
  ...overrides,
});

const clipboard = { writeText: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  fetchRequestTypeForm.mockResolvedValue({ fields: [] });
  createTicket.mockResolvedValue({ trackingCode: "ABC123" });
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
});

const setup = async (props = {}, { auth = authFor(CITIZEN), route = "/" } = {}) => {
  const callbacks = { onBack: vi.fn(), onNewTicket: vi.fn(), onDirtyChange: vi.fn(), onStatusChange: vi.fn() };
  const view = renderWithProviders(<TicketForm requestType={requestType()} {...callbacks} {...props} />, { auth, route });
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  return { ...view, ...callbacks };
};

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillBasics = () => {
  type(/Título/, "Luminaria rota");
  type(/Descripción detallada/, "La luminaria lleva una semana apagada");
  type(/^Calle/, "Av. Corrientes");
  type(/^Altura/, "1234");
  fireEvent.click(screen.getByText("map-click"));
};

const submitForm = () => fireEvent.submit(screen.getByRole("button", { name: /Enviar solicitud/ }).closest("form"));

describe("TicketForm - estructura", () => {
  it("muestra el tipo de solicitud y avisa que no admite anonimato a los visitantes", async () => {
    await setup({}, { auth: makeAuth() });
    expect(screen.getByText("Luminaria apagada")).toBeInTheDocument();
    expect(screen.getByText("Informá una luminaria")).toBeInTheDocument();
    expect(screen.getByText(/no admite presentación anónima/)).toBeInTheDocument();
  });

  it("no muestra ese aviso a usuarios con sesión", async () => {
    await setup();
    expect(screen.queryByText(/no admite presentación anónima/)).not.toBeInTheDocument();
  });

  it("el botón de enviar está deshabilitado hasta completar todo (incluida la ubicación en el mapa)", async () => {
    await setup();
    const submit = screen.getByRole("button", { name: /Enviar solicitud/ });
    expect(submit).toBeDisabled();
    type(/Título/, "Título");
    type(/Descripción detallada/, "Descripción larga suficiente");
    type(/^Calle/, "Corrientes");
    type(/^Altura/, "100");
    fireEvent.click(screen.getByText("Seleccionar..."));
    fireEvent.click(screen.getByRole("button", { name: "Palermo" }));
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByText("map-click"));
    expect(submit).toBeEnabled();
  });

  it("vuelve con el botón Volver", async () => {
    const { onBack } = await setup();
    fireEvent.click(screen.getByRole("button", { name: /Volver/ }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("escribir la calle o la altura invalida las coordenadas y marca el origen como texto", async () => {
    await setup();
    fireEvent.click(screen.getByText("map-click"));
    expect(screen.getByTestId("map")).toHaveAttribute("data-lat", "-34.6");
    type(/^Calle/, "Otra calle");
    expect(screen.getByTestId("map")).toHaveAttribute("data-source", "input");
    expect(screen.getByTestId("map")).toHaveAttribute("data-lat", "");
    expect(screen.getByTestId("map")).toHaveAttribute("data-disabled", "false");
  });
});

describe("TicketForm - validaciones", () => {
  it("muestra todos los errores al enviar vacío", async () => {
    await setup();
    submitForm();
    expect(screen.getByText("El título / resumen es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La descripción es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La calle es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La altura es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("Seleccioná un barrio")).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("exige 10 caracteres en la descripción y limpia el error al escribir", async () => {
    await setup();
    type(/Descripción detallada/, "corta");
    submitForm();
    expect(screen.getByText("La descripción debe tener al menos 10 caracteres")).toBeInTheDocument();
    type(/Descripción detallada/, "ya es suficientemente larga");
    expect(screen.queryByText("La descripción debe tener al menos 10 caracteres")).not.toBeInTheDocument();
  });

  it("completa calle, altura y barrio desde el mapa y limpia esos errores", async () => {
    await setup();
    submitForm();
    fireEvent.click(screen.getByText("map-click"));
    expect(screen.queryByText("La calle es obligatoria")).not.toBeInTheDocument();
    expect(screen.queryByText("La altura es obligatoria")).not.toBeInTheDocument();
    expect(screen.queryByText("Seleccioná un barrio")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Calle/)).toHaveValue("Av. Corrientes");
    expect(screen.getByLabelText(/^Altura/)).toHaveValue("1234");
  });

  it("acepta un resultado de geocodificación por dirección sin pisar los campos y usa el segundo barrio", async () => {
    await setup();
    type(/^Calle/, "Mi calle");
    fireEvent.click(screen.getByText("geocode"));
    expect(screen.getByLabelText(/^Calle/)).toHaveValue("Mi calle");
    expect(screen.getByTestId("map")).toHaveAttribute("data-source", "geocode");
    expect(screen.getByText("Belgrano")).toBeInTheDocument();
  });

  it("usa el nombre del lugar como calle y no cambia el barrio si no hay coincidencia", async () => {
    await setup();
    fireEvent.click(screen.getByText("map-no-street"));
    expect(screen.getByLabelText(/^Calle/)).toHaveValue("Calle Sola");
    expect(screen.getByLabelText(/^Altura/)).toHaveValue("");
    expect(screen.getByText("Seleccionar...")).toBeInTheDocument();
    fireEvent.click(screen.getByText("map-empty"));
    expect(screen.getByLabelText(/^Calle/)).toHaveValue("Calle Sola");
  });
});

describe("TicketForm - envío con sesión", () => {
  it("arma el payload completo y muestra el código de seguimiento", async () => {
    const { onStatusChange, onDirtyChange } = await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("¡Reclamo Registrado!")).toBeInTheDocument();
    expect(createTicket).toHaveBeenCalledWith(
      {
        requestTypeId: 12,
        summary: "Luminaria rota",
        description: "La luminaria lleva una semana apagada",
        formData: {},
        location: {
          addressLine: "Av. Corrientes 1234",
          street: "Av. Corrientes",
          streetNumber: "1234",
          neighborhoodId: UUID,
          latitude: -34.6,
          longitude: -58.4,
          reference: "",
        },
      },
      [],
      { skipAuth: false }
    );
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(onStatusChange).toHaveBeenLastCalledWith("success");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("envía una referencia con el barrio cuando el id no es un UUID", async () => {
    await setup();
    type(/Título/, "Título");
    type(/Descripción detallada/, "Descripción larga suficiente");
    type(/^Calle/, "Corrientes");
    type(/^Altura/, "100");
    fireEvent.click(screen.getByText("Seleccionar..."));
    fireEvent.click(screen.getByRole("button", { name: "Belgrano" }));
    fireEvent.click(screen.getByText("map-click"));
    fireEvent.click(screen.getByText("Palermo"));
    fireEvent.click(screen.getByRole("button", { name: "Belgrano" }));
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][0].location).toMatchObject({ neighborhoodId: null, reference: "Barrio: Belgrano" });
  });

  it("adjunta archivos y permite quitarlos", async () => {
    const { container } = await setup();
    fillBasics();
    const input = container.querySelector('input[type="file"]');
    const first = new File(["a"], "a.png", { type: "image/png" });
    const second = new File(["b"], "b.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [first, second] } });
    expect(screen.getByText("a.png")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Eliminar b.pdf"));
    expect(screen.queryByText("b.pdf")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][1]).toEqual([expect.objectContaining({ name: "a.png", file: first })]);
  });

  it("muestra el error del servidor y permite reintentar o descartarlo", async () => {
    createTicket.mockRejectedValueOnce(Object.assign(new Error("Datos inválidos"), { status: 422 }));
    const { onStatusChange } = await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("Datos inválidos")).toBeInTheDocument();
    expect(onStatusChange).toHaveBeenLastCalledWith("error");
    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByText("¡Reclamo Registrado!")).toBeInTheDocument();
    expect(createTicket).toHaveBeenCalledTimes(2);
  });

  it("puede descartar el aviso de error", async () => {
    createTicket.mockRejectedValueOnce(Object.assign(new Error("Falla"), { status: 500 }));
    await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("Falla");
    fireEvent.click(screen.getByLabelText("Cerrar"));
    await waitFor(() => expect(screen.queryByText("Falla")).not.toBeInTheDocument());
  });

  it("pide evidencia cuando el backend lo exige y permite completar o ir al inicio", async () => {
    createTicket.mockRejectedValueOnce(Object.assign(new Error("Evidencia"), { code: "EVIDENCE_REQUIRED" }));
    await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("Información adicional requerida")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Guardar como borrador"));
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    fireEvent.click(screen.getByText("Completar información"));
    expect(await screen.findByRole("button", { name: /Enviar solicitud/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toHaveValue("Luminaria rota");
  });

  it("la pantalla de evidencia ofrece el enlace a políticas", async () => {
    createTicket.mockRejectedValueOnce(Object.assign(new Error("Evidencia"), { code: "EVIDENCE_REQUIRED" }));
    await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("Ver políticas de seguridad y riesgo")).toBeInTheDocument();
  });

  it("copia el código, navega al seguimiento y ofrece un nuevo reclamo o volver al inicio", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { onNewTicket } = await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    fireEvent.click(screen.getByLabelText("Copiar código"));
    expect(clipboard.writeText).toHaveBeenCalledWith("ABC123");
    act(() => vi.advanceTimersByTime(2100));
    vi.useRealTimers();
    fireEvent.click(screen.getByText("Nuevo reclamo"));
    expect(onNewTicket).toHaveBeenCalledOnce();
  });

  it("navega al seguimiento y al inicio desde la confirmación", async () => {
    await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    fireEvent.click(screen.getByText("Ver estado del reclamo"));
    expect(screen.getByTestId("location")).toHaveTextContent("/seguimiento");
    fireEvent.click(screen.getByText("Volver al inicio"));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });
});

describe("TicketForm - visitantes y anonimato", () => {
  it("pide iniciar sesión antes de enviar y reenvía al autenticarse", async () => {
    const auth = makeAuth();
    await setup({}, { auth });
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("Iniciá sesión para enviar tu reclamo")).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { name: "username", value: "a@b.c" } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { name: "password", value: "secreta" } });
    fireEvent.click(screen.getByText("Iniciar sesión y enviar"));
    await waitFor(() => expect(createTicket).toHaveBeenCalledOnce());
    expect(await screen.findByText("¡Reclamo Registrado!")).toBeInTheDocument();
  });

  it("puede cerrar el aviso de inicio de sesión", async () => {
    await setup({}, { auth: makeAuth() });
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("Iniciá sesión para enviar tu reclamo");
    fireEvent.click(screen.getAllByLabelText("Cerrar")[0]);
    await waitFor(() => expect(screen.queryByText("Iniciá sesión para enviar tu reclamo")).not.toBeInTheDocument());
  });

  it("envía de forma anónima con contacto por email y contraseña propia", async () => {
    await setup({ requestType: requestType({ allowsAnonymous: true }) }, { auth: makeAuth() });
    expect(screen.getByText(/Enviá sin crear una cuenta/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    type("Canal de contacto", "vecina@example.test");
    fireEvent.change(screen.getByLabelText("Contraseña del ticket"), { target: { name: "ticketPassword", value: "  claveSegura1  " } });
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("¡Reclamo Registrado!")).toBeInTheDocument();
    const [payload, , options] = createTicket.mock.calls[0];
    expect(options).toEqual({ skipAuth: true });
    expect(payload).toMatchObject({
      anonymousContact: { channel: "EMAIL", value: "vecina@example.test" },
      anonymousAccessPassword: "claveSegura1",
    });
    expect(screen.getByText("claveSegura1")).toBeInTheDocument();
    expect(screen.getByText(/Es la que elegiste/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Copiar contraseña"));
    expect(clipboard.writeText).toHaveBeenCalledWith("claveSegura1");
  });

  it("acepta un teléfono, sin contraseña propia, y muestra la generada", async () => {
    createTicket.mockResolvedValue({ trackingCode: "ZZZ", generatedAnonymousAccessPassword: "Generada99" });
    await setup({ requestType: requestType({ allowsAnonymous: true }) }, { auth: authFor(CITIZEN) });
    expect(screen.getByText(/no quedará ligado a tu cuenta/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    type("Canal de contacto", "+54 11 5555-1234");
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][0]).toMatchObject({
      anonymousContact: { channel: "PHONE", value: "+54 11 5555-1234" },
      anonymousAccessPassword: null,
    });
    expect(screen.getByText("Generada99")).toBeInTheDocument();
    expect(screen.getByText(/Generada automáticamente/)).toBeInTheDocument();
  });

  it("envía anonimato sin canal de contacto", async () => {
    await setup({ requestType: requestType({ allowsAnonymous: true }) }, { auth: makeAuth() });
    fireEvent.click(screen.getByRole("switch"));
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][0].anonymousContact).toBeNull();
  });

  it("valida el canal de contacto y la longitud de la contraseña", async () => {
    await setup({ requestType: requestType({ allowsAnonymous: true }) }, { auth: makeAuth() });
    fireEvent.click(screen.getByRole("switch"));
    type("Canal de contacto", "no-es-contacto");
    fireEvent.change(screen.getByLabelText("Contraseña del ticket"), { target: { name: "ticketPassword", value: "corta" } });
    submitForm();
    expect(screen.getByText("Ingresá un email o teléfono válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.queryByLabelText("Contraseña del ticket")).not.toBeInTheDocument();
  });
});

describe("TicketForm - campos específicos", () => {
  const backendFields = [
    { code: "cantidad", label: "Cantidad", type: "NUMBER", required: true, displayOrder: 2 },
    { code: "riesgo", label: "¿Hay riesgo?", type: "BOOLEAN", required: true, allowUnknown: true, displayOrder: 1 },
    { code: "tipo", label: "Tipo de falla", type: "SELECT", required: false, displayOrder: 3, config: { options: [{ value: "A", label: "Opción A" }], placeholder: "Elegí" } },
    { code: "detalle", label: "Detalle extra", type: "TEXTAREA", displayOrder: 4 },
    { code: "fecha", label: "Fecha del hecho", type: "DATE", displayOrder: 5 },
    { code: "libre", label: "Texto libre", type: "TEXT", displayOrder: 6, config: { placeholder: "Escribí" } },
    { label: "Sin código", type: "RARO", displayOrder: 7 },
    { label: "Sin código", displayOrder: 8 },
  ];

  it("carga los campos del backend, los ordena y los muestra", async () => {
    fetchRequestTypeForm.mockResolvedValue({ fields: backendFields });
    await setup();
    expect(fetchRequestTypeForm).toHaveBeenCalledWith("12");
    expect(await screen.findByText("Datos específicos")).toBeInTheDocument();
    const labels = screen.getAllByText(/Cantidad|¿Hay riesgo\?|Tipo de falla/).map((node) => node.textContent);
    expect(labels[0]).toMatch(/¿Hay riesgo\?/);
    expect(screen.getByPlaceholderText("Escribí")).toBeInTheDocument();
    expect(screen.getAllByText("Sin código")).toHaveLength(2);
  });

  it.each([
    ["un arreglo", backendFields.slice(0, 1).map((f) => ({ ...f }))],
    ["data", { data: [{ code: "x", label: "Campo X", type: "TEXT" }] }],
  ])("acepta la respuesta del formulario como %s", async (_case, response) => {
    fetchRequestTypeForm.mockResolvedValue(response);
    await setup();
    expect(await screen.findByText("Datos específicos")).toBeInTheDocument();
  });

  it("usa el id cuando el tipo no tiene código", async () => {
    await setup({ requestType: requestType({ code: undefined }) });
    expect(fetchRequestTypeForm).toHaveBeenCalledWith(12);
  });

  it("no consulta el backend si el tipo ya trae los campos", async () => {
    await setup({ requestType: requestType({ specificFields: [{ key: "k", code: "k", label: "Campo local", type: "TEXT" }] }) });
    expect(fetchRequestTypeForm).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Campo local/)).toBeInTheDocument();
  });

  it("un 404 significa que no hay campos específicos", async () => {
    fetchRequestTypeForm.mockRejectedValue(Object.assign(new Error("no"), { status: 404 }));
    await setup();
    expect(screen.queryByText("Datos específicos")).not.toBeInTheDocument();
    expect(screen.queryByText(/No se pudieron cargar/)).not.toBeInTheDocument();
  });

  it.each([
    ["una forma desconocida", { otra: 1 }, undefined],
    ["un error de red", undefined, Object.assign(new Error("boom"), { status: 500 })],
  ])("ante %s muestra el error, bloquea el envío y permite reintentar", async (_case, response, error) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    if (error) fetchRequestTypeForm.mockRejectedValueOnce(error);
    else fetchRequestTypeForm.mockResolvedValueOnce(response);
    await setup();
    expect(await screen.findByText("No se pudieron cargar los campos del formulario")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar solicitud/ })).toBeDisabled();
    submitForm();
    expect(createTicket).not.toHaveBeenCalled();
    fetchRequestTypeForm.mockResolvedValueOnce({ fields: [{ code: "ok", label: "Campo OK", type: "TEXT" }] });
    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByLabelText(/Campo OK/)).toBeInTheDocument();
  });

  it("valida los obligatorios y permite marcar 'No sé'", async () => {
    fetchRequestTypeForm.mockResolvedValue({
      fields: [
        { code: "cantidad", label: "Cantidad", type: "NUMBER", required: true },
        { code: "riesgo", label: "Riesgo", type: "TEXT", required: true, allowUnknown: true },
      ],
    });
    await setup();
    await screen.findByText("Datos específicos");
    submitForm();
    expect(screen.getByText("Cantidad es obligatorio")).toBeInTheDocument();
    expect(screen.getByText(/Respondé "Riesgo" o marcá/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/No sé/));
    expect(screen.queryByText(/Respondé "Riesgo"/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Riesgo/, { selector: "input#specific_riesgo" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/No sé/));
    expect(screen.getByLabelText(/Riesgo/, { selector: "input#specific_riesgo" })).not.toBeDisabled();
  });

  it("mapea los valores específicos al formato del backend", async () => {
    fetchRequestTypeForm.mockResolvedValue({
      fields: [
        { code: "cantidad", label: "Cantidad", type: "NUMBER", required: true, displayOrder: 1 },
        { code: "riesgo", label: "Hay riesgo", type: "BOOLEAN", required: true, displayOrder: 2 },
        { code: "tipo", label: "Tipo", type: "SELECT", displayOrder: 3, config: { options: [{ value: "A", label: "Opción A" }] } },
        { code: "nosabe", label: "No lo sé", type: "TEXT", allowUnknown: true, displayOrder: 4 },
        { code: "opcional", label: "Opcional", type: "TEXT", displayOrder: 5 },
        { code: "ignorado", label: "Ignorado", type: "TEXT", allowUnknown: false, displayOrder: 6 },
      ],
    });
    await setup();
    await screen.findByText("Datos específicos");
    fillBasics();
    fireEvent.change(screen.getByLabelText(/Cantidad/), { target: { name: "specific_cantidad", value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Sí" }));
    fireEvent.change(screen.getByLabelText(/^Tipo/), { target: { name: "specific_tipo", value: "A" } });
    fireEvent.click(screen.getAllByLabelText(/No sé/)[0]);
    fireEvent.change(screen.getByLabelText(/^Opcional/), { target: { name: "specific_opcional", value: "" } });
    fireEvent.change(screen.getByLabelText(/^Ignorado/), { target: { name: "specific_ignorado", value: "algo" } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][0].formData).toEqual({ cantidad: 7, riesgo: true, tipo: "A", nosabe: null, ignorado: "algo" });
  });

  it("descarta un número inválido y los valores 'no sé' en campos que no lo permiten", async () => {
    fetchRequestTypeForm.mockResolvedValue({
      fields: [
        { code: "cantidad", label: "Cantidad", type: "NUMBER", displayOrder: 1 },
        { code: "riesgo", label: "Riesgo", type: "BOOLEAN", displayOrder: 2 },
      ],
    });
    await setup();
    await screen.findByText("Datos específicos");
    fillBasics();
    fireEvent.change(screen.getByLabelText(/Cantidad/), { target: { name: "specific_cantidad", value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    await screen.findByText("¡Reclamo Registrado!");
    expect(createTicket.mock.calls[0][0].formData).toEqual({ riesgo: false });
  });
});

describe("TicketForm - callbacks de estado", () => {
  it("informa cuando el formulario tiene cambios sin guardar", async () => {
    const { onDirtyChange } = await setup();
    await waitFor(() => expect(onDirtyChange).toHaveBeenCalledWith(false));
    type(/Título/, "Algo");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    type(/Título/, "");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    type(/^Calle/, "Calle");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it("funciona sin callbacks opcionales", async () => {
    renderWithProviders(<TicketForm requestType={requestType()} onBack={() => {}} onNewTicket={() => {}} />, { auth: authFor(CITIZEN) });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    type(/Título/, "Algo");
  });

  it("marca el envío en curso y deshabilita los campos", async () => {
    let resolve;
    createTicket.mockReturnValue(new Promise((res) => (resolve = res)));
    await setup();
    fillBasics();
    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitud/ }));
    expect(await screen.findByText("Enviando...")).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Volver/ })).toBeDisabled();
    await act(async () => resolve({ trackingCode: "LATE" }));
    expect(await screen.findByText("LATE")).toBeInTheDocument();
  });

  it("ignora el resultado de la carga de campos si se desmonta", async () => {
    let resolve;
    fetchRequestTypeForm.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = renderWithProviders(<TicketForm requestType={requestType()} onBack={() => {}} onNewTicket={() => {}} />, { auth: authFor(CITIZEN) });
    unmount();
    await act(async () => resolve({ fields: [] }));
    fetchRequestTypeForm.mockRejectedValue(new Error("x"));
    const second = renderWithProviders(<TicketForm requestType={requestType({ id: 99, code: "99" })} onBack={() => {}} onNewTicket={() => {}} />, { auth: authFor(CITIZEN) });
    second.unmount();
    await act(async () => {});
  });
});
