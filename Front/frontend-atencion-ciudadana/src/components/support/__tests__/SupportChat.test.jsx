import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SupportChat from "../SupportChat";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { useCategories } from "../../../hooks/useCategories";

vi.mock("../../../hooks/useCategories", () => ({ useCategories: vi.fn() }));

const categories = [
  {
    id: "1",
    title: "Alumbrado",
    subcategories: [{ id: "10", name: "Luminarias", requestTypes: [{ id: 101, code: "101", name: "Luminaria apagada", description: "" }] }],
  },
];

const open = () => fireEvent.click(screen.getByRole("button", { name: "Ayuda" }));
const ask = (text) => {
  fireEvent.change(screen.getByLabelText("Escribí tu pregunta"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  useCategories.mockReturnValue({ categories, loading: false, error: null });
});

describe("SupportChat", () => {
  it("no pide el catálogo hasta que se abre", () => {
    renderWithProviders(<SupportChat />);
    expect(useCategories).not.toHaveBeenCalled();
    open();
    expect(useCategories).toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Asistente de ayuda" })).toBeInTheDocument();
    expect(screen.getByText(/no soy una persona ni una inteligencia artificial/i)).toBeInTheDocument();
  });

  it("responde una pregunta frecuente con su acción", () => {
    renderWithProviders(<SupportChat />);
    open();
    ask("¿cómo sigo mi reclamo?");
    expect(screen.getByText(/«Seguimiento»/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a seguimiento" })).toHaveAttribute("href", "/seguimiento");
  });

  it("sugiere un tipo de reclamo y enlaza al formulario", () => {
    renderWithProviders(<SupportChat />);
    open();
    ask("se apagó la luz");
    expect(screen.getByRole("link", { name: /Luminaria apagada/ })).toHaveAttribute(
      "href",
      "/portal-ayuda?category=1&subcategory=10&requestType=101",
    );
  });

  it("las preguntas rápidas responden sin escribir", () => {
    renderWithProviders(<SupportChat />);
    open();
    fireEvent.click(screen.getByRole("button", { name: "¿Qué significa cada estado?" }));
    expect(screen.getByText(/Derivado: lo tiene el área responsable/)).toBeInTheDocument();
  });

  it("avisa de emergencias con los teléfonos", () => {
    renderWithProviders(<SupportChat />);
    open();
    ask("hay un incendio");
    expect(screen.getAllByText(/911/).length).toBeGreaterThan(0);
  });

  it("explica cuando no encuentra nada y cuando el catálogo carga", () => {
    useCategories.mockReturnValue({ categories: [], loading: true, error: null });
    renderWithProviders(<SupportChat />);
    open();
    ask("qwerty");
    expect(screen.getByText(/Todavía estoy cargando los temas/)).toBeInTheDocument();
    useCategories.mockReturnValue({ categories: [], loading: false, error: null });
    ask("asdfgh");
    expect(screen.getByText(/No encontré una respuesta/)).toBeInTheDocument();
  });

  it("no envía mensajes vacíos y se cierra", () => {
    renderWithProviders(<SupportChat />);
    open();
    expect(screen.getByRole("button", { name: "Enviar pregunta" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    expect(screen.getByRole("button", { name: "Ayuda" })).toHaveAttribute("aria-expanded", "false");
  });

  it("cierra el chat al seguir un enlace", () => {
    renderWithProviders(<SupportChat />);
    open();
    ask("se apagó la luz");
    fireEvent.click(screen.getByRole("link", { name: /Luminaria apagada/ }));
    expect(screen.getByRole("button", { name: "Ayuda" })).toHaveAttribute("aria-expanded", "false");
  });
});
