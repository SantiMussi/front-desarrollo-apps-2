import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TicketReviewSummary from "../TicketReviewSummary";

const items = [
  { id: "type", label: "Tipo de solicitud", lines: ["Luminaria apagada"] },
  { id: "summary", label: "Título", lines: ["Luz apagada"], target: '[name="summary"]' },
  { id: "location", label: "Ubicación", lines: ["Av. Santa Fe 1234", "Barrio Palermo"], target: '[name="address"]' },
];

const setup = (props = {}) => {
  const handlers = { onEdit: vi.fn(), onBack: vi.fn(), onConfirm: vi.fn() };
  render(<TicketReviewSummary items={items} {...handlers} {...props} />);
  return handlers;
};

describe("TicketReviewSummary", () => {
  it("muestra todos los datos y avisa que no se pueden modificar luego", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Revisá tu reclamo antes de enviarlo" })).toBeInTheDocument();
    expect(screen.getByText("Luminaria apagada")).toBeInTheDocument();
    expect(screen.getByText("Barrio Palermo")).toBeInTheDocument();
    expect(screen.getByText(/los datos no se pueden modificar/)).toBeInTheDocument();
  });

  it("ofrece Corregir sólo en los datos editables y devuelve su destino", () => {
    const { onEdit } = setup();
    expect(screen.queryByRole("button", { name: "Corregir Tipo de solicitud" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Corregir Ubicación" }));
    expect(onEdit).toHaveBeenCalledWith('[name="address"]');
  });

  it("confirma o vuelve al formulario", () => {
    const { onConfirm, onBack } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar y enviar/ }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /Volver y corregir/ }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("bloquea los botones mientras envía y muestra el aviso recibido", () => {
    setup({ loading: true, notice: <p role="alert">Falló el envío</p> });
    expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Volver y corregir/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Corregir Título" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Falló el envío");
  });
});
