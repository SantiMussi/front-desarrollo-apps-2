import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiTicketTextReview from "../AiTicketTextReview";
import { classifyTicketText } from "../../../services/apiClient";

vi.mock("../../../services/apiClient", () => ({ classifyTicketText: vi.fn() }));

const catalog = [
  {
    id: "1",
    title: "Alumbrado",
    subcategories: [{ id: "10", name: "Luminarias", requestTypes: [{ id: 101, code: "101", name: "Luminaria apagada", description: "" }] }],
  },
  {
    id: "2",
    title: "Calles y veredas",
    subcategories: [{ id: "20", name: "Calzada", requestTypes: [{ id: 201, code: "201", name: "Bache en la calzada", description: "" }] }],
  },
];

const LONG_TEXT = "Hace una semana que la luz de la esquina no prende y está muy oscuro";
const bache = { id: 201, code: "201", name: "Bache en la calzada" };

function setup(props = {}) {
  const onChangeRequestType = vi.fn();
  const utils = render(
    <AiTicketTextReview summary="Luz" description={LONG_TEXT} requestType={bache} catalog={catalog}
      onChangeRequestType={onChangeRequestType} {...props} />,
  );
  return { onChangeRequestType, ...utils };
}

const review = () => fireEvent.click(screen.getByRole("button", { name: /Revisar mi reclamo/ }));

beforeEach(() => vi.clearAllMocks());

describe("AiTicketTextReview", () => {
  it("no consulta nada hasta que la persona lo pide y exige un mínimo de texto", () => {
    setup({ description: "corto" });
    expect(screen.getByRole("button", { name: /Revisar mi reclamo/ })).toBeDisabled();
    expect(screen.getByText(/Escribí al menos 20 caracteres/)).toBeInTheDocument();
    expect(classifyTicketText).not.toHaveBeenCalled();
  });

  it("envía sólo título, descripción y tipo elegido", async () => {
    classifyTicketText.mockResolvedValue({ source: "AI", quality: "OK", mismatch: false, suggestedRequestTypeId: 201 });
    setup();
    review();
    await screen.findByText(/coincide con lo que escribiste/);
    expect(classifyTicketText).toHaveBeenCalledWith({ summary: "Luz", description: LONG_TEXT, requestTypeId: 201 });
  });

  it("avisa que el tema parece otro y permite cambiarlo", async () => {
    classifyTicketText.mockResolvedValue({
      source: "AI", quality: "OK", mismatch: true, suggestedRequestTypeId: 101, reason: "Habla de una luz que no prende.",
    });
    const { onChangeRequestType } = setup();
    review();

    expect(await screen.findByText(/parece corresponder a/)).toHaveTextContent("Luminaria apagada (Alumbrado)");
    expect(screen.getByText(/Habla de una luz que no prende/)).toBeInTheDocument();
    expect(screen.getByText(/Sugerencia automática con inteligencia artificial/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cambiar a «Luminaria apagada»/ }));
    expect(onChangeRequestType).toHaveBeenCalledWith(101);
  });

  it("respeta la decisión de mantener el tipo elegido", async () => {
    classifyTicketText.mockResolvedValue({ source: "AI", quality: "OK", mismatch: true, suggestedRequestTypeId: 101 });
    const { onChangeRequestType } = setup();
    review();
    fireEvent.click(await screen.findByRole("button", { name: "Mantener mi elección" }));

    expect(screen.queryByText(/parece corresponder a/)).not.toBeInTheDocument();
    expect(screen.queryByText(/coincide con lo que escribiste/)).not.toBeInTheDocument();
    expect(onChangeRequestType).not.toHaveBeenCalled();
  });

  it("avisa cuando el texto es poco claro o no es un tema municipal", async () => {
    classifyTicketText.mockResolvedValue({ source: "AI", quality: "TOO_VAGUE", mismatch: false, suggestedRequestTypeId: null });
    const { unmount } = setup();
    review();
    expect(await screen.findByText(/Es difícil entender qué querés reclamar/)).toBeInTheDocument();
    unmount();

    classifyTicketText.mockResolvedValue({ source: "AI", quality: "OFF_TOPIC", mismatch: false, suggestedRequestTypeId: null });
    setup();
    review();
    expect(await screen.findByText(/no parece un tema de servicios municipales/)).toBeInTheDocument();
  });

  it("sin IA disponible usa la búsqueda por palabras clave y lo aclara", async () => {
    classifyTicketText.mockResolvedValue({ source: "UNAVAILABLE" });
    const { onChangeRequestType } = setup({ description: "La luz de la esquina no prende hace una semana" });
    review();

    expect(await screen.findByText(/parece corresponder a/)).toHaveTextContent("Luminaria apagada");
    expect(screen.getByText(/Sugerencia por palabras clave/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Cambiar a/ }));
    expect(onChangeRequestType).toHaveBeenCalledWith(101);
  });

  it("si el servidor falla o limita los pedidos igual responde con las reglas", async () => {
    classifyTicketText.mockRejectedValue(Object.assign(new Error("lento"), { status: 429 }));
    setup({ description: "La luz de la esquina no prende hace una semana" });
    review();

    expect(await screen.findByText(/Hiciste muchas revisiones seguidas/)).toBeInTheDocument();
    expect(screen.getByText(/parece corresponder a/)).toBeInTheDocument();
  });

  it("un error de red no rompe el formulario", async () => {
    classifyTicketText.mockRejectedValue(new Error("Failed to fetch"));
    setup({ summary: "", description: "zzzz qqqq wwww kkkk jjjj hhhh" });
    review();

    expect(await screen.findByText(/No encontramos otro tema/)).toBeInTheDocument();
  });

  it("oculta el resultado si el texto cambia después de revisarlo", async () => {
    classifyTicketText.mockResolvedValue({ source: "AI", quality: "OK", mismatch: true, suggestedRequestTypeId: 101 });
    const { rerender } = setup();
    review();
    await screen.findByText(/parece corresponder a/);

    rerender(<AiTicketTextReview summary="Luz" description={`${LONG_TEXT} y además hay un pozo`} requestType={bache}
      catalog={catalog} onChangeRequestType={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText(/parece corresponder a/)).not.toBeInTheDocument());
  });

  it("ante una emergencia muestra el 911 sin depender de la IA", () => {
    setup({ description: "Hay un incendio en el edificio de al lado, necesitamos ayuda" });
    expect(screen.getByRole("alert")).toHaveTextContent(/911/);
    expect(classifyTicketText).not.toHaveBeenCalled();
  });

  it("el texto sugerido por el servidor se muestra como texto, nunca como HTML", async () => {
    classifyTicketText.mockResolvedValue({
      source: "AI", quality: "OK", mismatch: true, suggestedRequestTypeId: 101, reason: "<img src=x onerror=alert(1)>",
    });
    const { container } = setup();
    review();
    await screen.findByText(/parece corresponder a/);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
  });
});
